'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import {
  usePlayerBalance,
  useStartSession,
  useEndSession,
  useConsumeTime,
} from '@/hooks/useApi'

type GameState = 'idle' | 'playing' | 'paused' | 'gameover'

export default function PlayPage() {
  const { isConnected } = useAccount()
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [combo, setCombo] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const sessionIdRef = useRef<string | null>(null)
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data: balance, refetch: refetchBalance } = usePlayerBalance()
  const startSession = useStartSession()
  const endSession = useEndSession()
  const consumeTime = useConsumeTime()

  const timeBalance = balance?.timeBalanceSeconds ?? 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  // Consume time every 10 seconds
  useEffect(() => {
    if (gameState !== 'playing' || !sessionIdRef.current) return

    const interval = setInterval(() => {
      if (sessionIdRef.current) {
        consumeTime.mutate({ sessionId: sessionIdRef.current, seconds: 10 })
      }
    }, 10_000)

    return () => clearInterval(interval)
  }, [gameState, consumeTime])

  const handleTap = useCallback(() => {
    if (gameState !== 'playing') return

    const points = 10 * (1 + Math.floor(combo / 5))
    setScore((prev) => prev + points)
    setCombo((prev) => prev + 1)

    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current)
    comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000)
  }, [gameState, combo])

  const startGame = async () => {
    if (timeBalance < 60) {
      alert('Not enough time! Purchase more arcade time.')
      return
    }

    try {
      const session = await startSession.mutateAsync()
      sessionIdRef.current = session.id
      setScore(0)
      setCombo(0)
      setTimeLeft(60)
      setGameState('playing')
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start game. Please try again.')
    }
  }

  const endGame = async () => {
    setGameState('gameover')
    if (score > highScore) setHighScore(score)

    if (sessionIdRef.current) {
      try {
        await endSession.mutateAsync(sessionIdRef.current)
        sessionIdRef.current = null
        refetchBalance()
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🎮</div>
          <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-muted mb-6">Connect to start playing</p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* HUD */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#27272a]">
        <div>
          <div className="text-xs text-muted">Score</div>
          <div className="text-xl font-bold text-gradient">{score.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted">Time</div>
          <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Best</div>
          <div className="text-xl font-bold">{highScore.toLocaleString()}</div>
        </div>
      </div>

      {/* Combo */}
      {combo > 0 && gameState === 'playing' && (
        <div className="text-center py-2">
          <span className="badge">{combo}x Combo!</span>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {gameState === 'idle' && (
          <div className="card text-center max-w-sm w-full">
            <div className="text-6xl mb-6">🕹️</div>
            <h2 className="text-2xl font-bold mb-2">Ready?</h2>
            <div className="mb-6">
              <div className="text-muted text-sm">Time Balance</div>
              <div className="text-2xl font-bold text-gradient">{formatTime(timeBalance)}</div>
            </div>
            <button onClick={startGame} className="btn btn-primary btn-lg btn-full">
              Start Game
            </button>
            <p className="text-xs text-muted mt-3">Uses 60 seconds of time</p>
          </div>
        )}

        {gameState === 'playing' && (
          <div
            onClick={handleTap}
            className="card-glow w-full max-w-sm aspect-square flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="text-center">
              <div className="text-8xl mb-4">👾</div>
              <p className="text-muted">Tap to score!</p>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="card text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">Game Over</h2>
            <div className="mb-6">
              <div className="text-muted text-sm">Final Score</div>
              <div className="text-4xl font-bold text-gradient">{score.toLocaleString()}</div>
            </div>
            {score >= highScore && score > 0 && (
              <div className="badge badge-success mb-4">New High Score!</div>
            )}
            <div className="space-y-3">
              <button onClick={startGame} className="btn btn-primary btn-full">
                Play Again
              </button>
              <button onClick={() => setGameState('idle')} className="btn btn-secondary btn-full">
                Exit
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="card text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-6">Paused</h2>
            <div className="space-y-3">
              <button onClick={() => setGameState('playing')} className="btn btn-primary btn-full">
                Resume
              </button>
              <button onClick={endGame} className="btn btn-secondary btn-full">
                Quit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {gameState === 'playing' && (
        <div className="flex justify-center gap-4 p-4 border-t border-[#27272a]">
          <button onClick={() => setGameState('paused')} className="btn btn-secondary">
            Pause
          </button>
          <button onClick={endGame} className="btn btn-secondary">
            End
          </button>
        </div>
      )}
    </div>
  )
}
