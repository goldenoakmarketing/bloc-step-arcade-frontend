'use client'

import { useAccount, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, encodeFunctionData, concat } from 'viem'
import { contracts, blocTokenAbi, arcadeVaultAbi } from '@/config/contracts'
import { DATA_SUFFIX } from '@/config/builder'

// BLOC token has 9 decimals
const BLOC_DECIMALS = 9

// 1 quarter = 250 BLOC, duration = 900 seconds (15 min)
const BLOC_PER_QUARTER = 250
const QUARTER_AMOUNT = BigInt(BLOC_PER_QUARTER) * BigInt(10 ** BLOC_DECIMALS) // 250 BLOC in smallest unit
const QUARTER_DURATION = 900 // 15 minutes in seconds

export function useQuarters() {
  const { address, isConnected } = useAccount()

  // Read BLOC token balance
  const { data: blocBalance, refetch: refetchBalance } = useReadContract({
    address: contracts.blocToken,
    abi: blocTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read time balance (in seconds)
  const { data: timeBalance, refetch: refetchTimeBalance } = useReadContract({
    address: contracts.arcadeVault,
    abi: arcadeVaultAbi,
    functionName: 'getTimeBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read current allowance for ArcadeVault
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.blocToken,
    abi: blocTokenAbi,
    functionName: 'allowance',
    args: address ? [address, contracts.arcadeVault] : undefined,
    query: { enabled: !!address },
  })

  // Transaction hooks with builder code attribution
  const { sendTransaction: approve, data: approveTxHash, isPending: isApprovePending, reset: resetApprove } = useSendTransaction()
  const { sendTransaction: buyQuarters, data: buyTxHash, isPending: isBuyPending, reset: resetBuy } = useSendTransaction()

  // Wait for transaction receipts
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  })
  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyTxHash,
  })

  // Refetch all data
  const refetchAll = () => {
    refetchBalance()
    refetchTimeBalance()
    refetchAllowance()
  }

  // Calculate cost for a given number of quarters
  const getQuarterCost = (count: number): bigint => {
    return QUARTER_AMOUNT * BigInt(count)
  }

  // Check if amount needs approval
  const needsApproval = (quarterCount: number): boolean => {
    if (!allowance) return true
    const cost = getQuarterCost(quarterCount)
    return allowance < cost
  }

  // Check if user has sufficient balance
  const hasSufficientBalance = (quarterCount: number): boolean => {
    if (!blocBalance) return false
    const cost = getQuarterCost(quarterCount)
    return blocBalance >= cost
  }

  // Handle approve
  const handleApprove = (quarterCount: number) => {
    const cost = getQuarterCost(quarterCount)
    const data = encodeFunctionData({
      abi: blocTokenAbi,
      functionName: 'approve',
      args: [contracts.arcadeVault, cost],
    })
    approve({
      to: contracts.blocToken,
      data: concat([data, DATA_SUFFIX]),
    })
  }

  // Handle buy quarters
  const handleBuyQuarters = (count: number) => {
    const data = encodeFunctionData({
      abi: arcadeVaultAbi,
      functionName: 'buyQuarters',
      args: [BigInt(count)],
    })
    buyQuarters({
      to: contracts.arcadeVault,
      data: concat([data, DATA_SUFFIX]),
    })
  }

  // Convert BLOC balance to quarters (1 quarter = 250 BLOC)
  const blocToQuarters = (blocBalance: bigint | undefined): number => {
    if (!blocBalance) return 0
    // blocBalance is in smallest units (9 decimals), QUARTER_AMOUNT is 250 * 10^9
    return Math.floor(Number(blocBalance / QUARTER_AMOUNT))
  }

  // Format helpers
  const formatBloc = (value: bigint | undefined): string => {
    if (!value) return '0.00'
    return Number(formatUnits(value, BLOC_DECIMALS)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Format time from quarters (each quarter = 15 minutes)
  const formatTimeFromQuarters = (quarters: number): string => {
    if (quarters <= 0) return '0m'
    const totalMinutes = quarters * 15
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Calculate quarter balance from BLOC balance
  const quarterBalance = blocToQuarters(blocBalance)

  return {
    // Connection state
    isConnected,
    address,

    // Balances
    blocBalance,
    timeBalance,
    allowance,

    // Computed values
    quarterBalance,
    formattedBlocBalance: formatBloc(blocBalance),
    formattedTimeBalance: formatTimeFromQuarters(quarterBalance),

    // Transaction states
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    isBuyPending,
    isBuyConfirming,
    isBuySuccess,

    // Actions
    handleApprove,
    handleBuyQuarters,

    // Utilities
    refetchAll,
    getQuarterCost,
    needsApproval,
    hasSufficientBalance,
    formatBloc,
    formatTimeFromQuarters,
    blocToQuarters,

    // Constants
    QUARTER_AMOUNT,
    QUARTER_DURATION,
    BLOC_DECIMALS,
    BLOC_PER_QUARTER,

    // Reset functions
    resetApprove,
    resetBuy,
  }
}
