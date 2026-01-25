'use client'

import { useState } from 'react'
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { formatEther, formatUnits, encodeFunctionData, concat, decodeFunctionResult } from 'viem'
import { DATA_SUFFIX } from '@/config/builder'

// Uniswap V3 addresses on Base
const UNISWAP_QUOTER_V2 = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' as const
const UNISWAP_SWAP_ROUTER_02 = '0x2626664c2603336E57B271c5C0b26F421741e481' as const
const WETH = '0x4200000000000000000000000000000000000006' as const
const BLOC = '0x022c6cb9Fd69A99cF030cB43e3c28BF82bF68Fe9' as const

// Pool fee tier (0.3% = 3000, 1% = 10000) - using 1% for smaller tokens
const POOL_FEE = 10000

// BLOC token has 9 decimals (not 18!)
// 250 BLOC raw = 250,000,000,000 smallest units
const BLOC_DECIMALS = 9

// 1 quarter = 250 BLOC
const BLOC_PER_QUARTER = BigInt(250) * BigInt(10 ** BLOC_DECIMALS)

// Debug logging
const DEBUG = true
const log = (...args: unknown[]) => DEBUG && console.log('[useSwapEthForBloc]', ...args)

// QuoterV2 ABI for quoteExactOutputSingle
const quoterAbi = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactOutputSingle',
    outputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// SwapRouter02 ABI for exactOutputSingle
const swapRouterAbi = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'amountInMaximum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactOutputSingle',
    outputs: [{ name: 'amountIn', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amountMinimum', type: 'uint256' }],
    name: 'unwrapWETH9',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'deadline', type: 'uint256' }],
    name: 'multicall',
    outputs: [{ name: '', type: 'bytes[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes[]' },
    ],
    name: 'multicall',
    outputs: [{ name: '', type: 'bytes[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'refundETH',
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

  // Get quote for exact output (how much ETH for X BLOC)
  const getQuote = async (quarters: number): Promise<bigint | null> => {
    if (quarters <= 0) {
      setQuote(null)
      return null
    }

    setIsQuoting(true)
    setQuoteError(null)

    const blocAmount = BLOC_PER_QUARTER * BigInt(quarters)
    log('Getting quote for', quarters, 'quarters =', formatUnits(blocAmount, BLOC_DECIMALS), 'BLOC')

    try {
      // First try using wagmi's publicClient
      if (publicClient) {
        log('Using wagmi publicClient')

        const callData = encodeFunctionData({
          abi: quoterAbi,
          functionName: 'quoteExactOutputSingle',
          args: [{
            tokenIn: WETH,
            tokenOut: BLOC,
            amount: blocAmount,
            fee: POOL_FEE,
            sqrtPriceLimitX96: BigInt(0),
          }],
        })

        log('Call data:', callData)
        log('Quoter address:', UNISWAP_QUOTER_V2)
        log('WETH:', WETH, 'BLOC:', BLOC, 'Fee:', POOL_FEE)

        const result = await publicClient.call({
          to: UNISWAP_QUOTER_V2,
          data: callData,
        })

        log('Quote result:', result)

        if (!result.data) {
          throw new Error('No data returned from quoter')
        }

        // Decode the result
        const decoded = decodeFunctionResult({
          abi: quoterAbi,
          functionName: 'quoteExactOutputSingle',
          data: result.data,
        })

        log('Decoded result:', decoded)

        const ethRequired = decoded[0] as bigint

        // Add 5% slippage buffer
        const ethWithSlippage = (ethRequired * BigInt(105)) / BigInt(100)

        log('ETH required:', formatEther(ethRequired), 'with slippage:', formatEther(ethWithSlippage))

        setQuote({
          ethRequired: ethWithSlippage,
          blocAmount,
          quarters,
        })

        return ethWithSlippage
      } else {
        // Fallback to direct RPC call
        log('Using direct RPC call (no publicClient)')

        const response = await fetch('https://mainnet.base.org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              {
                to: UNISWAP_QUOTER_V2,
                data: encodeFunctionData({
                  abi: quoterAbi,
                  functionName: 'quoteExactOutputSingle',
                  args: [{
                    tokenIn: WETH,
                    tokenOut: BLOC,
                    amount: blocAmount,
                    fee: POOL_FEE,
                    sqrtPriceLimitX96: BigInt(0),
                  }],
                }),
              },
              'latest',
            ],
          }),
        })

        const result = await response.json()
        log('RPC result:', result)

        if (result.error) {
          log('RPC error:', result.error)
          throw new Error(result.error.message || 'Quote failed')
        }

        if (!result.result || result.result === '0x') {
          throw new Error('Empty result from quoter - pool may not exist')
        }

        // Decode the result
        const decoded = decodeFunctionResult({
          abi: quoterAbi,
          functionName: 'quoteExactOutputSingle',
          data: result.result,
        })

        const ethRequired = decoded[0] as bigint
        const ethWithSlippage = (ethRequired * BigInt(105)) / BigInt(100)

        log('ETH required:', formatEther(ethRequired), 'with slippage:', formatEther(ethWithSlippage))

        setQuote({
          ethRequired: ethWithSlippage,
          blocAmount,
          quarters,
        })

        return ethWithSlippage
      }
    } catch (err) {
      console.error('Quote error:', err)
      log('Quote error details:', err)

      // Check if it's a pool-related error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (errorMessage.includes('execution reverted') || errorMessage.includes('pool')) {
        setQuoteError('No liquidity pool found')
      } else {
        setQuoteError('Failed to get price quote')
      }

      setQuote(null)
      return null
    } finally {
      setIsQuoting(false)
    }
  }

  // Execute swap
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

    const recipient = address

    // Deadline 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

    // Encode exactOutputSingle call
    const swapCalldata = encodeFunctionData({
      abi: swapRouterAbi,
      functionName: 'exactOutputSingle',
      args: [{
        tokenIn: WETH,
        tokenOut: BLOC,
        fee: POOL_FEE,
        recipient: recipient,
        amountOut: blocAmount,
        amountInMaximum: ethToSend,
        sqrtPriceLimitX96: BigInt(0),
      }],
    })

    // Encode refundETH call (returns unused ETH)
    const refundCalldata = encodeFunctionData({
      abi: swapRouterAbi,
      functionName: 'refundETH',
      args: [],
    })

    // Multicall: swap + refund unused ETH
    const multicallData = encodeFunctionData({
      abi: swapRouterAbi,
      functionName: 'multicall',
      args: [deadline, [swapCalldata, refundCalldata]],
    })

    // Send transaction with builder code attribution
    swap({
      to: UNISWAP_SWAP_ROUTER_02,
      data: concat([multicallData, DATA_SUFFIX]),
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
