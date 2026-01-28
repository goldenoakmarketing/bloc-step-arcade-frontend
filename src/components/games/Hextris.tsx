'use client'

/**
 * Hextris
 * Based on the original by Logan Engstrom, Garrett Finucane, Noah Moroze, Michael Yang
 * https://github.com/Hextris/hextris (GPL v3 / MIT fork available)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']
const SIDES = 6
const BLOCK_HEIGHT = 20
const MAX_BLOCKS = 8

interface Block {
  color: string
  side: number
  distance: number
  id: number
}

interface FallingBlock {
  color: string
  side: number
  distance: number
  speed: number
  id: number
}

export function Hextris({ onScore, onGameOver, isPaused }: GameProps) {
  const [rotation, setRotation] = useState(0)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [fallingBlocks, setFallingBlocks] = useState<FallingBlock[]>([])
  const [combo, setCombo] = useState(0)
  const [speed, setSpeed] = useState(1.4)
  const nextBlockId = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameOverCalledRef = useRef(false)

  // Spawn new falling blocks
  useEffect(() => {
    if (isPaused) return

    const spawn = setInterval(() => {
      const side = Math.floor(Math.random() * SIDES)
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]

      setFallingBlocks(prev => [...prev, {
        id: nextBlockId.current++,
        color,
        side,
        distance: 200,
        speed: speed + Math.random(),
      }])
    }, 2000 / (1 + speed * 0.1))

    return () => clearInterval(spawn)
  }, [isPaused, speed])

  // Game loop - move falling blocks
  useEffect(() => {
    if (isPaused) return

    const gameLoop = setInterval(() => {
      setFallingBlocks(prev => {
        const newFalling: FallingBlock[] = []
        const newLanded: Block[] = []

        prev.forEach(block => {
          const newDistance = block.distance - block.speed

          // Check collision with landed blocks
          const adjustedSide = ((block.side - Math.round(rotation / 60)) % SIDES + SIDES) % SIDES
          const landedOnSide = blocks.filter(b => b.side === adjustedSide)
          const maxDistance = 50 + landedOnSide.length * BLOCK_HEIGHT

          if (newDistance <= maxDistance) {
            newLanded.push({
              id: block.id,
              color: block.color,
              side: adjustedSide,
              distance: maxDistance,
            })
          } else {
            newFalling.push({ ...block, distance: newDistance })
          }
        })

        if (newLanded.length > 0) {
          setBlocks(prev => {
            const updated = [...prev, ...newLanded]

            // Check for matches (3+ same color in a row on any side)
            const toRemove = new Set<number>()
            for (let s = 0; s < SIDES; s++) {
              const sideBlocks = updated.filter(b => b.side === s)
                .sort((a, b) => a.distance - b.distance)

              let streak = 1
              let lastColor = ''
              const streakIds: number[] = []

              sideBlocks.forEach(b => {
                if (b.color === lastColor) {
                  streak++
                  streakIds.push(b.id)
                } else {
                  if (streak >= 3) {
                    streakIds.forEach(id => toRemove.add(id))
                    toRemove.add(b.id)
                  }
                  streak = 1
                  streakIds.length = 0
                  streakIds.push(b.id)
                }
                lastColor = b.color
              })

              if (streak >= 3) {
                streakIds.forEach(id => toRemove.add(id))
              }
            }

            if (toRemove.size > 0) {
              onScore(toRemove.size * 10 * (combo + 1))
              setCombo(c => c + 1)
              setTimeout(() => setCombo(0), 2000)
              return updated.filter(b => !toRemove.has(b.id))
            }

            // Check game over
            const maxOnAnySide = Math.max(...Array.from({ length: SIDES }, (_, s) =>
              updated.filter(b => b.side === s).length
            ))

            if (maxOnAnySide >= MAX_BLOCKS) {
              if (!gameOverCalledRef.current) {
                gameOverCalledRef.current = true
                onGameOver()
              }
            }

            return updated
          })
        }

        return newFalling
      })
    }, 16)

    return () => clearInterval(gameLoop)
  }, [isPaused, blocks, rotation, combo, onScore, onGameOver])

  // Speed up over time
  useEffect(() => {
    if (isPaused) return
    const speedUp = setInterval(() => setSpeed(s => Math.min(s + 0.2, 8)), 10000)
    return () => clearInterval(speedUp)
  }, [isPaused])

  // Rotate controls
  const rotate = useCallback((dir: 'left' | 'right') => {
    if (isPaused) return
    setRotation(r => r + (dir === 'left' ? -60 : 60))
  }, [isPaused])

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') rotate('left')
      if (e.key === 'ArrowRight' || e.key === 'd') rotate('right')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [rotate])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = canvas.width / 2
    const cy = canvas.height / 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw hexagon outline
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((rotation * Math.PI) / 180)

    ctx.beginPath()
    for (let i = 0; i < SIDES; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180
      const x = 50 * Math.cos(angle)
      const y = 50 * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw landed blocks
    blocks.forEach(block => {
      const angle = (block.side * 60 - 30) * Math.PI / 180
      const innerR = block.distance - BLOCK_HEIGHT / 2
      const outerR = block.distance + BLOCK_HEIGHT / 2

      ctx.beginPath()
      const a1 = (block.side * 60 - 60) * Math.PI / 180
      const a2 = (block.side * 60) * Math.PI / 180

      ctx.arc(0, 0, innerR, a1, a2)
      ctx.arc(0, 0, outerR, a2, a1, true)
      ctx.closePath()
      ctx.fillStyle = block.color
      ctx.fill()
    })

    ctx.restore()

    // Draw falling blocks (not rotated)
    ctx.save()
    ctx.translate(cx, cy)

    fallingBlocks.forEach(block => {
      const adjustedSide = block.side
      const angle = (adjustedSide * 60 - 30) * Math.PI / 180
      const x = block.distance * Math.cos(angle)
      const y = block.distance * Math.sin(angle)

      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fillStyle = block.color
      ctx.fill()
    })

    ctx.restore()

  }, [blocks, fallingBlocks, rotation])

  return (
    <div className="text-center">
      {/* Combo */}
      <div className="mb-2 h-6">
        {combo > 0 && <span className="badge">{combo}x Combo!</span>}
      </div>

      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="mx-auto bg-zinc-900 rounded-lg border border-zinc-700"
        style={{ touchAction: 'none' }}
      />

      {/* Touch controls */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => rotate('left')}
          className="btn btn-lg bg-zinc-800 hover:bg-zinc-700 w-24"
        >
          ← Left
        </button>
        <button
          onClick={() => rotate('right')}
          className="btn btn-lg bg-zinc-800 hover:bg-zinc-700 w-24"
        >
          Right →
        </button>
      </div>

      <p className="text-muted text-sm mt-4">
        Rotate to catch blocks. Match 3+ colors to clear!
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Based on Hextris by Logan Engstrom et al.
      </p>
    </div>
  )
}

export const HextrisMeta = {
  id: 'hextris',
  name: 'Hextris',
  icon: '⬡',
  description: 'Hexagonal puzzle madness!',
  color: 'from-purple-500 to-pink-500',
  credit: 'Logan Engstrom, Garrett Finucane, Noah Moroze, Michael Yang',
  license: 'GPL v3 / MIT',
}
