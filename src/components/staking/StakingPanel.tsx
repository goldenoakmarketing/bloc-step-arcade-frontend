'use client'

import { useState, useEffect } from 'react'
import { useStaking } from '@/hooks/useStaking'
import { usePlayer } from '@/hooks/useApi'

export function StakingPanel() {
  const {
    isConnected,
    blocBalance,
    stakedBalance,
    totalStaked,
    formattedBlocBalance,
    formattedStakedBalance,
    formattedTotalStaked,
    formattedRewardsPool,
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    isStakePending,
    isStakeConfirming,
    isStakeSuccess,
    isUnstakePending,
    isUnstakeConfirming,
    isUnstakeSuccess,
    handleApprove,
    handleStake,
    handleUnstake,
    refetchAll,
    parseBloc,
    needsApproval,
    resetStake,
    resetApprove,
    resetUnstake,
  } = useStaking()

  const { data: playerData } = usePlayer()

  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [error, setError] = useState('')

  // Computed values - must be before hooks that depend on them
  const parsedStakeAmount = parseBloc(stakeAmount)
  const parsedUnstakeAmount = parseBloc(unstakeAmount)

  // Calculate staking eligibility
  const stakeStartedAt = playerData?.stakeStartedAt ? new Date(playerData.stakeStartedAt) : null
  const now = new Date()
  const daysSinceStake = stakeStartedAt
    ? Math.floor((now.getTime() - stakeStartedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isEligibleForRewards = stakeStartedAt && daysSinceStake >= 7
  const daysUntilEligible = stakeStartedAt ? Math.max(0, 7 - daysSinceStake) : 7

  // Refetch data after successful transactions
  useEffect(() => {
    if (isApproveSuccess || isStakeSuccess || isUnstakeSuccess) {
      refetchAll()
      if (isStakeSuccess) {
        setStakeAmount('')
        resetStake()
        resetApprove()
      }
      if (isUnstakeSuccess) {
        setUnstakeAmount('')
        resetUnstake()
      }
    }
  }, [isApproveSuccess, isStakeSuccess, isUnstakeSuccess, refetchAll, resetStake, resetApprove, resetUnstake])

  // After approval succeeds, automatically stake
  useEffect(() => {
    if (isApproveSuccess && parsedStakeAmount > 0n && isConnected) {
      handleStake(parsedStakeAmount)
    }
  }, [isApproveSuccess, parsedStakeAmount, isConnected, handleStake])

  // Early return AFTER all hooks
  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3 className="font-bold mb-2">Stake BLOC</h3>
        <p className="text-muted text-sm">Connect your wallet to stake BLOC and earn rewards</p>
      </div>
    )
  }

  const requiresApproval = parsedStakeAmount > 0n && needsApproval(parsedStakeAmount)
  const hasInsufficientBalance = parsedStakeAmount > (blocBalance || 0n)
  const hasInsufficientStake = parsedUnstakeAmount > (stakedBalance || 0n)
  const hasStakedBalance = (stakedBalance || 0n) > 0n

  // Calculate user's share of pool and estimated daily rewards
  const userSharePercent = totalStaked && stakedBalance && totalStaked > 0n
    ? Number((stakedBalance * 10000n) / totalStaked) / 100
    : 0

  const handleMaxStake = () => {
    if (blocBalance) {
      const formatted = (Number(blocBalance) / 1e18).toString()
      setStakeAmount(formatted)
    }
  }

  const handleMaxUnstake = () => {
    if (stakedBalance) {
      const formatted = (Number(stakedBalance) / 1e18).toString()
      setUnstakeAmount(formatted)
    }
  }

  const handleStakeClick = () => {
    setError('')
    if (parsedStakeAmount <= 0n) {
      setError('Enter an amount to stake')
      return
    }
    if (hasInsufficientBalance) {
      setError('Insufficient BLOC balance')
      return
    }
    if (requiresApproval) {
      handleApprove(parsedStakeAmount)
    } else {
      handleStake(parsedStakeAmount)
    }
  }

  const handleUnstakeClick = () => {
    setError('')
    if (parsedUnstakeAmount <= 0n) {
      setError('Enter an amount to unstake')
      return
    }
    if (hasInsufficientStake) {
      setError('Insufficient staked balance')
      return
    }
    handleUnstake(parsedUnstakeAmount)
  }

  const isStakeLoading = isApprovePending || isApproveConfirming || isStakePending || isStakeConfirming
  const isUnstakeLoading = isUnstakePending || isUnstakeConfirming

  const getStakeButtonText = () => {
    if (isApprovePending) return 'Approve in Wallet...'
    if (isApproveConfirming) return 'Confirming Approval...'
    if (isStakePending) return 'Stake in Wallet...'
    if (isStakeConfirming) return 'Confirming Stake...'
    if (requiresApproval) return 'Approve & Stake'
    return 'Stake'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <h3 className="font-bold text-lg mb-1">Staking Pool</h3>
        <p className="text-muted text-sm">Stake BLOC to earn a share of arcade revenue. The more you stake, the bigger your share.</p>
      </div>

      {/* Your Position */}
      <div className="card">
        <div className="text-sm text-muted mb-3">Your Position</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted">Your Staked</div>
            <div className="text-xl font-bold text-gradient">{formattedStakedBalance}</div>
            <div className="text-xs text-muted">BLOC</div>
            {userSharePercent > 0 && (
              <div className="text-xs text-purple-400 mt-1">{userSharePercent.toFixed(2)}% of pool</div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted">Reward Status</div>
            {hasStakedBalance ? (
              isEligibleForRewards ? (
                <div className="text-lg font-bold text-green-400">Eligible</div>
              ) : (
                <div className="text-lg font-bold text-yellow-400">{daysUntilEligible}d left</div>
              )
            ) : (
              <div className="text-lg font-bold text-zinc-500">--</div>
            )}
            <div className="text-xs text-muted">
              {hasStakedBalance
                ? isEligibleForRewards
                  ? 'Rewards auto-deposit Sundays'
                  : 'Until eligible for rewards'
                : 'Stake to earn rewards'}
            </div>
          </div>
        </div>
        <div className="text-xs text-zinc-500 mt-3">Rewards distributed weekly from arcade revenue. 60% of vault goes to stakers.</div>
      </div>

      {/* Unstake Section - only show if user has staked balance */}
      {hasStakedBalance && (
        <div className="card">
          <div className="text-sm text-muted mb-3">Unstake</div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Amount to unstake"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8b5cf6]"
            />
            <button
              onClick={handleMaxUnstake}
              className="btn btn-secondary text-sm"
            >
              Max
            </button>
          </div>
          <button
            onClick={handleUnstakeClick}
            disabled={isUnstakeLoading || parsedUnstakeAmount <= 0n}
            className="btn btn-secondary btn-full mt-3"
          >
            {isUnstakePending ? 'Confirm in Wallet...' : isUnstakeConfirming ? 'Unstaking...' : 'Unstake'}
          </button>
        </div>
      )}

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="stat-label">Total Staked</div>
          <div className="stat-value text-lg">{formattedTotalStaked}</div>
          <div className="text-xs text-muted">BLOC in pool</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rewards Pool</div>
          <div className="stat-value text-lg text-green-400">{formattedRewardsPool}</div>
          <div className="text-xs text-muted">BLOC available</div>
        </div>
      </div>

      {/* Stake Form */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted">Stake BLOC</div>
          <div className="text-xs text-muted">Balance: {formattedBlocBalance} BLOC</div>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Amount to stake"
            value={stakeAmount}
            onChange={(e) => {
              setStakeAmount(e.target.value)
              setError('')
            }}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8b5cf6]"
          />
          <button
            onClick={handleMaxStake}
            className="btn btn-secondary text-sm"
          >
            Max
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-3">{error}</div>
        )}

        <button
          onClick={handleStakeClick}
          disabled={isStakeLoading || parsedStakeAmount <= 0n || hasInsufficientBalance}
          className="btn btn-success btn-full"
        >
          {isStakeLoading && <span className="spinner mr-2" />}
          {getStakeButtonText()}
        </button>
      </div>
    </div>
  )
}
