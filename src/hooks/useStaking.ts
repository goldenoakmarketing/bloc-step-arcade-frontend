'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { contracts, blocTokenAbi, stakingPoolAbi } from '@/config/contracts'

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

  // Write contract hooks
  const { writeContract: approve, data: approveTxHash, isPending: isApprovePending, reset: resetApprove } = useWriteContract()
  const { writeContract: stake, data: stakeTxHash, isPending: isStakePending, reset: resetStake } = useWriteContract()
  const { writeContract: unstake, data: unstakeTxHash, isPending: isUnstakePending, reset: resetUnstake } = useWriteContract()
  const { writeContract: claimRewards, data: claimTxHash, isPending: isClaimPending, reset: resetClaim } = useWriteContract()

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

  // Action functions
  const handleApprove = (amount: bigint) => {
    approve({
      address: contracts.blocToken,
      abi: blocTokenAbi,
      functionName: 'approve',
      args: [contracts.stakingPool, amount],
    })
  }

  const handleStake = (amount: bigint) => {
    stake({
      address: contracts.stakingPool,
      abi: stakingPoolAbi,
      functionName: 'stake',
      args: [amount],
    })
  }

  const handleUnstake = (amount: bigint) => {
    unstake({
      address: contracts.stakingPool,
      abi: stakingPoolAbi,
      functionName: 'unstake',
      args: [amount],
    })
  }

  const handleClaimRewards = () => {
    claimRewards({
      address: contracts.stakingPool,
      abi: stakingPoolAbi,
      functionName: 'claimRewards',
    })
  }

  // Format helpers
  const formatBloc = (value: bigint | undefined) => {
    if (!value) return '0.00'
    return Number(formatUnits(value, 18)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const parseBloc = (value: string) => {
    try {
      return parseUnits(value, 18)
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
