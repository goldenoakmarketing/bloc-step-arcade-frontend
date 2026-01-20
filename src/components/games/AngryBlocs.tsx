'use client'

/**
 * Angry Blocs
 * 8-bit style physics slingshot game
 * Inspired by Angry Birds (Rovio) - original concept
 * Implementation created for Bloc Step Arcade
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 400
const GRAVITY = 0.4
const GROUND_Y = CANVAS_HEIGHT - 30
const SLINGSHOT_X = 50
const SLINGSHOT_Y = GROUND_Y - 50

interface Block {
  x: number
  y: number
  width: number
  height: number
  type: 'wood' | 'stone' | 'enemy'
  health: number
  velX: number
  velY: number
  isStatic: boolean // true = not affected by physics until hit
  id: number
}

interface Projectile {
  x: number
  y: number
  velX: number
  velY: number
  radius: number
}

function generateLevel(levelNum: number): Block[] {
  const blocks: Block[] = []
  let id = 0

  const baseX = 200
  const groundLevel = GROUND_Y

  // Different structures based on level
  const structure = levelNum % 5

  if (structure === 1 || structure === 0) {
    // Simple tower
    const height = 2 + Math.min(levelNum, 4)
    for (let i = 0; i < height; i++) {
      blocks.push({
        id: id++,
        x: baseX,
        y: groundLevel - 25 - i * 25,
        width: 30,
        height: 25,
        type: i === height - 1 ? 'enemy' : (i < 2 ? 'stone' : 'wood'),
        health: i === height - 1 ? 1 : (i < 2 ? 3 : 2),
        velX: 0,
        velY: 0,
        isStatic: true,
      })
    }
    // Add side support
    if (levelNum > 2) {
      blocks.push({
        id: id++,
        x: baseX - 25,
        y: groundLevel - 25,
        width: 25,
        height: 25,
        type: 'wood',
        health: 2,
        velX: 0,
        velY: 0,
        isStatic: true,
      })
      blocks.push({
        id: id++,
        x: baseX + 30,
        y: groundLevel - 25,
        width: 25,
        height: 25,
        type: 'wood',
        health: 2,
        velX: 0,
        velY: 0,
        isStatic: true,
      })
    }
  } else if (structure === 2) {
    // Wide pyramid
    for (let row = 0; row < 3; row++) {
      const blocksInRow = 4 - row
      const startX = baseX - (blocksInRow * 25) / 2
      for (let i = 0; i < blocksInRow; i++) {
        const isEnemy = row === 2 && i === Math.floor(blocksInRow / 2)
        blocks.push({
          id: id++,
          x: startX + i * 25,
          y: groundLevel - 25 - row * 25,
          width: 25,
          height: 25,
          type: isEnemy ? 'enemy' : (row === 0 ? 'stone' : 'wood'),
          health: isEnemy ? 1 : (row === 0 ? 3 : 2),
          velX: 0,
          velY: 0,
          isStatic: true,
        })
      }
    }
  } else if (structure === 3) {
    // Two towers with enemy on top
    for (let tower = 0; tower < 2; tower++) {
      const towerX = baseX + tower * 50 - 25
      for (let i = 0; i < 3; i++) {
        blocks.push({
          id: id++,
          x: towerX,
          y: groundLevel - 25 - i * 25,
          width: 25,
          height: 25,
          type: i === 2 ? 'enemy' : 'wood',
          health: i === 2 ? 1 : 2,
          velX: 0,
          velY: 0,
          isStatic: true,
        })
      }
    }
    // Bridge
    blocks.push({
      id: id++,
      x: baseX - 12,
      y: groundLevel - 75,
      width: 50,
      height: 15,
      type: 'stone',
      health: 3,
      velX: 0,
      velY: 0,
      isStatic: true,
    })
  } else {
    // Castle
    // Base
    for (let i = 0; i < 4; i++) {
      blocks.push({
        id: id++,
        x: baseX - 40 + i * 25,
        y: groundLevel - 25,
        width: 25,
        height: 25,
        type: 'stone',
        health: 3,
        velX: 0,
        velY: 0,
        isStatic: true,
      })
    }
    // Walls
    for (let i = 0; i < 2; i++) {
      blocks.push({
        id: id++,
        x: baseX - 40,
        y: groundLevel - 50 - i * 25,
        width: 25,
        height: 25,
        type: 'wood',
        health: 2,
        velX: 0,
        velY: 0,
        isStatic: true,
      })
      blocks.push({
        id: id++,
        x: baseX + 35,
        y: groundLevel - 50 - i * 25,
        width: 25,
        height: 25,
        type: 'wood',
        health: 2,
        velX: 0,
        velY: 0,
        isStatic: true,
      })
    }
    // Enemy inside
    blocks.push({
      id: id++,
      x: baseX - 5,
      y: groundLevel - 45,
      width: 25,
      height: 20,
      type: 'enemy',
      health: 1,
      velX: 0,
      velY: 0,
      isStatic: true,
    })
    // Roof
    blocks.push({
      id: id++,
      x: baseX - 45,
      y: groundLevel - 100,
      width: 110,
      height: 15,
      type: 'wood',
      health: 2,
      velX: 0,
      velY: 0,
      isStatic: true,
    })
  }

  // Add more enemies for higher levels
  if (levelNum > 3) {
    const existingEnemies = blocks.filter(b => b.type === 'enemy').length
    if (existingEnemies < 2) {
      const topBlock = blocks.reduce((a, b) => a.y < b.y ? a : b)
      blocks.push({
        id: id++,
        x: topBlock.x + 30,
        y: topBlock.y,
        width: 22,
        height: 22,
        type: 'enemy',
        health: 1,
        velX: 0,
        velY: 0,
        isStatic: true,
      })
    }
  }

  return blocks
}

export function AngryBlocs({ onScore, onGameOver, isPaused }: GameProps) {
  const [level, setLevel] = useState(1)
  const [blocks, setBlocks] = useState<Block[]>(() => generateLevel(1))
  const [projectile, setProjectile] = useState<Projectile | null>(null)
  const [shotsLeft, setShotsLeft] = useState(3)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPos, setDragPos] = useState({ x: SLINGSHOT_X, y: SLINGSHOT_Y })
  const [gamePhase, setGamePhase] = useState<'aiming' | 'flying' | 'settling' | 'nextLevel' | 'gameOver'>('aiming')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const settleCounterRef = useRef(0)

  const resetLevel = useCallback((levelNum: number) => {
    setBlocks(generateLevel(levelNum))
    setShotsLeft(3 + Math.floor((levelNum - 1) / 2))
    setProjectile(null)
    setGamePhase('aiming')
    setDragPos({ x: SLINGSHOT_X, y: SLINGSHOT_Y })
  }, [])

  const nextLevel = useCallback(() => {
    const newLevel = level + 1
    setLevel(newLevel)
    resetLevel(newLevel)
    onScore(100 * level)
  }, [level, onScore, resetLevel])

  // Main game loop
  useEffect(() => {
    if (isPaused) return

    const update = () => {
      if (gamePhase === 'flying' || gamePhase === 'settling') {
        // Update projectile
        setProjectile(prev => {
          if (!prev) return null

          let { x, y, velX, velY } = prev

          velY += GRAVITY
          x += velX
          y += velY

          // Ground bounce
          if (y >= GROUND_Y - prev.radius) {
            y = GROUND_Y - prev.radius
            velY = -velY * 0.4
            velX *= 0.7
            if (Math.abs(velY) < 1) velY = 0
          }

          // Wall bounce
          if (x <= prev.radius) {
            x = prev.radius
            velX = Math.abs(velX) * 0.5
          }
          if (x >= CANVAS_WIDTH - prev.radius) {
            x = CANVAS_WIDTH - prev.radius
            velX = -Math.abs(velX) * 0.5
          }

          // Check if stopped
          const stopped = Math.abs(velX) < 0.3 && Math.abs(velY) < 0.3 && y >= GROUND_Y - prev.radius - 1

          if (stopped && gamePhase === 'flying') {
            setGamePhase('settling')
          }

          return { ...prev, x, y, velX, velY }
        })

        // Update blocks
        setBlocks(prevBlocks => {
          let newBlocks = prevBlocks.map(block => ({ ...block }))
          let hasCollision = false

          // Check projectile collision with blocks
          if (projectile) {
            newBlocks = newBlocks.map(block => {
              if (block.health <= 0) return block

              // Circle-rect collision
              const closestX = Math.max(block.x, Math.min(projectile.x, block.x + block.width))
              const closestY = Math.max(block.y, Math.min(projectile.y, block.y + block.height))
              const distX = projectile.x - closestX
              const distY = projectile.y - closestY
              const dist = Math.sqrt(distX * distX + distY * distY)

              if (dist < projectile.radius + 5) {
                hasCollision = true
                const damage = Math.ceil(Math.abs(projectile.velX) + Math.abs(projectile.velY)) / 3
                const newHealth = block.health - Math.max(1, damage)

                if (newHealth <= 0) {
                  onScore(block.type === 'enemy' ? 50 : 10)
                }

                // Make this block and neighbors dynamic
                return {
                  ...block,
                  health: newHealth,
                  isStatic: false,
                  velX: projectile.velX * 0.3,
                  velY: projectile.velY * 0.3 - 2,
                }
              }
              return block
            })

            // Slow down projectile on collision
            if (hasCollision) {
              setProjectile(prev => prev ? {
                ...prev,
                velX: prev.velX * 0.5,
                velY: prev.velY * 0.5,
              } : null)
            }
          }

          // Physics for non-static blocks
          newBlocks = newBlocks.map(block => {
            if (block.health <= 0 || block.isStatic) return block

            let { x, y, velX, velY } = block

            velY += GRAVITY
            x += velX
            y += velY

            // Ground collision
            if (y + block.height >= GROUND_Y) {
              y = GROUND_Y - block.height
              velY = -velY * 0.2
              velX *= 0.7
              if (Math.abs(velY) < 2) velY = 0
            }

            // Wall collision
            if (x <= 0) {
              x = 0
              velX = Math.abs(velX) * 0.5
            }
            if (x + block.width >= CANVAS_WIDTH) {
              x = CANVAS_WIDTH - block.width
              velX = -Math.abs(velX) * 0.5
            }

            // Friction
            velX *= 0.9

            // Force stop if very slow
            if (Math.abs(velX) < 0.3) velX = 0
            if (Math.abs(velY) < 0.3 && y + block.height >= GROUND_Y - 1) velY = 0

            return { ...block, x, y, velX, velY }
          })

          // Block-block collision (activate neighbors when hit)
          for (let i = 0; i < newBlocks.length; i++) {
            const a = newBlocks[i]
            if (a.health <= 0) continue

            for (let j = i + 1; j < newBlocks.length; j++) {
              const b = newBlocks[j]
              if (b.health <= 0) continue

              // Check overlap
              if (a.x < b.x + b.width && a.x + a.width > b.x &&
                  a.y < b.y + b.height && a.y + a.height > b.y) {

                // If one is moving, activate the other
                if (!a.isStatic && b.isStatic) {
                  newBlocks[j] = { ...b, isStatic: false, velY: 1 }
                }
                if (!b.isStatic && a.isStatic) {
                  newBlocks[i] = { ...a, isStatic: false, velY: 1 }
                }

                // Push apart and dampen
                const overlapX = Math.min(a.x + a.width - b.x, b.x + b.width - a.x)
                const overlapY = Math.min(a.y + a.height - b.y, b.y + b.height - a.y)

                if (overlapY < overlapX) {
                  if (a.y < b.y) {
                    newBlocks[i] = { ...newBlocks[i], y: newBlocks[i].y - overlapY, velY: 0 }
                    newBlocks[j] = { ...newBlocks[j], y: newBlocks[j].y + overlapY / 2, velY: newBlocks[j].velY * 0.3 }
                  }
                } else {
                  if (a.x < b.x) {
                    newBlocks[i] = { ...newBlocks[i], x: newBlocks[i].x - overlapX / 2, velX: newBlocks[i].velX * 0.3 }
                    newBlocks[j] = { ...newBlocks[j], x: newBlocks[j].x + overlapX / 2, velX: newBlocks[j].velX * 0.3 }
                  }
                }
              }
            }

            // Check if block should fall (no support below)
            if (a.isStatic && a.y + a.height < GROUND_Y - 5) {
              const hasSupport = newBlocks.some(b =>
                b.id !== a.id &&
                b.health > 0 &&
                b.y > a.y &&
                b.x < a.x + a.width &&
                b.x + b.width > a.x &&
                b.y - (a.y + a.height) < 10
              )
              if (!hasSupport) {
                newBlocks[i] = { ...a, isStatic: false }
              }
            }
          }

          return newBlocks.filter(b => b.health > 0)
        })
      }

      // Check for level complete or game over
      if (gamePhase === 'settling') {
        settleCounterRef.current++

        const allSettled = blocks.every(b => b.isStatic || (Math.abs(b.velX) < 0.5 && Math.abs(b.velY) < 0.5))
        const projectileStopped = !projectile || (Math.abs(projectile.velX) < 0.5 && Math.abs(projectile.velY) < 0.5)

        // Force settle after 3 seconds (180 frames) or if everything stopped
        const forceSettle = settleCounterRef.current > 180

        if ((allSettled && projectileStopped) || forceSettle) {
          settleCounterRef.current = 0

          // Force all blocks to stop
          setBlocks(prev => prev.map(b => ({ ...b, velX: 0, velY: 0, isStatic: true })))

          const enemiesLeft = blocks.filter(b => b.type === 'enemy' && b.health > 0).length

          if (enemiesLeft === 0) {
            setGamePhase('nextLevel')
            setTimeout(nextLevel, 1500)
          } else if (shotsLeft <= 0) {
            setGamePhase('gameOver')
            setTimeout(onGameOver, 1500)
          } else {
            setProjectile(null)
            setGamePhase('aiming')
          }
        }
      } else {
        settleCounterRef.current = 0
      }

      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameRef.current)
  }, [isPaused, gamePhase, projectile, blocks, shotsLeft, nextLevel, onGameOver, onScore])

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Sky
    ctx.fillStyle = '#4a90d9'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Clouds (8-bit style)
    ctx.fillStyle = '#fff'
    const drawCloud = (x: number, y: number) => {
      ctx.fillRect(x, y, 30, 10)
      ctx.fillRect(x + 5, y - 8, 20, 10)
      ctx.fillRect(x + 10, y - 14, 15, 10)
    }
    drawCloud(50, 50)
    drawCloud(180, 30)
    drawCloud(260, 70)

    // Ground
    ctx.fillStyle = '#228B22'
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y)
    ctx.fillStyle = '#1a6b1a'
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4)

    // Slingshot
    ctx.fillStyle = '#8B4513'
    // Back post
    ctx.fillRect(SLINGSHOT_X - 8, SLINGSHOT_Y - 15, 6, 65)
    // Front post
    ctx.fillRect(SLINGSHOT_X + 2, SLINGSHOT_Y - 15, 6, 65)
    // Base
    ctx.fillRect(SLINGSHOT_X - 12, SLINGSHOT_Y + 45, 24, 8)

    // Rubber band
    if (isDragging && gamePhase === 'aiming') {
      ctx.strokeStyle = '#654321'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(SLINGSHOT_X - 5, SLINGSHOT_Y - 10)
      ctx.lineTo(dragPos.x, dragPos.y)
      ctx.lineTo(SLINGSHOT_X + 5, SLINGSHOT_Y - 10)
      ctx.stroke()

      // Projectile in slingshot
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.arc(dragPos.x, dragPos.y, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#b91c1c'
      ctx.beginPath()
      ctx.arc(dragPos.x - 2, dragPos.y - 2, 4, 0, Math.PI * 2)
      ctx.fill()

      // Power indicator
      const power = Math.sqrt(Math.pow(SLINGSHOT_X - dragPos.x, 2) + Math.pow(SLINGSHOT_Y - dragPos.y, 2))
      ctx.fillStyle = power > 60 ? '#ef4444' : power > 30 ? '#f59e0b' : '#22c55e'
      ctx.fillRect(10, 10, power, 8)
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1
      ctx.strokeRect(10, 10, 80, 8)
    } else if (gamePhase === 'aiming' && shotsLeft > 0) {
      // Projectile ready
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.arc(SLINGSHOT_X, SLINGSHOT_Y, 10, 0, Math.PI * 2)
      ctx.fill()
    }

    // Flying projectile
    if (projectile) {
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#b91c1c'
      ctx.beginPath()
      ctx.arc(projectile.x - 2, projectile.y - 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Blocks
    blocks.forEach(block => {
      if (block.health <= 0) return

      const { x, y, width, height, type, health } = block

      if (type === 'enemy') {
        // Green pig
        ctx.fillStyle = '#22c55e'
        ctx.beginPath()
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2)
        ctx.fill()

        // Ears
        ctx.fillStyle = '#16a34a'
        ctx.beginPath()
        ctx.arc(x + 4, y + 4, 5, 0, Math.PI * 2)
        ctx.arc(x + width - 4, y + 4, 5, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(x + width / 2 - 5, y + height / 2 - 3, 5, 0, Math.PI * 2)
        ctx.arc(x + width / 2 + 5, y + height / 2 - 3, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'black'
        ctx.beginPath()
        ctx.arc(x + width / 2 - 4, y + height / 2 - 2, 2, 0, Math.PI * 2)
        ctx.arc(x + width / 2 + 6, y + height / 2 - 2, 2, 0, Math.PI * 2)
        ctx.fill()

        // Snout
        ctx.fillStyle = '#15803d'
        ctx.beginPath()
        ctx.ellipse(x + width / 2, y + height / 2 + 5, 6, 4, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#166534'
        ctx.beginPath()
        ctx.arc(x + width / 2 - 2, y + height / 2 + 5, 1.5, 0, Math.PI * 2)
        ctx.arc(x + width / 2 + 2, y + height / 2 + 5, 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else if (type === 'wood') {
        ctx.fillStyle = '#d97706'
        ctx.fillRect(x, y, width, height)
        ctx.fillStyle = '#b45309'
        ctx.fillRect(x + 2, y + 3, width - 4, 3)
        ctx.fillRect(x + 2, y + height - 6, width - 4, 3)
        // Border
        ctx.strokeStyle = '#92400e'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, width, height)

        // Cracks for damage
        if (health === 1) {
          ctx.strokeStyle = '#78350f'
          ctx.beginPath()
          ctx.moveTo(x + 5, y + 5)
          ctx.lineTo(x + width - 5, y + height - 5)
          ctx.moveTo(x + width - 5, y + 5)
          ctx.lineTo(x + 5, y + height - 5)
          ctx.stroke()
        }
      } else {
        // Stone
        ctx.fillStyle = '#6b7280'
        ctx.fillRect(x, y, width, height)
        ctx.fillStyle = '#9ca3af'
        ctx.fillRect(x + 3, y + 3, 8, 8)
        ctx.fillRect(x + width - 12, y + height - 12, 8, 8)
        ctx.strokeStyle = '#4b5563'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, width, height)

        // Cracks
        if (health <= 2) {
          ctx.strokeStyle = '#374151'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x + width / 2, y)
          ctx.lineTo(x + width / 2 + 5, y + height / 2)
          ctx.stroke()
        }
        if (health === 1) {
          ctx.beginPath()
          ctx.moveTo(x, y + height / 2)
          ctx.lineTo(x + width / 2, y + height / 2 - 5)
          ctx.stroke()
        }
      }
    })

    // UI
    ctx.fillStyle = 'white'
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'left'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 3
    ctx.strokeText(`Level ${level}`, 10, CANVAS_HEIGHT - 10)
    ctx.fillText(`Level ${level}`, 10, CANVAS_HEIGHT - 10)

    // Shots remaining (as bird icons)
    for (let i = 0; i < shotsLeft; i++) {
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH - 20 - i * 22, CANVAS_HEIGHT - 15, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    const enemiesLeft = blocks.filter(b => b.type === 'enemy' && b.health > 0).length
    ctx.fillStyle = 'white'
    ctx.textAlign = 'right'
    ctx.strokeText(`${enemiesLeft} left`, CANVAS_WIDTH - 10, 25)
    ctx.fillText(`${enemiesLeft} left`, CANVAS_WIDTH - 10, 25)

    // Phase messages
    if (gamePhase === 'nextLevel') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#22c55e'
      ctx.font = 'bold 28px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('LEVEL CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    }

    if (gamePhase === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 28px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = '16px monospace'
      ctx.fillStyle = 'white'
      ctx.fillText(`Reached Level ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }

  }, [level, shotsLeft, blocks, projectile, isDragging, dragPos, gamePhase])

  // Launch
  const launch = useCallback(() => {
    if (gamePhase !== 'aiming' || shotsLeft <= 0) return

    const power = 0.18
    const velX = (SLINGSHOT_X - dragPos.x) * power
    const velY = (SLINGSHOT_Y - dragPos.y) * power

    // Only launch if there's some power
    if (Math.abs(velX) < 1 && Math.abs(velY) < 1) return

    setProjectile({
      x: SLINGSHOT_X,
      y: SLINGSHOT_Y,
      velX,
      velY,
      radius: 10,
    })

    setShotsLeft(s => s - 1)
    setGamePhase('flying')
    setDragPos({ x: SLINGSHOT_X, y: SLINGSHOT_Y })
  }, [gamePhase, shotsLeft, dragPos])

  // Mouse/touch handlers
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY
    return {
      x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
      y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height),
    }
  }

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (gamePhase !== 'aiming' || shotsLeft <= 0) return
    const pos = getPos(e)
    if (!pos) return

    const dist = Math.sqrt(Math.pow(pos.x - SLINGSHOT_X, 2) + Math.pow(pos.y - SLINGSHOT_Y, 2))
    if (dist < 50) {
      setIsDragging(true)
      setDragPos(pos)
    }
  }, [gamePhase, shotsLeft])

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDragging) return
    const pos = getPos(e)
    if (!pos) return

    // Limit drag distance and keep behind slingshot
    const maxDist = 80
    let dx = pos.x - SLINGSHOT_X
    let dy = pos.y - SLINGSHOT_Y

    // Force drag to be behind/below slingshot
    if (dx > 0) dx = 0

    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist
      dy = (dy / dist) * maxDist
    }

    setDragPos({ x: SLINGSHOT_X + dx, y: SLINGSHOT_Y + dy })
  }, [isDragging])

  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (isDragging) {
      launch()
      setIsDragging(false)
    }
  }, [isDragging, launch])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="mx-auto rounded-lg border-2 border-zinc-700 cursor-crosshair select-none touch-none"
        style={{ touchAction: 'none' }}
      />

      <p className="text-muted text-sm mt-4">
        Pull back and release to launch! Destroy all pigs!
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Inspired by Angry Birds - Rovio (concept)
      </p>
    </div>
  )
}

export const AngryBlocsMeta = {
  id: 'angry-blocs',
  name: 'Angry Blocs',
  icon: '\ud83d\udfe5',
  description: '8-bit slingshot mayhem!',
  color: 'from-red-500 to-orange-500',
  credit: 'Rovio (Angry Birds concept)',
  license: 'Original Implementation',
}
