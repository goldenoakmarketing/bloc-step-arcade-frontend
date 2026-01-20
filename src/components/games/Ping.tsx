'use client'

/**
 * Ping (Pong Clone)
 * Classic arcade game - public domain concept
 * Original Pong by Atari (1972)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 60
const PADDLE_HEIGHT = 12
const BALL_SIZE = 12
const PADDLE_SPEED = 8
const INITIAL_BALL_SPEED = 3
const WALL_BOUNCE_MULTIPLIER = 3 // 200% increase = 3x

export function Ping({ onScore, onGameOver, isPaused }: GameProps) {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerScore, setPlayerScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())

  // Use refs for game physics to avoid stale closure issues
  const gameRef = useRef({
    playerX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    cpuX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVelX: 2,
    ballVelY: 3,
    ballSpeed: INITIAL_BALL_SPEED,
  })

  const resetBall = useCallback((direction: 1 | -1) => {
    const g = gameRef.current
    g.ballX = CANVAS_WIDTH / 2
    g.ballY = CANVAS_HEIGHT / 2
    const angle = (Math.random() - 0.5) * Math.PI / 4
    g.ballVelX = Math.sin(angle) * g.ballSpeed
    g.ballVelY = Math.cos(angle) * g.ballSpeed * direction
  }, [])

  const startGame = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true)
      resetBall(1)
    }
  }, [gameStarted, resetBall])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.add('left')
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.add('right')
      if (e.code === 'Space') {
        e.preventDefault()
        startGame()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.delete('left')
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.delete('right')
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startGame])

  // Game loop
  useEffect(() => {
    if (isPaused || !gameStarted) return

    const gameLoop = setInterval(() => {
      const g = gameRef.current

      // Move player paddle
      if (keysRef.current.has('left')) {
        g.playerX = Math.max(0, g.playerX - PADDLE_SPEED)
      }
      if (keysRef.current.has('right')) {
        g.playerX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, g.playerX + PADDLE_SPEED)
      }

      // CPU AI - follows ball with some lag
      const targetX = g.ballX - PADDLE_WIDTH / 2
      const diff = targetX - g.cpuX
      const cpuSpeed = PADDLE_SPEED * 0.55
      if (Math.abs(diff) < cpuSpeed) {
        g.cpuX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, targetX))
      } else {
        g.cpuX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, g.cpuX + (diff > 0 ? cpuSpeed : -cpuSpeed)))
      }

      // Move ball
      g.ballX += g.ballVelX
      g.ballY += g.ballVelY

      // Wall bounce - LEFT and RIGHT walls with 200% increased bounce
      const margin = BALL_SIZE / 2
      if (g.ballX <= margin) {
        g.ballX = margin
        g.ballVelX = Math.abs(g.ballVelX) * WALL_BOUNCE_MULTIPLIER
        // Cap the velocity so it doesn't go crazy
        g.ballVelX = Math.min(g.ballVelX, g.ballSpeed * 2)
      } else if (g.ballX >= CANVAS_WIDTH - margin) {
        g.ballX = CANVAS_WIDTH - margin
        g.ballVelX = -Math.abs(g.ballVelX) * WALL_BOUNCE_MULTIPLIER
        // Cap the velocity
        g.ballVelX = Math.max(g.ballVelX, -g.ballSpeed * 2)
      }

      // Normalize velocity over time to prevent permanent speedup
      if (Math.abs(g.ballVelX) > g.ballSpeed) {
        g.ballVelX *= 0.98
      }

      // Player paddle collision (bottom)
      const playerPaddleY = CANVAS_HEIGHT - PADDLE_HEIGHT - 20
      if (g.ballY >= playerPaddleY - BALL_SIZE / 2 && g.ballY <= playerPaddleY + PADDLE_HEIGHT) {
        if (g.ballX >= g.playerX - BALL_SIZE / 2 && g.ballX <= g.playerX + PADDLE_WIDTH + BALL_SIZE / 2) {
          const hitPos = (g.ballX - g.playerX) / PADDLE_WIDTH
          const angle = (hitPos - 0.5) * Math.PI / 3
          g.ballVelX = Math.sin(angle) * g.ballSpeed
          g.ballVelY = -Math.abs(Math.cos(angle) * g.ballSpeed)
          g.ballY = playerPaddleY - BALL_SIZE / 2
        }
      }

      // CPU paddle collision (top)
      const cpuPaddleY = 20
      if (g.ballY <= cpuPaddleY + PADDLE_HEIGHT + BALL_SIZE / 2 && g.ballY >= cpuPaddleY) {
        if (g.ballX >= g.cpuX - BALL_SIZE / 2 && g.ballX <= g.cpuX + PADDLE_WIDTH + BALL_SIZE / 2) {
          const hitPos = (g.ballX - g.cpuX) / PADDLE_WIDTH
          const angle = (hitPos - 0.5) * Math.PI / 3
          g.ballVelX = Math.sin(angle) * g.ballSpeed
          g.ballVelY = Math.abs(Math.cos(angle) * g.ballSpeed)
          g.ballY = cpuPaddleY + PADDLE_HEIGHT + BALL_SIZE / 2
        }
      }

      // Score - ball goes past paddles
      if (g.ballY <= 0) {
        // Player scores
        setPlayerScore(s => s + 1)
        onScore(10)
        g.ballSpeed = Math.min(g.ballSpeed + 0.2, 6)
        resetBall(-1)
      }

      if (g.ballY >= CANVAS_HEIGHT) {
        // CPU scores
        setCpuScore(s => {
          const newScore = s + 1
          if (newScore >= 5) {
            onGameOver()
          }
          return newScore
        })
        resetBall(1)
      }

      // Force re-render
      setPlayerScore(s => s)
    }, 16)

    return () => clearInterval(gameLoop)
  }, [isPaused, gameStarted, onScore, onGameOver, resetBall])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const g = gameRef.current

    // Background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Side walls indicator
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(0, 0, 4, CANVAS_HEIGHT)
    ctx.fillRect(CANVAS_WIDTH - 4, 0, 4, CANVAS_HEIGHT)

    // Center line
    ctx.strokeStyle = '#333'
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_HEIGHT / 2)
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // CPU paddle (top)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(g.cpuX, 20, PADDLE_WIDTH, PADDLE_HEIGHT)

    // Player paddle (bottom)
    ctx.fillStyle = '#10b981'
    ctx.fillRect(g.playerX, CANVAS_HEIGHT - PADDLE_HEIGHT - 20, PADDLE_WIDTH, PADDLE_HEIGHT)

    // Ball
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(g.ballX, g.ballY, BALL_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

    // Scores
    ctx.fillStyle = 'white'
    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(cpuScore.toString(), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
    ctx.fillText(playerScore.toString(), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45)

    // Start message
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('Tap to Start!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = '14px sans-serif'
      ctx.fillText('First to 5 loses', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }

  }, [playerScore, cpuScore, gameStarted])

  // Touch controls
  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!gameStarted) {
      startGame()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    gameRef.current.playerX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
  }, [gameStarted, startGame])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleTouch}
        onMouseMove={gameStarted ? handleTouch : undefined}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        className="mx-auto rounded-lg border-2 border-zinc-700 cursor-pointer select-none"
      />

      {/* Mobile controls */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onMouseDown={() => keysRef.current.add('left')}
          onMouseUp={() => keysRef.current.delete('left')}
          onTouchStart={() => keysRef.current.add('left')}
          onTouchEnd={() => keysRef.current.delete('left')}
          className="btn bg-zinc-800 hover:bg-zinc-700 px-8"
        >
          Left
        </button>
        <button
          onMouseDown={() => keysRef.current.add('right')}
          onMouseUp={() => keysRef.current.delete('right')}
          onTouchStart={() => keysRef.current.add('right')}
          onTouchEnd={() => keysRef.current.delete('right')}
          className="btn bg-zinc-800 hover:bg-zinc-700 px-8"
        >
          Right
        </button>
      </div>

      <p className="text-muted text-sm mt-4">
        Move to bounce the ball. Don't let it past you!
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Based on Pong by Atari (1972)
      </p>
    </div>
  )
}

export const PingMeta = {
  id: 'ping',
  name: 'Ping',
  icon: '\ud83c\udfd3',
  description: 'Classic paddle game vs CPU',
  color: 'from-amber-500 to-orange-600',
  credit: 'Atari (1972 concept)',
  license: 'Public Domain',
}
