'use client'

/**
 * Breakout - Classic brick-breaking game with levels
 * Break all the bricks with a bouncing ball and paddle.
 * Features 5 unique level layouts that cycle infinitely with increasing speed.
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
const BASE_BALL_SPEED = 4
const BRICK_COLS = 8
const BRICK_WIDTH = (CANVAS_WIDTH - 20) / BRICK_COLS
const BRICK_HEIGHT = 16
const BRICK_TOP = 60
const BRICK_GAP = 2
const PADDLE_SPEED = 8
const POINTS_PER_BRICK = 10
const SPEED_INCREASE_PER_CYCLE = 0.3 // 30% increase every 5 levels

const BRICK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

interface Brick {
  row: number
  col: number
  alive: boolean
  color: string
}

// Level 1: Standard rows (easy warmup) - 6 rows
function createLevel1(): Brick[] {
  const bricks: Brick[] = []
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({ row, col, alive: true, color: BRICK_COLORS[row % BRICK_COLORS.length] })
    }
  }
  return bricks
}

// Level 2: Pyramid shape
function createLevel2(): Brick[] {
  const bricks: Brick[] = []
  const maxRows = 7
  for (let row = 0; row < maxRows; row++) {
    const bricksInRow = maxRows - row
    const startCol = Math.floor((BRICK_COLS - bricksInRow) / 2)
    for (let i = 0; i < bricksInRow; i++) {
      bricks.push({ row, col: startCol + i, alive: true, color: BRICK_COLORS[row % BRICK_COLORS.length] })
    }
  }
  return bricks
}

// Level 3: Checkerboard pattern
function createLevel3(): Brick[] {
  const bricks: Brick[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if ((row + col) % 2 === 0) {
        bricks.push({ row, col, alive: true, color: BRICK_COLORS[row % BRICK_COLORS.length] })
      }
    }
  }
  return bricks
}

// Level 4: Diamond/fortress with gaps
function createLevel4(): Brick[] {
  const bricks: Brick[] = []
  // Diamond shape
  const pattern = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ]
  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (pattern[row][col] === 1) {
        bricks.push({ row, col, alive: true, color: BRICK_COLORS[row % BRICK_COLORS.length] })
      }
    }
  }
  return bricks
}

// Level 5: Inverted pyramid + scattered
function createLevel5(): Brick[] {
  const bricks: Brick[] = []
  // Inverted pyramid at top
  for (let row = 0; row < 4; row++) {
    const bricksInRow = row + 5
    const startCol = Math.floor((BRICK_COLS - bricksInRow) / 2)
    for (let i = 0; i < bricksInRow && startCol + i < BRICK_COLS; i++) {
      if (startCol + i >= 0) {
        bricks.push({ row, col: startCol + i, alive: true, color: BRICK_COLORS[row % BRICK_COLORS.length] })
      }
    }
  }
  // Scattered bricks below
  const scatteredPattern = [
    [1, 0, 1, 0, 0, 1, 0, 1],
    [0, 1, 0, 1, 1, 0, 1, 0],
    [1, 0, 0, 1, 1, 0, 0, 1],
  ]
  for (let row = 0; row < scatteredPattern.length; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      if (scatteredPattern[row][col] === 1) {
        bricks.push({ row: row + 5, col, alive: true, color: BRICK_COLORS[(row + 4) % BRICK_COLORS.length] })
      }
    }
  }
  return bricks
}

const LEVEL_GENERATORS = [createLevel1, createLevel2, createLevel3, createLevel4, createLevel5]

function getLevelBricks(level: number): Brick[] {
  const layoutIndex = (level - 1) % 5
  return LEVEL_GENERATORS[layoutIndex]()
}

function getBallSpeed(level: number): number {
  const speedMultiplier = Math.pow(1 + SPEED_INCREASE_PER_CYCLE, Math.floor((level - 1) / 5))
  return BASE_BALL_SPEED * speedMultiplier
}

function getLivesMultiplier(lives: number): number {
  if (lives >= 3) return 2.0
  if (lives === 2) return 1.5
  return 1.0
}

type GameState = 'title' | 'playing' | 'levelComplete' | 'gameOver'

export function Breakout({ onScore, onGameOver, isPaused }: GameProps) {
  const [gameState, setGameState] = useState<GameState>('title')
  const [tick, setTick] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [totalScore, setTotalScore] = useState(0)
  const [levelScore, setLevelScore] = useState(0)
  const [bricksLeft, setBricksLeft] = useState(0)
  const [waitingLaunch, setWaitingLaunch] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const gameOverCalledRef = useRef(false)

  const gameRef = useRef({
    paddleX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: PADDLE_Y - BALL_RADIUS - 1,
    ballVelX: BASE_BALL_SPEED * 0.7,
    ballVelY: -BASE_BALL_SPEED,
    bricks: [] as Brick[],
    waitingLaunch: true,
    currentSpeed: BASE_BALL_SPEED,
  })

  const initLevel = useCallback((levelNum: number) => {
    const g = gameRef.current
    g.bricks = getLevelBricks(levelNum)
    g.currentSpeed = getBallSpeed(levelNum)
    setBricksLeft(g.bricks.length)
    setLevelScore(0)
  }, [])

  const resetBall = useCallback(() => {
    const g = gameRef.current
    g.ballX = g.paddleX + PADDLE_WIDTH / 2
    g.ballY = PADDLE_Y - BALL_RADIUS - 1
    g.ballVelX = (Math.random() > 0.5 ? 1 : -1) * g.currentSpeed * 0.7
    g.ballVelY = -g.currentSpeed
    g.waitingLaunch = true
    setWaitingLaunch(true)
  }, [])

  const startGame = useCallback(() => {
    setGameState('playing')
    setLevel(1)
    setLives(3)
    setTotalScore(0)
    setLevelScore(0)
    gameOverCalledRef.current = false
    gameRef.current.paddleX = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2
    initLevel(1)
    resetBall()
  }, [initLevel, resetBall])

  const startNextLevel = useCallback(() => {
    const nextLevel = level + 1
    setLevel(nextLevel)
    setGameState('playing')
    initLevel(nextLevel)
    resetBall()
  }, [level, initLevel, resetBall])

  const launch = useCallback(() => {
    if (gameRef.current.waitingLaunch && gameState === 'playing') {
      gameRef.current.waitingLaunch = false
      setWaitingLaunch(false)
    }
  }, [gameState])

  const handleLevelComplete = useCallback(() => {
    const multiplier = getLivesMultiplier(lives)
    const bonusScore = Math.floor(levelScore * multiplier)
    const scoreToAdd = bonusScore - levelScore // Additional bonus from multiplier

    setTotalScore(prev => prev + scoreToAdd)
    onScore(scoreToAdd) // Report bonus score
    setGameState('levelComplete')
  }, [lives, levelScore, onScore])

  const handleGameOver = useCallback(() => {
    if (!gameOverCalledRef.current) {
      gameOverCalledRef.current = true
      setGameState('gameOver')
      onGameOver()
    }
  }, [onGameOver])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.add('left')
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.add('right')
      if (e.code === 'Space') {
        e.preventDefault()
        if (gameState === 'title') {
          startGame()
        } else if (gameState === 'levelComplete') {
          startNextLevel()
        } else if (gameState === 'playing') {
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
  }, [startGame, startNextLevel, launch, gameState])

  // Game loop
  useEffect(() => {
    if (isPaused || gameState !== 'playing') return

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
        const speed = g.currentSpeed
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

          onScore(POINTS_PER_BRICK)
          setLevelScore(prev => prev + POINTS_PER_BRICK)
          setTotalScore(prev => prev + POINTS_PER_BRICK)
          break // One brick per frame
        }
      }

      if (bricksHit > 0) {
        const remaining = g.bricks.filter(b => b.alive).length
        setBricksLeft(remaining)

        if (remaining === 0) {
          handleLevelComplete()
          return
        }
      }

      // Ball falls below paddle - lose life
      if (g.ballY > CANVAS_HEIGHT + BALL_RADIUS) {
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            handleGameOver()
          } else {
            resetBall()
          }
          return newLives
        })
      }

      setTick(t => t + 1)
    }, 16)

    return () => clearInterval(gameLoop)
  }, [isPaused, gameState, onScore, handleLevelComplete, handleGameOver, resetBall])

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

      ctx.fillStyle = brick.color
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

    // UI Header
    ctx.fillStyle = '#ef4444'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'left'
    for (let i = 0; i < lives; i++) {
      ctx.fillText('♥', 10 + i * 18, 20)
    }

    // Level indicator
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`LVL ${level}`, CANVAS_WIDTH / 2, 20)

    // Score
    ctx.fillStyle = '#aaa'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${totalScore}`, CANVAS_WIDTH - 10, 20)

    // Bricks remaining
    ctx.fillStyle = '#666'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${bricksLeft} left`, CANVAS_WIDTH - 10, 35)

    // Speed indicator (show when above base speed)
    const speedMultiplier = Math.pow(1 + SPEED_INCREASE_PER_CYCLE, Math.floor((level - 1) / 5))
    if (speedMultiplier > 1) {
      ctx.fillStyle = '#f97316'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${speedMultiplier.toFixed(1)}x`, 10, 35)
    }

    // Title screen
    if (gameState === 'title') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('BREAKOUT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
      ctx.font = '14px sans-serif'
      ctx.fillStyle = '#aaa'
      ctx.fillText('5 unique levels', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
      ctx.fillText('Speed increases every 5 levels', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
    }

    // Level complete screen
    if (gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = '#22c55e'
      ctx.textAlign = 'center'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(`LEVEL ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
      ctx.fillText('COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)

      const multiplier = getLivesMultiplier(lives)
      ctx.fillStyle = '#aaa'
      ctx.font = '14px sans-serif'
      ctx.fillText(`Level Score: ${levelScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)

      ctx.fillStyle = '#ffd700'
      ctx.fillText(`Lives Bonus: ${multiplier.toFixed(1)}x`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)

      const bonusScore = Math.floor(levelScore * multiplier)
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`= ${bonusScore} pts`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)

      ctx.fillStyle = 'white'
      ctx.font = '12px sans-serif'
      ctx.fillText(`Total: ${totalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90)

      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText('TAP TO CONTINUE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130)
    }

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.fillStyle = '#ef4444'
      ctx.textAlign = 'center'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

      ctx.fillStyle = '#aaa'
      ctx.font = '14px sans-serif'
      ctx.fillText(`Reached Level ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)

      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(`Final Score: ${totalScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)
    }

    // Launch prompt
    if (gameState === 'playing' && waitingLaunch) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.textAlign = 'center'
      ctx.font = '14px sans-serif'
      ctx.fillText('Tap to Launch', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
    }
  }, [gameState, level, lives, totalScore, levelScore, bricksLeft, waitingLaunch, tick])

  // Touch/mouse controls
  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (gameState === 'title') {
      startGame()
      return
    }

    if (gameState === 'levelComplete') {
      startNextLevel()
      return
    }

    if (gameState === 'playing') {
      if (gameRef.current.waitingLaunch) {
        launch()
      }

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width)
      gameRef.current.paddleX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
    }
  }, [gameState, startGame, startNextLevel, launch])

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== 'playing' || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width)
    gameRef.current.paddleX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
  }, [gameState])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleTouch}
        onMouseMove={gameState === 'playing' ? handleMove : undefined}
        onTouchStart={handleTouch}
        onTouchMove={handleMove}
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
        Clear all bricks! Keep your balls to earn bonus multipliers.
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
