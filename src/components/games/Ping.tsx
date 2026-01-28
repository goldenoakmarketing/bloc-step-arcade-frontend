'use client'

/**
 * Ping (Pong Clone) - CHAOS MODE
 * Multi-ball madness! 3 balls, first to 10 wins
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
const BALL_SPEED = 4.5
const WIN_SCORE = 10
const MIN_BALLS = 2
const MAX_BALLS = 3

type BallColor = 'red' | 'green' | 'yellow'

interface Ball {
  id: number
  x: number
  y: number
  velX: number
  velY: number
  color: BallColor
}

const BALL_COLORS: Record<BallColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#fbbf24',
}

let nextBallId = 1

export function Ping({ onScore, onGameOver, isPaused }: GameProps) {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerScore, setPlayerScore] = useState(0)
  const [cpuScore, setCpuScore] = useState(0)
  const [tick, setTick] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const gameOverCalledRef = useRef(false)

  const gameRef = useRef({
    playerX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    cpuX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    balls: [] as Ball[],
  })

  // Launch ball directly at player (downward)
  const launchAtPlayer = (ball: Ball) => {
    const angle = (Math.random() - 0.5) * 0.3
    ball.velX = Math.sin(angle) * BALL_SPEED
    ball.velY = Math.abs(Math.cos(angle) * BALL_SPEED)
  }

  // Launch ball directly at CPU (upward)
  const launchAtCPU = (ball: Ball) => {
    const angle = (Math.random() - 0.5) * 0.3
    ball.velX = Math.sin(angle) * BALL_SPEED
    ball.velY = -Math.abs(Math.cos(angle) * BALL_SPEED)
  }

  // Launch ball diagonally toward a wall
  const launchDiagonal = (ball: Ball) => {
    const goLeft = Math.random() > 0.5
    const goDown = Math.random() > 0.5
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3
    ball.velX = (goLeft ? -1 : 1) * Math.sin(angle) * BALL_SPEED
    ball.velY = (goDown ? 1 : -1) * Math.cos(angle) * BALL_SPEED
  }

  const createBall = (color: BallColor, launchFn: (ball: Ball) => void): Ball => {
    const ball: Ball = {
      id: nextBallId++,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      velX: 0,
      velY: 0,
      color,
    }
    launchFn(ball)
    return ball
  }

  const initializeBalls = useCallback(() => {
    const g = gameRef.current
    nextBallId = 1
    g.balls = [
      createBall('red', launchAtPlayer),
      createBall('green', launchDiagonal),
      createBall('yellow', launchAtCPU),
    ]
  }, [])

  const spawnNewBall = () => {
    const g = gameRef.current
    if (g.balls.length < MAX_BALLS) {
      const colors: BallColor[] = ['red', 'green', 'yellow']
      const color = colors[Math.floor(Math.random() * colors.length)]
      g.balls.push(createBall(color, launchDiagonal))
    }
  }

  const startGame = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true)
      setGameWon(false)
      setPlayerScore(0)
      setCpuScore(0)
      initializeBalls()
    }
  }, [gameStarted, initializeBalls])

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
    if (isPaused || !gameStarted || gameWon) return

    const gameLoop = setInterval(() => {
      const g = gameRef.current

      // Move player paddle
      if (keysRef.current.has('left')) {
        g.playerX = Math.max(0, g.playerX - PADDLE_SPEED)
      }
      if (keysRef.current.has('right')) {
        g.playerX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, g.playerX + PADDLE_SPEED)
      }

      // CPU AI - tracks the ball closest to CPU paddle (lowest Y that's moving up, or highest Y overall)
      let targetBall = g.balls[0]
      for (const ball of g.balls) {
        // Prioritize balls moving toward CPU (negative velY)
        if (ball.velY < 0 && ball.y < targetBall.y) {
          targetBall = ball
        } else if (targetBall.velY >= 0 && ball.y < targetBall.y) {
          targetBall = ball
        }
      }

      if (targetBall) {
        const targetX = targetBall.x - PADDLE_WIDTH / 2
        const diff = targetX - g.cpuX
        const cpuSpeed = PADDLE_SPEED * 0.35
        if (Math.abs(diff) < cpuSpeed) {
          g.cpuX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, targetX))
        } else {
          g.cpuX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, g.cpuX + (diff > 0 ? cpuSpeed : -cpuSpeed)))
        }
      }

      const margin = BALL_SIZE / 2
      const playerPaddleY = CANVAS_HEIGHT - PADDLE_HEIGHT - 20
      const cpuPaddleY = 20
      const ballsToRemove: number[] = []
      let playerScored = 0
      let cpuScored = 0

      // Process each ball
      for (const ball of g.balls) {
        // Move ball
        ball.x += ball.velX
        ball.y += ball.velY

        // Wall bounce - LEFT and RIGHT walls
        if (ball.x <= margin) {
          ball.x = margin
          ball.velX = Math.abs(ball.velX)
        } else if (ball.x >= CANVAS_WIDTH - margin) {
          ball.x = CANVAS_WIDTH - margin
          ball.velX = -Math.abs(ball.velX)
        }

        // Player paddle collision (bottom)
        if (ball.y >= playerPaddleY - BALL_SIZE / 2 && ball.y <= playerPaddleY + PADDLE_HEIGHT) {
          if (ball.x >= g.playerX - BALL_SIZE / 2 && ball.x <= g.playerX + PADDLE_WIDTH + BALL_SIZE / 2) {
            const hitPos = (ball.x - g.playerX) / PADDLE_WIDTH
            const angle = (hitPos - 0.5) * Math.PI / 3
            ball.velX = Math.sin(angle) * BALL_SPEED
            ball.velY = -Math.abs(Math.cos(angle) * BALL_SPEED)
            ball.y = playerPaddleY - BALL_SIZE / 2
          }
        }

        // CPU paddle collision (top)
        if (ball.y <= cpuPaddleY + PADDLE_HEIGHT + BALL_SIZE / 2 && ball.y >= cpuPaddleY) {
          if (ball.x >= g.cpuX - BALL_SIZE / 2 && ball.x <= g.cpuX + PADDLE_WIDTH + BALL_SIZE / 2) {
            const hitPos = (ball.x - g.cpuX) / PADDLE_WIDTH
            const angle = (hitPos - 0.5) * Math.PI / 3
            ball.velX = Math.sin(angle) * BALL_SPEED
            ball.velY = Math.abs(Math.cos(angle) * BALL_SPEED)
            ball.y = cpuPaddleY + PADDLE_HEIGHT + BALL_SIZE / 2
          }
        }

        // Score - ball goes past paddles
        if (ball.y <= 0) {
          // Player scores
          playerScored++
          ballsToRemove.push(ball.id)
        } else if (ball.y >= CANVAS_HEIGHT) {
          // CPU scores
          cpuScored++
          ballsToRemove.push(ball.id)
        }
      }

      // Remove scored balls
      if (ballsToRemove.length > 0) {
        g.balls = g.balls.filter(b => !ballsToRemove.includes(b.id))
      }

      // Update scores
      if (playerScored > 0) {
        setPlayerScore(s => {
          const newScore = s + playerScored
          if (newScore >= WIN_SCORE) {
            setGameWon(true)
            onScore(100) // Bonus for winning
            if (!gameOverCalledRef.current) {
              gameOverCalledRef.current = true
              onGameOver()
            }
          } else {
            onScore(10 * playerScored)
          }
          return newScore
        })
      }

      if (cpuScored > 0) {
        setCpuScore(s => {
          const newScore = s + cpuScored
          if (newScore >= WIN_SCORE) {
            if (!gameOverCalledRef.current) {
              gameOverCalledRef.current = true
              onGameOver()
            }
          }
          return newScore
        })
      }

      // Spawn new balls if below minimum
      while (g.balls.length < MIN_BALLS) {
        spawnNewBall()
      }

      // Spawn to maintain 3 balls if we have exactly 2
      if (g.balls.length === MIN_BALLS && g.balls.length < MAX_BALLS) {
        spawnNewBall()
      }

      // Force re-render
      setTick(t => t + 1)
    }, 16)

    return () => clearInterval(gameLoop)
  }, [isPaused, gameStarted, gameWon, onScore, onGameOver])

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

    // Draw all balls
    for (const ball of g.balls) {
      ctx.fillStyle = BALL_COLORS[ball.color]
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
    }

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
      ctx.fillText('CHAOS MODE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      ctx.font = '14px sans-serif'
      ctx.fillText('3 balls! First to 10 wins', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
      ctx.fillText('Tap to Start!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)
    }

    // Win message
    if (gameWon) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#22c55e'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.fillStyle = 'white'
      ctx.font = '14px sans-serif'
      ctx.fillText('Tap to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }

  }, [playerScore, cpuScore, gameStarted, gameWon, tick])

  // Touch controls
  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!gameStarted || gameWon) {
      if (gameWon) {
        setGameWon(false)
        setGameStarted(false)
      }
      startGame()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    gameRef.current.playerX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
  }, [gameStarted, gameWon, startGame])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleTouch}
        onMouseMove={gameStarted && !gameWon ? handleTouch : undefined}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        className="mx-auto rounded-lg border-2 border-zinc-700 cursor-pointer select-none"
        style={{ touchAction: 'none' }}
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
        Multi-ball chaos! Don't let them past you!
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
  description: 'Chaotic 3-ball paddle game vs CPU',
  color: 'from-amber-500 to-orange-600',
  credit: 'Atari (1972 concept)',
  license: 'Public Domain',
}
