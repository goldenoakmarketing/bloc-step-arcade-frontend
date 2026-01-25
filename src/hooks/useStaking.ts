'use client'

import { useAccount, useReadContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, encodeFunctionData, concat } from 'viem'
import { contracts, blocTokenAbi, stakingPoolAbi } from '@/config/contracts'
import { DATA_SUFFIX } from '@/config/builder'

// BLOC token has 9 decimals
const BLOC_DECIMALS = 9

export function useStaking() {
  const { address, isConnected } = useAccount()

  // Read BLOC token balance
  const { data: blocBalance, refetch: refetchBalance } = useReadContract({
    address: contracts.blocToken,
    abi: blocTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read staked balance
  const { data: stakedBalance, refetch: refetchStaked } = useReadContract({
    address: contracts.stakingPool,
    abi: stakingPoolAbi,
    functionName: 'getStakedBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read pending rewards
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: contracts.stakingPool,
    abi: stakingPoolAbi,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Read total staked in pool
  const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
    address: contracts.stakingPool,
    abi: stakingPoolAbi,
    functionName: 'totalStaked',
    query: { enabled: true },
  })

  // Read current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.blocToken,
    abi: blocTokenAbi,
    functionName: 'allowance',
    args: address ? [address, contracts.stakingPool] : undefined,
    query: { enabled: !!address },
  })

  // Transaction hooks with builder code attribution
  const { sendTransaction: approve, data: approveTxHash, isPending: isApprovePending, reset: resetApprove } = useSendTransaction()
  const { sendTransaction: stake, data: stakeTxHash, isPending: isStakePending, reset: resetStake } = useSendTransaction()
  const { sendTransaction: unstake, data: unstakeTxHash, isPending: isUnstakePending, reset: resetUnstake } = useSendTransaction()
  const { sendTransaction: claimRewards, data: claimTxHash, isPending: isClaimPending, reset: resetClaim } = useSendTransaction()

  // Wait for transaction receipts
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  })
  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({
    hash: stakeTxHash,
  })
  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({
    hash: unstakeTxHash,
  })
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  })

  // Refetch all data
  const refetchAll = () => {
    refetchBalance()
    refetchStaked()
    refetchRewards()
    refetchTotalStaked()
    refetchAllowance()
  }

  // Action functions with builder code attribution
  const handleApprove = (amount: bigint) => {
    const data = encodeFunctionData({
      abi: blocTokenAbi,
      functionName: 'approve',
      args: [contracts.stakingPool, amount],
    })
    approve({
      to: contracts.blocToken,
      data: concat([data, DATA_SUFFIX]),
    })
  }

  const handleStake = (amount: bigint) => {
    const data = encodeFunctionData({
      abi: stakingPoolAbi,
      functionName: 'stake',
      args: [amount],
    })
    stake({
      to: contracts.stakingPool,
      data: concat([data, DATA_SUFFIX]),
    })
  }

  const handleUnstake = (amount: bigint) => {
    const data = encodeFunctionData({
      abi: stakingPoolAbi,
      functionName: 'unstake',
      args: [amount],
    })
    unstake({
      to: contracts.stakingPool,
      data: concat([data, DATA_SUFFIX]),
    })
  }

  const handleClaimRewards = () => {
    const data = encodeFunctionData({
      abi: stakingPoolAbi,
      functionName: 'claimRewards',
    })
    claimRewards({
      to: contracts.stakingPool,
      data: concat([data, DATA_SUFFIX]),
    })
  }

  // Format helpers
  const formatBloc = (value: bigint | undefined) => {
    if (!value) return '0.00'
    return Number(formatUnits(value, BLOC_DECIMALS)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const parseBloc = (value: string) => {
    try {
      return parseUnits(value, BLOC_DECIMALS)
    } catch {
      return BigInt(0)
    }
  }

  // Check if amount needs approval
  const needsApproval = (amount: bigint) => {
    if (!allowance) return true
    return allowance < amount
  }

  return {
    // Connection state
    isConnected,
    address,

    // Balances (raw bigint values)
    blocBalance,
    stakedBalance,
    pendingRewards,
    totalStaked,
    allowance,

    // Formatted values
    formattedBlocBalance: formatBloc(blocBalance),
    formattedStakedBalance: formatBloc(stakedBalance),
    formattedPendingRewards: formatBloc(pendingRewards),
    formattedTotalStaked: formatBloc(totalStaked),

    // Transaction states
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    isStakePending,
    isStakeConfirming,
    isStakeSuccess,
    isUnstakePending,
    isUnstakeConfirming,
    isUnstakeSuccess,
    isClaimPending,
    isClaimConfirming,
    isClaimSuccess,

    // Actions
    handleApprove,
    handleStake,
    handleUnstake,
    handleClaimRewards,

    // Utilities
    refetchAll,
    formatBloc,
    parseBloc,
    needsApproval,

    // Reset functions
    resetApprove,
    resetStake,
    resetUnstake,
    resetClaim,
  }
}
