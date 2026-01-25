'use client'

import { useState } from 'react'
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { formatEther, formatUnits, encodeFunctionData, encodeAbiParameters, parseAbiParameters, concat, decodeFunctionResult, toHex } from 'viem'
import { DATA_SUFFIX } from '@/config/builder'

// RPC URL - use Alchemy if provided, otherwise fallback to public RPC
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'

// Uniswap V4 addresses on Base mainnet
const UNISWAP_V4_QUOTER = '0x0d5e0f971ed27fbff6c2837bf31316121532048d' as const
const UNISWAP_UNIVERSAL_ROUTER = '0x6ff5693b99212da76ad316178a184ab56d299b43' as const
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const

// Token addresses - native ETH is address(0) in V4
const NATIVE_ETH = '0x0000000000000000000000000000000000000000' as const
const BLOC = '0x022c6cb9Fd69A99cF030cB43e3c28BF82bF68Fe9' as const

// Pool configuration - ETH is currency0 (lower address), BLOC is currency1
// We'll try different fee tiers to find the pool
const POOL_CONFIGS = [
  { fee: 10000, tickSpacing: 200 },  // 1%
  { fee: 3000, tickSpacing: 60 },    // 0.3%
  { fee: 500, tickSpacing: 10 },     // 0.05%
  { fee: 100, tickSpacing: 1 },      // 0.01%
] as const

let ACTIVE_POOL_CONFIG: { fee: number; tickSpacing: number } = POOL_CONFIGS[0]

// BLOC token has 18 decimals (standard ERC20)
const BLOC_DECIMALS = 18

// 1 quarter = 250 BLOC
const BLOC_PER_QUARTER = BigInt(250) * BigInt(10 ** BLOC_DECIMALS)

// Debug logging
const DEBUG = true
const log = (...args: unknown[]) => DEBUG && console.log('[useSwapEthForBloc V4]', ...args)

// V4 Quoter ABI for quoteExactOutputSingle
// QuoteExactSingleParams: { poolKey, zeroForOne, exactAmount, hookData }
// PoolKey: { currency0, currency1, fee, tickSpacing, hooks }
const quoterV4Abi = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' },
            ],
            name: 'poolKey',
            type: 'tuple',
          },
          { name: 'zeroForOne', type: 'bool' },
          { name: 'exactAmount', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactOutputSingle',
    outputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' },
            ],
            name: 'poolKey',
            type: 'tuple',
          },
          { name: 'zeroForOne', type: 'bool' },
          { name: 'exactAmount', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Universal Router command codes
const COMMANDS = {
  V4_SWAP: 0x10,
  WRAP_ETH: 0x0b,
  UNWRAP_WETH: 0x0c,
} as const

// V4 Router action codes
const ACTIONS = {
  SWAP_EXACT_IN_SINGLE: 6,
  SWAP_EXACT_IN: 7,
  SWAP_EXACT_OUT_SINGLE: 8,
  SWAP_EXACT_OUT: 9,
  SETTLE: 11,
  SETTLE_ALL: 12,
  SETTLE_PAIR: 13,
  TAKE: 14,
  TAKE_ALL: 15,
  TAKE_PORTION: 16,
  TAKE_PAIR: 17,
  CLOSE_CURRENCY: 18,
  SWEEP: 20,
} as const

// Universal Router ABI
const universalRouterAbi = [
  {
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

export function useSwapEthForBloc() {
  const { address, isConnected } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const publicClient = usePublicClient()

  const [quote, setQuote] = useState<{
    ethRequired: bigint
    blocAmount: bigint
    quarters: number
  } | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // Transaction hooks
  const {
    sendTransaction: swap,
    data: swapTxHash,
    isPending: isSwapPending,
    reset: resetSwap,
    error: swapError
  } = useSendTransaction()

  const {
    isLoading: isSwapConfirming,
    isSuccess: isSwapSuccess
  } = useWaitForTransactionReceipt({
    hash: swapTxHash,
  })

  // Build PoolKey for ETH/BLOC pool
  const buildPoolKey = (config: typeof POOL_CONFIGS[number]) => ({
    currency0: NATIVE_ETH,
    currency1: BLOC,
    fee: config.fee,
    tickSpacing: config.tickSpacing,
    hooks: '0x0000000000000000000000000000000000000000' as const, // No hooks
  })

  // Try to get quote with a specific pool config
  const tryQuoteWithConfig = async (blocAmount: bigint, config: typeof POOL_CONFIGS[number]): Promise<bigint | null> => {
    log('Trying pool config:', config)

    const poolKey = buildPoolKey(config)
    log('Pool key:', poolKey)

    // ETH -> BLOC means zeroForOne = true (swapping currency0 for currency1)
    const quoteParams = {
      poolKey,
      zeroForOne: true,
      exactAmount: blocAmount,
      hookData: '0x' as const,
    }

    const callData = encodeFunctionData({
      abi: quoterV4Abi,
      functionName: 'quoteExactOutputSingle',
      args: [quoteParams],
    })

    try {
      if (publicClient) {
        log('Calling V4 Quoter at:', UNISWAP_V4_QUOTER)

        const result = await publicClient.call({
          to: UNISWAP_V4_QUOTER,
          data: callData,
        })

        if (!result.data) {
          log('No data returned for config', config)
          return null
        }

        const decoded = decodeFunctionResult({
          abi: quoterV4Abi,
          functionName: 'quoteExactOutputSingle',
          data: result.data,
        })

        const ethRequired = decoded[0] as bigint
        log('Config', config.fee, 'succeeded! ETH required:', formatEther(ethRequired))
        ACTIVE_POOL_CONFIG = config
        return ethRequired
      } else {
        // Fallback to direct RPC call
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              { to: UNISWAP_V4_QUOTER, data: callData },
              'latest',
            ],
          }),
        })

        const result = await response.json()

        if (result.error || !result.result || result.result === '0x') {
          log('Config', config.fee, 'failed:', result.error?.message || 'empty result')
          return null
        }

        const decoded = decodeFunctionResult({
          abi: quoterV4Abi,
          functionName: 'quoteExactOutputSingle',
          data: result.result,
        })

        const ethRequired = decoded[0] as bigint
        log('Config', config.fee, 'succeeded! ETH required:', formatEther(ethRequired))
        ACTIVE_POOL_CONFIG = config
        return ethRequired
      }
    } catch (err) {
      log('Config', config.fee, 'error:', err instanceof Error ? err.message : 'unknown')
      return null
    }
  }

  // Get quote for exact output (how much ETH for X BLOC)
  const getQuote = async (quarters: number): Promise<bigint | null> => {
    if (quarters <= 0) {
      setQuote(null)
      return null
    }

    setIsQuoting(true)
    setQuoteError(null)

    const blocAmount = BLOC_PER_QUARTER * BigInt(quarters)
    log('Getting V4 quote for', quarters, 'quarters =', formatUnits(blocAmount, BLOC_DECIMALS), 'BLOC')
    log('V4 Quoter address:', UNISWAP_V4_QUOTER)
    log('ETH (currency0):', NATIVE_ETH, 'BLOC (currency1):', BLOC)
    log('Will try pool configs:', POOL_CONFIGS.map(c => `${c.fee/10000}%`).join(', '))

    try {
      // Try each pool config until one works
      let ethRequired: bigint | null = null

      for (const config of POOL_CONFIGS) {
        ethRequired = await tryQuoteWithConfig(blocAmount, config)
        if (ethRequired !== null) {
          break
        }
      }

      if (ethRequired === null) {
        throw new Error('No V4 liquidity pool found for ETH/BLOC at any fee tier')
      }

      // Add 5% slippage buffer
      const ethWithSlippage = (ethRequired * BigInt(105)) / BigInt(100)

      log('ETH required:', formatEther(ethRequired), 'with slippage:', formatEther(ethWithSlippage))
      log('Using pool config:', ACTIVE_POOL_CONFIG.fee/10000, '%')

      setQuote({
        ethRequired: ethWithSlippage,
        blocAmount,
        quarters,
      })

      return ethWithSlippage
    } catch (err) {
      console.error('V4 Quote error:', err)
      log('Quote error details:', err)

      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (errorMessage.includes('liquidity') || errorMessage.includes('pool')) {
        setQuoteError('No V4 liquidity pool found for ETH/BLOC')
      } else {
        setQuoteError('Failed to get V4 price quote: ' + errorMessage)
      }

      setQuote(null)
      return null
    } finally {
      setIsQuoting(false)
    }
  }

  // Execute swap via Universal Router
  const handleSwap = async (quarters: number) => {
    if (!address) {
      setQuoteError('Wallet not connected')
      return
    }

    if (!quote || quarters !== quote.quarters) {
      // Get fresh quote
      const ethRequired = await getQuote(quarters)
      if (!ethRequired) return
    }

    const blocAmount = BLOC_PER_QUARTER * BigInt(quarters)
    const ethToSend = quote?.ethRequired || BigInt(0)

    if (ethToSend === BigInt(0)) {
      setQuoteError('No quote available')
      return
    }

    // Deadline 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

    log('Executing V4 swap via Universal Router')
    log('ETH to send:', formatEther(ethToSend))
    log('BLOC to receive:', formatUnits(blocAmount, BLOC_DECIMALS))
    log('Pool config:', ACTIVE_POOL_CONFIG)

    // Build the V4_SWAP command
    // Actions sequence: SWAP_EXACT_OUT_SINGLE, SETTLE_ALL, TAKE_ALL
    const actions = concat([
      toHex(ACTIONS.SWAP_EXACT_OUT_SINGLE, { size: 1 }),
      toHex(ACTIONS.SETTLE_ALL, { size: 1 }),
      toHex(ACTIONS.TAKE_ALL, { size: 1 }),
    ])

    const poolKey = buildPoolKey(ACTIVE_POOL_CONFIG as typeof POOL_CONFIGS[number])

    // Encode ExactOutputSingleParams for the swap
    // struct ExactOutputSingleParams { PoolKey poolKey, bool zeroForOne, uint128 amountOut, uint128 amountInMaximum, bytes hookData }
    const swapParams = encodeAbiParameters(
      parseAbiParameters('(address,address,uint24,int24,address) poolKey, bool zeroForOne, uint128 amountOut, uint128 amountInMaximum, bytes hookData'),
      [
        [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks],
        true, // zeroForOne: ETH -> BLOC
        blocAmount,
        ethToSend,
        '0x',
      ]
    )

    // Encode SETTLE_ALL params (currency, maxAmount)
    // For native ETH, we're settling with the ETH we sent
    const settleParams = encodeAbiParameters(
      parseAbiParameters('address currency, uint128 maxAmount'),
      [NATIVE_ETH, ethToSend]
    )

    // Encode TAKE_ALL params (currency, minAmount)
    // We want to receive BLOC tokens
    const takeParams = encodeAbiParameters(
      parseAbiParameters('address currency, uint128 minAmount'),
      [BLOC, blocAmount]
    )

    // Combine all params
    const paramsArray = [swapParams, settleParams, takeParams]

    // Encode the V4_SWAP input
    const v4SwapInput = encodeAbiParameters(
      parseAbiParameters('bytes actions, bytes[] params'),
      [actions, paramsArray]
    )

    // Command byte for V4_SWAP
    const commands = toHex(COMMANDS.V4_SWAP, { size: 1 })

    // Encode the full execute call
    const executeData = encodeFunctionData({
      abi: universalRouterAbi,
      functionName: 'execute',
      args: [commands, [v4SwapInput], deadline],
    })

    log('Sending swap transaction...')

    // Send transaction with builder code attribution
    swap({
      to: UNISWAP_UNIVERSAL_ROUTER,
      data: concat([executeData, DATA_SUFFIX]),
      value: ethToSend,
    })
  }

  // Check if user has enough ETH
  const hasSufficientEth = (quarters: number): boolean => {
    if (!ethBalance || !quote || quote.quarters !== quarters) return true // Assume yes until quote
    return ethBalance.value >= quote.ethRequired
  }

  // Format helpers
  const formatEthCost = (): string => {
    if (!quote) return '...'
    return Number(formatEther(quote.ethRequired)).toFixed(6)
  }

  const formatBlocAmount = (): string => {
    if (!quote) return '...'
    return Number(formatUnits(quote.blocAmount, BLOC_DECIMALS)).toLocaleString()
  }

  return {
    // Connection state
    isConnected,
    address,
    ethBalance,

    // Quote state
    quote,
    isQuoting,
    quoteError,
    getQuote,

    // Transaction state
    isSwapPending,
    isSwapConfirming,
    isSwapSuccess,
    swapTxHash,
    swapError,

    // Actions
    handleSwap,
    resetSwap,

    // Utilities
    hasSufficientEth,
    formatEthCost,
    formatBlocAmount,

    // Constants
    BLOC_PER_QUARTER,
  }
}
