'use client'

/**
 * Endless Runner
 * Based on various open source implementations (MIT)
 * https://github.com/straker/endless-runner-html5-game
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 400
const GROUND_HEIGHT = 50
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 50
const GRAVITY = 0.55
const JUMP_FORCE = -12
const OBSTACLE_WIDTH = 30

interface Obstacle {
  x: number
  width: number
  height: number
  type: 'low' | 'high'
  id: number
}

export function EndlessRunner({ onScore, onGameOver, isPaused }: GameProps) {
  const [playerY, setPlayerY] = useState(CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT)
  const [velocity, setVelocity] = useState(0)
  const [isJumping, setIsJumping] = useState(false)
  const [isDucking, setIsDucking] = useState(false)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [distance, setDistance] = useState(0)
  const [speed, setSpeed] = useState(3.5)
  const [gameStarted, setGameStarted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextObstacleId = useRef(0)
  const gameOverCalledRef = useRef(false)
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT

  const playerHeight = isDucking ? PLAYER_HEIGHT / 2 : PLAYER_HEIGHT
  const playerTop = groundY - playerHeight + (isDucking ? 0 : (playerY - (groundY - PLAYER_HEIGHT)))

  // Jump
  const jump = useCallback(() => {
    if (isPaused) return
    if (!gameStarted) setGameStarted(true)

    if (!isJumping && playerY >= groundY - PLAYER_HEIGHT - 1) {
      setVelocity(JUMP_FORCE)
      setIsJumping(true)
    }
  }, [isPaused, gameStarted, isJumping, playerY, groundY])

  // Duck
  const duck = useCallback((ducking: boolean) => {
    if (isPaused || isJumping) return
    setIsDucking(ducking)
  }, [isPaused, isJumping])

  // Spawn obstacles
  useEffect(() => {
    if (isPaused || !gameStarted) return

    const spawn = setInterval(() => {
      const type = Math.random() > 0.3 ? 'low' : 'high'
      const height = type === 'low'
        ? 30 + Math.random() * 30
        : 20 + Math.random() * 20

      setObstacles(prev => [...prev, {
        id: nextObstacleId.current++,
        x: CANVAS_WIDTH,
        width: OBSTACLE_WIDTH + Math.random() * 20,
        height,
        type,
      }])
    }, 2000 + Math.random() * 1200)

    return () => clearInterval(spawn)
  }, [isPaused, gameStarted])

  // Game loop
  useEffect(() => {
    if (isPaused || !gameStarted) return

    const gameLoop = setInterval(() => {
      // Update player physics
      setVelocity(v => v + GRAVITY)
      setPlayerY(y => {
        const newY = y + velocity
        const ground = groundY - PLAYER_HEIGHT

        if (newY >= ground) {
          setIsJumping(false)
          setVelocity(0)
          return ground
        }
        return newY
      })

      // Update obstacles
      setObstacles(prev => {
        const updated = prev
          .map(obs => ({ ...obs, x: obs.x - speed }))
          .filter(obs => obs.x > -obs.width)

        return updated
      })

      // Update distance and speed
      setDistance(d => {
        const newD = d + speed
        if (newD % 500 < speed) {
          onScore(10)
        }
        return newD
      })

      setSpeed(s => Math.min(s + 0.001, 12))

    }, 16)

    return () => clearInterval(gameLoop)
  }, [isPaused, gameStarted, velocity, speed, groundY, onScore])

  // Collision detection
  useEffect(() => {
    if (!gameStarted) return

    const playerLeft = 50
    const playerRight = 50 + PLAYER_WIDTH
    const playerTopPos = playerY
    const playerBottom = playerY + playerHeight

    for (const obs of obstacles) {
      const obsLeft = obs.x
      const obsRight = obs.x + obs.width

      if (playerRight > obsLeft && playerLeft < obsRight) {
        if (obs.type === 'low') {
          // Ground obstacle - check bottom collision
          const obsTop = groundY - obs.height
          if (playerBottom > obsTop) {
            if (!gameOverCalledRef.current) {
              gameOverCalledRef.current = true
              onGameOver()
            }
            return
          }
        } else {
          // Flying obstacle - check if player is standing and not ducking
          const obsBottom = 100 + obs.height
          if (playerTopPos < obsBottom && !isDucking) {
            if (!gameOverCalledRef.current) {
              gameOverCalledRef.current = true
              onGameOver()
            }
            return
          }
        }
      }
    }
  }, [obstacles, playerY, playerHeight, isDucking, groundY, gameStarted, onGameOver])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Ground
    ctx.fillStyle = '#0f3460'
    ctx.fillRect(0, groundY, CANVAS_WIDTH, GROUND_HEIGHT)

    // Ground line
    ctx.strokeStyle = '#e94560'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.lineTo(CANVAS_WIDTH, groundY)
    ctx.stroke()

    // Moving ground texture
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1
    const offset = distance % 20
    for (let x = -offset; x < CANVAS_WIDTH; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, groundY + 10)
      ctx.lineTo(x + 10, groundY + 10)
      ctx.stroke()
    }

    // Player
    ctx.fillStyle = '#e94560'
    const drawY = playerY
    const drawHeight = playerHeight

    // Body
    ctx.fillRect(50, drawY, PLAYER_WIDTH, drawHeight)

    // Eye
    ctx.fillStyle = 'white'
    ctx.fillRect(75, drawY + 10, 8, 8)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(79, drawY + 12, 4, 4)

    // Obstacles
    obstacles.forEach(obs => {
      if (obs.type === 'low') {
        // Ground obstacle (cactus-like)
        ctx.fillStyle = '#10b981'
        ctx.fillRect(obs.x, groundY - obs.height, obs.width, obs.height)
        // Spikes
        ctx.fillStyle = '#059669'
        for (let i = 0; i < obs.width; i += 10) {
          ctx.beginPath()
          ctx.moveTo(obs.x + i, groundY - obs.height)
          ctx.lineTo(obs.x + i + 5, groundY - obs.height - 10)
          ctx.lineTo(obs.x + i + 10, groundY - obs.height)
          ctx.fill()
        }
      } else {
        // Flying obstacle (bird-like)
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.ellipse(
          obs.x + obs.width / 2,
          80 + obs.height / 2,
          obs.width / 2,
          obs.height / 2,
          0, 0, Math.PI * 2
        )
        ctx.fill()
        // Wings
        ctx.fillStyle = '#d97706'
        const wingFlap = Math.sin(Date.now() / 100) * 5
        ctx.beginPath()
        ctx.ellipse(
          obs.x + obs.width / 2,
          80 + obs.height / 2 + wingFlap,
          obs.width / 3,
          obs.height / 4,
          0, 0, Math.PI * 2
        )
        ctx.fill()
      }
    })

    // Distance display
    ctx.fillStyle = 'white'
    ctx.font = '16px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.floor(distance)}m`, CANVAS_WIDTH - 10, 25)

    // Start message
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Tap to Jump!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      ctx.font = '14px sans-serif'
      ctx.fillText('Hold to Duck', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10)
    }

  }, [playerY, playerHeight, obstacles, distance, groundY, gameStarted])

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        duck(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        duck(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [jump, duck])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={jump}
        onTouchStart={jump}
        onMouseDown={() => duck(true)}
        onMouseUp={() => duck(false)}
        onTouchEnd={() => duck(false)}
        className="mx-auto rounded-lg border-2 border-zinc-700 cursor-pointer select-none"
        style={{ touchAction: 'none' }}
      />

      <div className="flex justify-center gap-4 mt-4">
        <button
          onMouseDown={jump}
          onTouchStart={jump}
          className="btn bg-zinc-800 hover:bg-zinc-700 px-8"
        >
          Jump ↑
        </button>
        <button
          onMouseDown={() => duck(true)}
          onMouseUp={() => duck(false)}
          onTouchStart={() => duck(true)}
          onTouchEnd={() => duck(false)}
          className="btn bg-zinc-800 hover:bg-zinc-700 px-8"
        >
          Duck ↓
        </button>
      </div>

      <p className="text-muted text-sm mt-4">
        Jump over obstacles, duck under birds!
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Based on Endless Runner by Steven Lambert
      </p>
    </div>
  )
}

export const EndlessRunnerMeta = {
  id: 'endless-runner',
  name: 'Endless Runner',
  icon: '🏃',
  description: 'Run, jump, duck, survive!',
  color: 'from-red-500 to-pink-500',
  credit: 'Steven Lambert',
  license: 'MIT',
}
