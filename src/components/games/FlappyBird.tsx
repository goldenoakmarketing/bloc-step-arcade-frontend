'use client'

/**
 * Flappy Bird Clone
 * Inspired by the original Flappy Bird by Dong Nguyen
 * Implementation based on various open source versions (MIT)
 * https://github.com/CodeExplainedRepo/FlappyBird-JavaScript
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const GRAVITY = 0.35
const JUMP_FORCE = -6
const PIPE_WIDTH = 60
const PIPE_GAP = 170
const PIPE_SPEED = 2
const BIRD_SIZE = 30

interface Pipe {
  x: number
  topHeight: number
  passed: boolean
  id: number
}

export function FlappyBird({ onScore, onGameOver, isPaused }: GameProps) {
  const [birdY, setBirdY] = useState(200)
  const [birdVelocity, setBirdVelocity] = useState(0)
  const [pipes, setPipes] = useState<Pipe[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [birdRotation, setBirdRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextPipeId = useRef(0)
  const gameOverCalledRef = useRef(false)

  const CANVAS_WIDTH = 320
  const CANVAS_HEIGHT = 480

  // Jump
  const jump = useCallback(() => {
    if (isPaused) return

    if (!gameStarted) {
      setGameStarted(true)
    }

    setBirdVelocity(JUMP_FORCE)
  }, [isPaused, gameStarted])

  // Spawn pipes
  useEffect(() => {
    if (isPaused || !gameStarted) return

    const spawn = setInterval(() => {
      const topHeight = 50 + Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 150)

      setPipes(prev => [...prev, {
        id: nextPipeId.current++,
        x: CANVAS_WIDTH,
        topHeight,
        passed: false,
      }])
    }, 2800)

    return () => clearInterval(spawn)
  }, [isPaused, gameStarted])

  // Game loop
  useEffect(() => {
    if (isPaused) return

    const gameLoop = setInterval(() => {
      if (!gameStarted) return

      // Update bird
      setBirdVelocity(v => v + GRAVITY)
      setBirdY(y => {
        const newY = y + birdVelocity

        // Hit ground or ceiling
        if (newY > CANVAS_HEIGHT - BIRD_SIZE || newY < 0) {
          if (!gameOverCalledRef.current) {
            gameOverCalledRef.current = true
            onGameOver()
          }
          return y
        }

        return newY
      })

      // Rotate bird based on velocity
      setBirdRotation(Math.min(Math.max(birdVelocity * 3, -30), 90))

      // Update pipes
      setPipes(prev => {
        const updated = prev
          .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter(pipe => pipe.x > -PIPE_WIDTH)

        // Check collisions and scoring
        updated.forEach(pipe => {
          const birdLeft = 50
          const birdRight = 50 + BIRD_SIZE
          const birdTop = birdY
          const birdBottom = birdY + BIRD_SIZE

          const pipeLeft = pipe.x
          const pipeRight = pipe.x + PIPE_WIDTH

          // Check if bird passed pipe
          if (!pipe.passed && pipeRight < birdLeft) {
            pipe.passed = true
            onScore(10)
          }

          // Check collision
          if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
              if (!gameOverCalledRef.current) {
                gameOverCalledRef.current = true
                onGameOver()
              }
            }
          }
        })

        return updated
      })
    }, 16)

    return () => clearInterval(gameLoop)
  }, [isPaused, gameStarted, birdVelocity, birdY, onScore, onGameOver])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw pipes
    ctx.fillStyle = '#10b981'
    pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight)
      // Pipe cap top
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20)

      // Bottom pipe
      const bottomY = pipe.topHeight + PIPE_GAP
      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY)
      // Pipe cap bottom
      ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 20)
    })

    // Draw bird
    ctx.save()
    ctx.translate(50 + BIRD_SIZE / 2, birdY + BIRD_SIZE / 2)
    ctx.rotate((birdRotation * Math.PI) / 180)

    // Bird body
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Wing
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.ellipse(-5, 5, 8, 5, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Eye
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(8, -5, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(10, -5, 3, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(15, 0)
    ctx.lineTo(22, 3)
    ctx.lineTo(15, 6)
    ctx.closePath()
    ctx.fill()

    ctx.restore()

    // Ground
    ctx.fillStyle = '#065f46'
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20)

    // Start message
    if (!gameStarted) {
      ctx.fillStyle = 'white'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Tap to Start!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }

  }, [birdY, birdRotation, pipes, gameStarted])

  // Controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [jump])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={jump}
        onTouchStart={(e) => { e.preventDefault(); jump() }}
        className="mx-auto rounded-lg border-2 border-zinc-700 cursor-pointer select-none"
        style={{ touchAction: 'none' }}
      />

      <p className="text-muted text-sm mt-4">
        Tap or press Space to flap!
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Inspired by Flappy Bird by Dong Nguyen
      </p>
    </div>
  )
}

export const FlappyBirdMeta = {
  id: 'flappy-bird',
  name: 'Flappy Bird',
  icon: '🐤',
  description: 'Tap to fly through pipes!',
  color: 'from-yellow-400 to-amber-500',
  credit: 'Dong Nguyen (original concept)',
  license: 'MIT',
}
