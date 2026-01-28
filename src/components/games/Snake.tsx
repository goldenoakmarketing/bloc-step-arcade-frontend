'use client'

/**
 * Snake Game
 * Classic arcade game - public domain concept
 * Various open source implementations available (MIT)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const GRID_SIZE = 20
const CELL_SIZE = 15
const INITIAL_SPEED = 200

type Direction = 'up' | 'down' | 'left' | 'right'
type Position = { x: number; y: number }

export function Snake({ onScore, onGameOver, isPaused }: GameProps) {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ])
  const [food, setFood] = useState<Position>({ x: 15, y: 10 })
  const [direction, setDirection] = useState<Direction>('right')
  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [gameStarted, setGameStarted] = useState(false)
  const directionRef = useRef(direction)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameOverCalledRef = useRef(false)

  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y))
    return newFood
  }, [])

  // Game loop
  useEffect(() => {
    if (isPaused || !gameStarted) return

    const gameLoop = setInterval(() => {
      setSnake(currentSnake => {
        const head = { ...currentSnake[0] }
        const dir = directionRef.current

        // Move head
        switch (dir) {
          case 'up': head.y -= 1; break
          case 'down': head.y += 1; break
          case 'left': head.x -= 1; break
          case 'right': head.x += 1; break
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          if (!gameOverCalledRef.current) {
            gameOverCalledRef.current = true
            onGameOver()
          }
          return currentSnake
        }

        // Check self collision
        if (currentSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          if (!gameOverCalledRef.current) {
            gameOverCalledRef.current = true
            onGameOver()
          }
          return currentSnake
        }

        const newSnake = [head, ...currentSnake]

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          onScore(10)
          setFood(generateFood(newSnake))
          // Speed up slightly
          setSpeed(s => Math.max(s - 2, 50))
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, speed)

    return () => clearInterval(gameLoop)
  }, [isPaused, gameStarted, food, speed, onScore, onGameOver, generateFood])

  // Handle direction changes
  const changeDirection = useCallback((newDir: Direction) => {
    if (!gameStarted) {
      setGameStarted(true)
    }

    const current = directionRef.current
    const opposites: Record<Direction, Direction> = {
      up: 'down', down: 'up', left: 'right', right: 'left'
    }

    if (opposites[current] !== newDir) {
      directionRef.current = newDir
      setDirection(newDir)
    }
  }, [gameStarted])

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isPaused) return

      switch (e.key) {
        case 'ArrowUp': case 'w': e.preventDefault(); changeDirection('up'); break
        case 'ArrowDown': case 's': e.preventDefault(); changeDirection('down'); break
        case 'ArrowLeft': case 'a': e.preventDefault(); changeDirection('left'); break
        case 'ArrowRight': case 'd': e.preventDefault(); changeDirection('right'); break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPaused, changeDirection])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = '#2a2a3e'
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw snake
    snake.forEach((segment, i) => {
      const isHead = i === 0
      ctx.fillStyle = isHead ? '#10b981' : '#059669'
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      )

      // Draw eyes on head
      if (isHead) {
        ctx.fillStyle = 'white'
        const eyeOffset = CELL_SIZE / 4
        ctx.beginPath()
        ctx.arc(
          segment.x * CELL_SIZE + CELL_SIZE / 2 - eyeOffset,
          segment.y * CELL_SIZE + CELL_SIZE / 3,
          2, 0, Math.PI * 2
        )
        ctx.arc(
          segment.x * CELL_SIZE + CELL_SIZE / 2 + eyeOffset,
          segment.y * CELL_SIZE + CELL_SIZE / 3,
          2, 0, Math.PI * 2
        )
        ctx.fill()
      }
    })

    // Draw food
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0, Math.PI * 2
    )
    ctx.fill()

    // Start message
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Swipe or use arrows', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10)
      ctx.fillText('to start!', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 15)
    }

  }, [snake, food, gameStarted])

  // Touch controls
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return

    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    const minSwipe = 30

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
      changeDirection(dx > 0 ? 'right' : 'left')
    } else if (Math.abs(dy) > minSwipe) {
      changeDirection(dy > 0 ? 'down' : 'up')
    }

    touchStart.current = null
  }

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="mx-auto rounded-lg border-2 border-zinc-700 select-none"
        style={{ touchAction: 'none' }}
      />

      {/* Mobile controls */}
      <div className="mt-4 grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
        <div />
        <button onClick={() => changeDirection('up')} className="btn bg-zinc-800 p-3">↑</button>
        <div />
        <button onClick={() => changeDirection('left')} className="btn bg-zinc-800 p-3">←</button>
        <button onClick={() => changeDirection('down')} className="btn bg-zinc-800 p-3">↓</button>
        <button onClick={() => changeDirection('right')} className="btn bg-zinc-800 p-3">→</button>
      </div>

      <p className="text-muted text-sm mt-4">
        Eat food to grow. Don't hit walls or yourself!
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Classic Snake - Public Domain
      </p>
    </div>
  )
}

export const SnakeMeta = {
  id: 'snake',
  name: 'Snake',
  icon: '🐍',
  description: 'Eat, grow, survive!',
  color: 'from-emerald-500 to-green-600',
  credit: 'Classic Arcade',
  license: 'Public Domain',
}
