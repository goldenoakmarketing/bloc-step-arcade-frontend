'use client'

import { useState, useEffect } from 'react'
import { useStaking } from '@/hooks/useStaking'

export function StakingPanel() {
  const {
    isConnected,
    blocBalance,
    stakedBalance,
    pendingRewards,
    formattedBlocBalance,
    formattedStakedBalance,
    formattedPendingRewards,
    formattedTotalStaked,
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
    handleApprove,
    handleStake,
    handleUnstake,
    handleClaimRewards,
    refetchAll,
    parseBloc,
    needsApproval,
    resetStake,
    resetApprove,
    resetUnstake,
    resetClaim,
  } = useStaking()

  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [error, setError] = useState('')

  // Computed values - must be before hooks that depend on them
  const parsedStakeAmount = parseBloc(stakeAmount)
  const parsedUnstakeAmount = parseBloc(unstakeAmount)

  // Refetch data after successful transactions
  useEffect(() => {
    if (isApproveSuccess || isStakeSuccess || isUnstakeSuccess || isClaimSuccess) {
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
      if (isClaimSuccess) {
        resetClaim()
      }
    }
  }, [isApproveSuccess, isStakeSuccess, isUnstakeSuccess, isClaimSuccess, refetchAll, resetStake, resetApprove, resetUnstake, resetClaim])

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
  const hasPendingRewards = (pendingRewards || 0n) > 0n

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
  const isClaimLoading = isClaimPending || isClaimConfirming

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
      {/* BLOC Balance */}
      <div className="card">
        <div className="text-center">
          <div className="text-sm text-muted mb-1">Your BLOC Balance</div>
          <div className="text-3xl font-bold text-gradient">{formattedBlocBalance} BLOC</div>
        </div>
      </div>

      {/* Staked and Rewards Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="stat-label">Staked</div>
          <div className="stat-value text-xl">{formattedStakedBalance}</div>
          <div className="text-xs text-muted">BLOC</div>
          {(stakedBalance || 0n) > 0n && (
            <div className="mt-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#8b5cf6] w-full"
                />
                <button
                  onClick={handleMaxUnstake}
                  className="text-xs text-[#8b5cf6] hover:text-[#7c3aed]"
                >
                  Max
                </button>
              </div>
              <button
                onClick={handleUnstakeClick}
                disabled={isUnstakeLoading || parsedUnstakeAmount <= 0n}
                className="btn btn-secondary text-xs py-1 px-3 w-full"
              >
                {isUnstakePending ? 'Confirm...' : isUnstakeConfirming ? 'Unstaking...' : 'Unstake'}
              </button>
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending Rewards</div>
          <div className="stat-value text-xl">{formattedPendingRewards}</div>
          <div className="text-xs text-muted">BLOC</div>
          {hasPendingRewards && (
            <button
              onClick={handleClaimRewards}
              disabled={isClaimLoading}
              className="btn btn-success text-xs py-1 px-3 mt-3 w-full"
            >
              {isClaimPending ? 'Confirm...' : isClaimConfirming ? 'Claiming...' : 'Claim'}
            </button>
          )}
        </div>
      </div>

      {/* Total Staked - Pool Stats */}
      <div className="stat-card text-center">
        <div className="stat-label">Total Staked in Pool</div>
        <div className="stat-value text-2xl text-gradient">{formattedTotalStaked}</div>
        <div className="text-xs text-muted">BLOC</div>
      </div>

      {/* Stake Form */}
      <div className="card">
        <h3 className="font-bold mb-4">Stake BLOC</h3>

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
