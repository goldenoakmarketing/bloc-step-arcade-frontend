'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'

interface CoinButtonProps {
  onClaim: (found: number) => void
}

interface ClaimInfo {
  canClaim: boolean
  nextClaimTime?: string
  streak: number
  maxClaimable: number
  totalClaimed: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://bloc-step-arcade-backend-production.up.railway.app'

export function CoinButton({ onClaim }: CoinButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFound, setLastFound] = useState<number | null>(null)
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  // Fetch claim info when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchClaimInfo()
    } else {
      setClaimInfo(null)
    }
  }, [isConnected, address])

  // Refresh claim info periodically
  useEffect(() => {
    if (!isConnected || !address) return

    const interval = setInterval(fetchClaimInfo, 60000) // Every minute
    return () => clearInterval(interval)
  }, [isConnected, address])

  const fetchClaimInfo = async () => {
    if (!address) return

    try {
      const res = await fetch(`${API_BASE}/api/v1/pool/claim-info/${address}`)
      const data = await res.json()

      if (data.success) {
        setClaimInfo(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch claim info:', err)
    }
  }

  // Auto-refetch when cooldown expires
  useEffect(() => {
    if (!claimInfo?.nextClaimTime || claimInfo.canClaim) return

    const next = new Date(claimInfo.nextClaimTime).getTime()
    const msUntilExpiry = next - Date.now()

    if (msUntilExpiry <= 0) {
      // Already expired, refetch immediately
      fetchClaimInfo()
      return
    }

    // Schedule refetch for when cooldown expires
    const timer = setTimeout(() => {
      fetchClaimInfo()
    }, msUntilExpiry + 500) // +500ms buffer for server clock skew

    return () => clearTimeout(timer)
  }, [claimInfo?.nextClaimTime, claimInfo?.canClaim])

  const formatCooldown = (nextClaimTime: string) => {
    const next = new Date(nextClaimTime).getTime()
    const now = Date.now()
    const ms = Math.max(0, next - now)

    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
    return `${minutes}m ${seconds}s`
  }

  // If nextClaimTime is in the past, treat as claimable regardless of stale canClaim value
  const cooldownExpired = claimInfo?.nextClaimTime && new Date(claimInfo.nextClaimTime) <= new Date()
  const isOnCooldown = claimInfo && !claimInfo.canClaim && claimInfo.nextClaimTime && !cooldownExpired

  const handleConnect = () => {
    const farcasterConnector = connectors.find(c => c.name.toLowerCase().includes('farcaster'))
    const connector = farcasterConnector || connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  const handleClick = async () => {
    if (isLoading) return

    // If not connected, prompt connection
    if (!isConnected) {
      handleConnect()
      return
    }

    if (isOnCooldown) return

    setIsPressed(true)
    setIsLoading(true)
    setLastFound(null)
    setError(null)

    // Play coin sound
    const audio = new Audio('/sounds/coins.mp3')
    audio.play().catch(() => {})

    setTimeout(() => setIsPressed(false), 200)

    try {
      const res = await fetch(`${API_BASE}/api/v1/pool/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address!,
        },
      })

      const data = await res.json()

      if (data.success) {
        setLastFound(data.data.claimed)
        if (data.data.claimed > 0) {
          onClaim(data.data.claimed)
        }
        // Refresh claim info
        await fetchClaimInfo()
      } else if (res.status === 429) {
        // Cooldown active
        setClaimInfo(data.data)
        setLastFound(0)
      } else {
        setError(data.error || 'Claim failed')
        setLastFound(0)
      }
    } catch (err) {
      console.error('Claim error:', err)
      setError('Network error')
      setLastFound(0)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreakDisplay = () => {
    if (!claimInfo) return null
    if (claimInfo.streak === 0) return null
    return `${claimInfo.streak} day streak`
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="relative group"
    >
      {/* Main button container */}
      <div
        className={`
          relative w-32 h-40 rounded-lg
          ${isPressed ? 'bg-red-600' : isOnCooldown ? 'bg-zinc-950' : 'bg-zinc-900'}
          border-4 ${isOnCooldown ? 'border-zinc-800' : 'border-zinc-700'}
          transition-all duration-150
          ${isOnCooldown ? 'cursor-not-allowed opacity-60' : 'hover:border-red-800 cursor-pointer'}
          ${isPressed ? 'shadow-[0_0_30px_rgba(239,68,68,0.7)]' : ''}
        `}
        style={{
          boxShadow: isPressed
            ? '0 0 30px rgba(239,68,68,0.7), inset 0 0 20px rgba(239,68,68,0.5)'
            : 'inset 0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        {/* Quarter slot on left */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-black rounded-sm border border-zinc-600" />

        {/* Main content */}
        <div className="flex flex-col items-center justify-center h-full pl-4">
          {!isConnected ? (
            <>
              <div className="text-2xl font-bold text-zinc-400">
                25¢
              </div>
              <div className="text-[10px] mt-2 tracking-wider text-zinc-600">
                CONNECT
              </div>
            </>
          ) : isOnCooldown && claimInfo?.nextClaimTime ? (
            <>
              {/* Cooldown display */}
              <div className="text-xl font-bold text-zinc-500">
                {formatCooldown(claimInfo.nextClaimTime)}
              </div>
              <div className="text-[10px] mt-2 tracking-wider text-zinc-600">
                COOLDOWN
              </div>
            </>
          ) : (
            <>
              {/* 25¢ text */}
              <div className={`text-3xl font-bold ${isPressed ? 'text-white' : 'text-zinc-400'}`}>
                25¢
              </div>

              {/* Insert here text */}
              <div className={`text-[10px] mt-2 tracking-wider ${isPressed ? 'text-red-200' : 'text-zinc-600'}`}>
                LOST & FOUND
              </div>

              {/* Streak indicator */}
              {claimInfo && claimInfo.streak > 0 && (
                <div className="text-[9px] mt-1 text-yellow-500">
                  {claimInfo.streak} day streak
                </div>
              )}
            </>
          )}
        </div>

        {/* Red backlight glow when pressed */}
        {isPressed && (
          <div className="absolute inset-0 rounded-lg bg-red-500/20 animate-pulse" />
        )}
      </div>

      {/* Label below */}
      <div className="text-center mt-2 text-xs text-muted">
        {!isConnected ? (
          'Connect wallet'
        ) : isOnCooldown ? (
          'Come back later'
        ) : isLoading ? (
          'Claiming...'
        ) : error ? (
          <span className="text-red-400">{error}</span>
        ) : lastFound !== null ? (
          lastFound > 0 ? (
            <span className="text-green-400">Found {lastFound} quarter{lastFound > 1 ? 's' : ''}!</span>
          ) : (
            'Nothing this time'
          )
        ) : claimInfo ? (
          `Up to ${claimInfo.maxClaimable}Q available`
        ) : (
          'Try your luck'
        )}
      </div>
    </button>
  )
}
