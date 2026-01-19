'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { CRTScreen } from '@/components/ui/CRTScreen'
import { ArcadeButton } from '@/components/ui/ArcadeButton'
import { PixelBorder } from '@/components/ui/PixelBorder'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import {
  usePlayerBalance,
  useActiveSession,
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

  // API hooks
  const { data: balance, refetch: refetchBalance } = usePlayerBalance()
  const { data: activeSession } = useActiveSession()
  const startSession = useStartSession()
  const endSession = useEndSession()
  const consumeTime = useConsumeTime()

  const timeBalance = balance?.timeBalanceSeconds ?? 0

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

  // Consume time on-chain every 10 seconds of gameplay
  useEffect(() => {
    if (gameState !== 'playing' || !sessionIdRef.current) return

    const consumeInterval = setInterval(() => {
      if (sessionIdRef.current) {
        consumeTime.mutate({
          sessionId: sessionIdRef.current,
          seconds: 10,
        })
      }
    }, 10_000) // Every 10 seconds

    return () => clearInterval(consumeInterval)
  }, [gameState, consumeTime])

  // Handle tap/click during game
  const handleGameTap = useCallback(() => {
    if (gameState !== 'playing') return

    // Increment score with combo multiplier
    const points = 10 * (1 + Math.floor(combo / 5))
    setScore((prev) => prev + points)
    setCombo((prev) => prev + 1)

    // Reset combo after 2 seconds of no taps
    setTimeout(() => {
      setCombo(0)
    }, 2000)
  }, [gameState, combo])

  const startGame = async () => {
    if (timeBalance < 60) {
      alert('Not enough time! Purchase more arcade time.')
      return
    }

    try {
      // Start a game session via API
      const session = await startSession.mutateAsync()
      sessionIdRef.current = session.id

      setScore(0)
      setCombo(0)
      setTimeLeft(60)
      setGameState('playing')
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start game session. Please try again.')
    }
  }

  const endGame = async () => {
    setGameState('gameover')
    if (score > highScore) {
      setHighScore(score)
    }

    // End the session via API
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <PixelBorder color="pink" className="p-8 text-center max-w-md">
          <span className="text-5xl">🎮</span>
          <h2 className="font-pixel text-lg text-neon-pink mt-4">
            CONNECT WALLET
          </h2>
          <p className="font-arcade text-gray-400 mt-2 mb-6">
            Insert coin to play
          </p>
          <ConnectButton />
        </PixelBorder>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Game HUD - Top */}
      <div className="game-hud flex justify-between items-start px-4 py-2">
        <div className="text-left">
          <p className="font-pixel text-[10px] text-gray-500">SCORE</p>
          <p className="font-pixel text-lg text-neon-green neon-text-green">
            {score.toString().padStart(6, '0')}
          </p>
        </div>

        <div className="text-center">
          <p className="font-pixel text-[10px] text-gray-500">TIME</p>
          <p className={`font-pixel text-lg ${timeLeft <= 10 ? 'text-neon-pink blink' : 'text-neon-cyan'}`}>
            {formatTime(timeLeft)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-pixel text-[10px] text-gray-500">HI-SCORE</p>
          <p className="font-pixel text-lg text-neon-yellow">
            {highScore.toString().padStart(6, '0')}
          </p>
        </div>
      </div>

      {/* Combo indicator */}
      <AnimatePresence>
        {combo > 0 && gameState === 'playing' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-30"
          >
            <span className="font-pixel text-sm text-neon-orange">
              {combo}x COMBO!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <CRTScreen className="w-full max-w-md aspect-[3/4] flex items-center justify-center">
          {/* Idle State */}
          {gameState === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-6"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🕹️
              </motion.div>

              <h2 className="font-pixel text-xl text-neon-pink mb-4">
                READY?
              </h2>

              <div className="mb-6">
                <p className="font-arcade text-sm text-gray-400">
                  Time Balance
                </p>
                <p className="font-pixel text-2xl text-neon-cyan">
                  {formatTime(timeBalance)}
                </p>
              </div>

              <ArcadeButton onClick={startGame} variant="success" size="lg">
                START
              </ArcadeButton>

              <p className="font-arcade text-xs text-gray-600 mt-4">
                Costs 60 seconds of time
              </p>
            </motion.div>
          )}

          {/* Playing State */}
          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex items-center justify-center"
              onClick={handleGameTap}
            >
              <div className="text-center">
                <motion.div
                  key={score}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="text-8xl mb-4 select-none"
                >
                  👾
                </motion.div>

                <p className="font-pixel text-xs text-neon-cyan blink">
                  TAP TO SCORE!
                </p>

                {/* Visual feedback dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {[...Array(Math.min(combo, 10))].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-neon-green"
                      style={{ boxShadow: '0 0 5px #39ff14' }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Game Over State */}
          {gameState === 'gameover' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-6"
            >
              <h2 className="font-pixel text-2xl text-neon-pink mb-4">
                GAME OVER
              </h2>

              <div className="mb-6">
                <p className="font-arcade text-sm text-gray-400">FINAL SCORE</p>
                <p className="font-pixel text-4xl text-neon-green neon-text-green">
                  {score.toString().padStart(6, '0')}
                </p>
              </div>

              {score >= highScore && score > 0 && (
                <motion.p
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="font-pixel text-sm text-neon-yellow mb-4"
                >
                  ★ NEW HIGH SCORE! ★
                </motion.p>
              )}

              <div className="flex flex-col gap-3">
                <ArcadeButton onClick={startGame} variant="success">
                  PLAY AGAIN
                </ArcadeButton>

                <ArcadeButton
                  onClick={() => setGameState('idle')}
                  variant="secondary"
                >
                  EXIT
                </ArcadeButton>
              </div>
            </motion.div>
          )}
        </CRTScreen>
      </div>

      {/* Game Controls - Bottom */}
      {gameState === 'playing' && (
        <div className="game-controls flex justify-center gap-4 pb-8">
          <button
            onClick={() => setGameState('paused')}
            className="px-4 py-2 font-pixel text-xs text-gray-400
                       border border-gray-600 hover:border-neon-cyan"
          >
            PAUSE
          </button>

          <button
            onClick={endGame}
            className="px-4 py-2 font-pixel text-xs text-gray-400
                       border border-gray-600 hover:border-neon-pink"
          >
            END
          </button>
        </div>
      )}

      {/* Pause Modal */}
      <AnimatePresence>
        {gameState === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <PixelBorder color="cyan" className="p-8 text-center">
              <h2 className="font-pixel text-xl text-neon-cyan mb-6">
                PAUSED
              </h2>

              <div className="flex flex-col gap-4">
                <ArcadeButton
                  onClick={() => setGameState('playing')}
                  variant="success"
                >
                  RESUME
                </ArcadeButton>

                <ArcadeButton onClick={endGame} variant="danger">
                  QUIT
                </ArcadeButton>
              </div>
            </PixelBorder>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
