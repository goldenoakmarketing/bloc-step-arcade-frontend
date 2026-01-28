'use client'

/**
 * Breakout - Classic brick-breaking game
 * Break all the bricks with a bouncing ball and paddle.
 * Original Breakout by Atari (1976)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 480
const PADDLE_WIDTH = 60
const PADDLE_HEIGHT = 10
const PADDLE_Y = CANVAS_HEIGHT - 30
const BALL_RADIUS = 5
const BALL_SPEED = 4
const BRICK_ROWS = 6
const BRICK_COLS = 8
const BRICK_WIDTH = (CANVAS_WIDTH - 20) / BRICK_COLS
const BRICK_HEIGHT = 16
const BRICK_TOP = 60
const BRICK_GAP = 2
const PADDLE_SPEED = 8

const ROW_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
]

const ROW_POINTS = [70, 70, 40, 40, 20, 20]

interface Brick {
  row: number
  col: number
  alive: boolean
}

export function Breakout({ onScore, onGameOver, isPaused }: GameProps) {
  const [gameStarted, setGameStarted] = useState(false)
  const [tick, setTick] = useState(0)
  const [lives, setLives] = useState(3)
  const [bricksLeft, setBricksLeft] = useState(BRICK_ROWS * BRICK_COLS)
  const [waitingLaunch, setWaitingLaunch] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())

  const gameRef = useRef({
    paddleX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: PADDLE_Y - BALL_RADIUS - 1,
    ballVelX: BALL_SPEED * 0.7,
    ballVelY: -BALL_SPEED,
    bricks: [] as Brick[],
    waitingLaunch: true,
  })

  const initBricks = useCallback(() => {
    const bricks: Brick[] = []
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({ row, col, alive: true })
      }
    }
    gameRef.current.bricks = bricks
    setBricksLeft(BRICK_ROWS * BRICK_COLS)
  }, [])

  const resetBall = useCallback(() => {
    const g = gameRef.current
    g.ballX = g.paddleX + PADDLE_WIDTH / 2
    g.ballY = PADDLE_Y - BALL_RADIUS - 1
    g.ballVelX = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED * 0.7
    g.ballVelY = -BALL_SPEED
    g.waitingLaunch = true
    setWaitingLaunch(true)
  }, [])

  const startGame = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true)
      setLives(3)
      gameRef.current.paddleX = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2
      initBricks()
      resetBall()
    }
  }, [gameStarted, initBricks, resetBall])

  const launch = useCallback(() => {
    if (gameRef.current.waitingLaunch) {
      gameRef.current.waitingLaunch = false
      setWaitingLaunch(false)
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.add('left')
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.add('right')
      if (e.code === 'Space') {
        e.preventDefault()
        if (!gameStarted) {
          startGame()
        } else {
          launch()
        }
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
  }, [startGame, launch, gameStarted])

  // Game loop
  useEffect(() => {
    if (isPaused || !gameStarted) return

    const gameLoop = setInterval(() => {
      const g = gameRef.current

      // Move paddle
      if (keysRef.current.has('left')) {
        g.paddleX = Math.max(0, g.paddleX - PADDLE_SPEED)
      }
      if (keysRef.current.has('right')) {
        g.paddleX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, g.paddleX + PADDLE_SPEED)
      }

      // Ball follows paddle when waiting to launch
      if (g.waitingLaunch) {
        g.ballX = g.paddleX + PADDLE_WIDTH / 2
        g.ballY = PADDLE_Y - BALL_RADIUS - 1
        setTick(t => t + 1)
        return
      }

      // Move ball
      g.ballX += g.ballVelX
      g.ballY += g.ballVelY

      // Wall bounces
      if (g.ballX <= BALL_RADIUS) {
        g.ballX = BALL_RADIUS
        g.ballVelX = Math.abs(g.ballVelX)
      } else if (g.ballX >= CANVAS_WIDTH - BALL_RADIUS) {
        g.ballX = CANVAS_WIDTH - BALL_RADIUS
        g.ballVelX = -Math.abs(g.ballVelX)
      }

      // Top wall
      if (g.ballY <= BALL_RADIUS) {
        g.ballY = BALL_RADIUS
        g.ballVelY = Math.abs(g.ballVelY)
      }

      // Paddle collision
      if (
        g.ballY + BALL_RADIUS >= PADDLE_Y &&
        g.ballY - BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
        g.ballX >= g.paddleX - BALL_RADIUS &&
        g.ballX <= g.paddleX + PADDLE_WIDTH + BALL_RADIUS &&
        g.ballVelY > 0
      ) {
        const hitPos = (g.ballX - g.paddleX) / PADDLE_WIDTH
        const angle = (hitPos - 0.5) * (Math.PI / 2.5)
        const speed = Math.sqrt(g.ballVelX * g.ballVelX + g.ballVelY * g.ballVelY)
        g.ballVelX = Math.sin(angle) * speed
        g.ballVelY = -Math.abs(Math.cos(angle) * speed)
        g.ballY = PADDLE_Y - BALL_RADIUS
      }

      // Brick collisions
      let bricksHit = 0
      for (const brick of g.bricks) {
        if (!brick.alive) continue

        const bx = 10 + brick.col * BRICK_WIDTH + BRICK_GAP / 2
        const by = BRICK_TOP + brick.row * (BRICK_HEIGHT + BRICK_GAP)
        const bw = BRICK_WIDTH - BRICK_GAP
        const bh = BRICK_HEIGHT

        if (
          g.ballX + BALL_RADIUS > bx &&
          g.ballX - BALL_RADIUS < bx + bw &&
          g.ballY + BALL_RADIUS > by &&
          g.ballY - BALL_RADIUS < by + bh
        ) {
          brick.alive = false
          bricksHit++

          // Determine bounce direction
          const overlapLeft = (g.ballX + BALL_RADIUS) - bx
          const overlapRight = (bx + bw) - (g.ballX - BALL_RADIUS)
          const overlapTop = (g.ballY + BALL_RADIUS) - by
          const overlapBottom = (by + bh) - (g.ballY - BALL_RADIUS)

          const minOverlapX = Math.min(overlapLeft, overlapRight)
          const minOverlapY = Math.min(overlapTop, overlapBottom)

          if (minOverlapX < minOverlapY) {
            g.ballVelX = -g.ballVelX
          } else {
            g.ballVelY = -g.ballVelY
          }

          onScore(ROW_POINTS[brick.row])
          break // One brick per frame
        }
      }

      if (bricksHit > 0) {
        const remaining = g.bricks.filter(b => b.alive).length
        setBricksLeft(remaining)

        if (remaining === 0) {
          onGameOver()
          return
        }
      }

      // Ball falls below paddle - lose life
      if (g.ballY > CANVAS_HEIGHT + BALL_RADIUS) {
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            onGameOver()
          } else {
            resetBall()
          }
          return newLives
        })
      }

      setTick(t => t + 1)
    }, 16)

    return () => clearInterval(gameLoop)
  }, [isPaused, gameStarted, onScore, onGameOver, resetBall])

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const g = gameRef.current

    // Background
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Bricks
    for (const brick of g.bricks) {
      if (!brick.alive) continue

      const bx = 10 + brick.col * BRICK_WIDTH + BRICK_GAP / 2
      const by = BRICK_TOP + brick.row * (BRICK_HEIGHT + BRICK_GAP)
      const bw = BRICK_WIDTH - BRICK_GAP
      const bh = BRICK_HEIGHT

      ctx.fillStyle = ROW_COLORS[brick.row]
      ctx.fillRect(bx, by, bw, bh)

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(bx, by, bw, 3)
    }

    // Paddle
    ctx.fillStyle = '#10b981'
    ctx.fillRect(g.paddleX, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(g.paddleX, PADDLE_Y, PADDLE_WIDTH, 3)

    // Ball
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(g.ballX, g.ballY, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Lives indicator
    ctx.fillStyle = '#ef4444'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'
    for (let i = 0; i < lives; i++) {
      ctx.fillText('♥', 10 + i * 18, 20)
    }

    // Bricks remaining
    ctx.fillStyle = '#666'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${bricksLeft} left`, CANVAS_WIDTH - 10, 20)

    // Start message
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText('BREAKOUT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      ctx.font = '14px sans-serif'
      ctx.fillText('Break all the bricks!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
      ctx.fillText('Tap to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)
    }

    // Launch prompt
    if (gameStarted && waitingLaunch) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.textAlign = 'center'
      ctx.font = '14px sans-serif'
      ctx.fillText('Tap to Launch', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40)
    }
  }, [gameStarted, lives, bricksLeft, waitingLaunch, tick])

  // Touch/mouse controls
  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!gameStarted) {
      startGame()
      return
    }

    if (gameRef.current.waitingLaunch) {
      launch()
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    gameRef.current.paddleX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
  }, [gameStarted, startGame, launch])

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!gameStarted || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    gameRef.current.paddleX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
  }, [gameStarted])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleTouch}
        onMouseMove={gameStarted ? handleMove : undefined}
        onTouchStart={handleTouch}
        onTouchMove={handleMove}
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
        Break all the bricks! Don't let the ball drop.
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Based on Breakout by Atari (1976)
      </p>
    </div>
  )
}

export const BreakoutMeta = {
  id: 'breakout',
  name: 'Breakout',
  icon: '\ud83e\uddf1',
  description: 'Break all the bricks!',
  color: 'from-red-500 to-yellow-500',
  credit: 'Atari (1976 concept)',
  license: 'Public Domain',
}
