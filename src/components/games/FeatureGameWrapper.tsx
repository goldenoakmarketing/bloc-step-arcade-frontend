'use client'

import { useState, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useFarcaster } from '@/providers/FarcasterProvider'
import { reportTimeConsumed } from '@/lib/api'

interface FeatureGameWrapperProps {
  gameId: string
  gameName: string
  gameIcon: string
  children: React.ReactNode
  onExit: () => void
  creditCost: number
  quarterBalance: number
  timeRemaining: number
  onBuyTime: () => Promise<'started' | 'has-time' | 'failed'>
  isPurchasing?: boolean
}

export function FeatureGameWrapper({
  gameId,
  gameName,
  gameIcon,
  children,
  onExit,
  creditCost,
  quarterBalance,
  timeRemaining,
  onBuyTime,
  isPurchasing = false,
}: FeatureGameWrapperProps) {
  const { address } = useAccount()
  const [gameState, setGameState] = useState<'ready' | 'playing'>('ready')
  const [isInsertingQuarter, setIsInsertingQuarter] = useState(false)
  const playStartTimeRef = useRef<number>(0)

  const startGame = async () => {
    // Feature games always require a credit, even if timer has time
    setIsInsertingQuarter(true)
    try {
      const result = await onBuyTime()
      if (result === 'failed') {
        setIsInsertingQuarter(false)
        return
      }
    } catch (error) {
      console.error('Failed to insert credit:', error)
      setIsInsertingQuarter(false)
      return
    }
    setIsInsertingQuarter(false)
    playStartTimeRef.current = Date.now()
    setGameState('playing')
  }

  const handleExit = useCallback(() => {
    // Report elapsed play time
    if (address && playStartTimeRef.current > 0) {
      const elapsedSeconds = Math.floor((Date.now() - playStartTimeRef.current) / 1000)
      if (elapsedSeconds > 0) {
        reportTimeConsumed(address, elapsedSeconds).catch((err) => {
          console.error('Failed to report time consumed:', err)
        })
      }
      playStartTimeRef.current = 0
    }
    onExit()
  }, [address, onExit])

  if (gameState === 'playing') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Minimal top bar with exit */}
        <div className="absolute top-3 left-3 z-50">
          <button
            onClick={handleExit}
            className="px-3 py-1.5 bg-black/70 backdrop-blur border border-white/20 rounded-lg text-white text-sm hover:bg-black/90 transition-colors"
          >
            Exit
          </button>
        </div>
        {/* Full screen game */}
        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    )
  }

  // Ready screen - credit gate
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full">
        <div className="text-6xl mb-6">{gameIcon}</div>
        <h2 className="text-2xl font-bold mb-2">{gameName}</h2>
        <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-full text-xs font-bold mb-4">
          Feature Game
        </div>
        <p className="text-muted text-sm mb-6">
          {isInsertingQuarter || isPurchasing
            ? 'Confirm in wallet...'
            : `Insert ${creditCost} credit${creditCost > 1 ? 's' : ''} to play`}
        </p>
        <button
          onClick={startGame}
          className="btn btn-primary btn-lg btn-full"
          disabled={quarterBalance < creditCost || isInsertingQuarter || isPurchasing}
        >
          {isInsertingQuarter || isPurchasing
            ? 'Inserting Credit...'
            : quarterBalance < creditCost
            ? 'Need BLOC to Play'
            : `Insert Credit (${creditCost * 250} BLOC)`}
        </button>
        {quarterBalance < creditCost && !isInsertingQuarter && !isPurchasing && (
          <p className="text-xs text-muted mt-2">Buy BLOC tokens to get credits</p>
        )}
        <button
          onClick={onExit}
          className="btn btn-secondary btn-full mt-3"
        >
          Back to Games
        </button>
      </div>
    </div>
  )
}
