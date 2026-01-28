'use client'

/**
 * 2048 Game
 * Based on the original by Gabriele Cirulli (MIT License)
 * https://github.com/gabrielecirulli/2048
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

type Grid = (number | null)[][]

const GRID_SIZE = 4

function createEmptyGrid(): Grid {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
}

function addRandomTile(grid: Grid): Grid {
  const empty: [number, number][] = []
  grid.forEach((row, i) => row.forEach((cell, j) => {
    if (cell === null) empty.push([i, j])
  }))

  if (empty.length === 0) return grid

  const [row, col] = empty[Math.floor(Math.random() * empty.length)]
  const newGrid = grid.map(r => [...r])
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4
  return newGrid
}

function slide(row: (number | null)[]): { row: (number | null)[], score: number } {
  let score = 0
  const filtered = row.filter(x => x !== null) as number[]
  const result: (number | null)[] = []

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      score += merged
      i++
    } else {
      result.push(filtered[i])
    }
  }

  while (result.length < GRID_SIZE) result.push(null)
  return { row: result, score }
}

function moveGrid(grid: Grid, direction: 'up' | 'down' | 'left' | 'right'): { grid: Grid, score: number } {
  let totalScore = 0
  let newGrid: Grid = grid.map(r => [...r])

  const processRow = (row: (number | null)[]) => {
    const { row: newRow, score } = slide(row)
    totalScore += score
    return newRow
  }

  if (direction === 'left') {
    newGrid = newGrid.map(row => processRow(row))
  } else if (direction === 'right') {
    newGrid = newGrid.map(row => processRow([...row].reverse()).reverse())
  } else if (direction === 'up') {
    for (let col = 0; col < GRID_SIZE; col++) {
      const column = newGrid.map(row => row[col])
      const processed = processRow(column)
      processed.forEach((val, row) => newGrid[row][col] = val)
    }
  } else if (direction === 'down') {
    for (let col = 0; col < GRID_SIZE; col++) {
      const column = newGrid.map(row => row[col]).reverse()
      const processed = processRow(column).reverse()
      processed.forEach((val, row) => newGrid[row][col] = val)
    }
  }

  return { grid: newGrid, score: totalScore }
}

function canMove(grid: Grid): boolean {
  // Check for empty cells
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === null) return true
    }
  }
  // Check for possible merges
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const val = grid[i][j]
      if (j < GRID_SIZE - 1 && grid[i][j + 1] === val) return true
      if (i < GRID_SIZE - 1 && grid[i + 1][j] === val) return true
    }
  }
  return false
}

function gridsEqual(a: Grid, b: Grid): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

const TILE_COLORS: Record<number, string> = {
  2: 'bg-amber-100 text-amber-900',
  4: 'bg-amber-200 text-amber-900',
  8: 'bg-orange-300 text-white',
  16: 'bg-orange-400 text-white',
  32: 'bg-orange-500 text-white',
  64: 'bg-red-500 text-white',
  128: 'bg-yellow-400 text-white',
  256: 'bg-yellow-500 text-white',
  512: 'bg-yellow-600 text-white',
  1024: 'bg-yellow-700 text-white',
  2048: 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50',
}

export function Game2048({ onScore, onGameOver, isPaused }: GameProps) {
  const [grid, setGrid] = useState<Grid>(() => {
    let g = createEmptyGrid()
    g = addRandomTile(g)
    g = addRandomTile(g)
    return g
  })
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null)
  const gameOverCalledRef = useRef(false)

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (isPaused) return

    setGrid(currentGrid => {
      const { grid: newGrid, score } = moveGrid(currentGrid, direction)

      if (gridsEqual(currentGrid, newGrid)) return currentGrid

      if (score > 0) onScore(score)

      const withNewTile = addRandomTile(newGrid)

      if (!canMove(withNewTile)) {
        if (!gameOverCalledRef.current) {
          gameOverCalledRef.current = true
          setTimeout(() => onGameOver(), 500)
        }
      }

      return withNewTile
    })
  }, [isPaused, onScore, onGameOver])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return

      switch (e.key) {
        case 'ArrowUp': case 'w': handleMove('up'); break
        case 'ArrowDown': case 's': handleMove('down'); break
        case 'ArrowLeft': case 'a': handleMove('left'); break
        case 'ArrowRight': case 'd': handleMove('right'); break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove, isPaused])

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const dx = e.changedTouches[0].clientX - touchStart.x
    const dy = e.changedTouches[0].clientY - touchStart.y
    const minSwipe = 50

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
      handleMove(dx > 0 ? 'right' : 'left')
    } else if (Math.abs(dy) > minSwipe) {
      handleMove(dy > 0 ? 'down' : 'up')
    }

    setTouchStart(null)
  }

  return (
    <div className="text-center">
      {/* Grid */}
      <div
        className="bg-amber-900/30 rounded-lg p-2 inline-block"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((value, i) => (
            <div
              key={i}
              className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-lg
                flex items-center justify-center
                font-bold text-lg sm:text-2xl
                transition-all duration-100
                ${value ? TILE_COLORS[value] || 'bg-amber-800 text-white' : 'bg-amber-900/50'}
              `}
            >
              {value}
            </div>
          ))}
        </div>
      </div>

      {/* Controls hint */}
      <p className="text-muted text-sm mt-4">
        Swipe or use arrow keys to merge tiles
      </p>

      {/* Credit */}
      <p className="text-zinc-600 text-xs mt-2">
        Based on 2048 by Gabriele Cirulli
      </p>
    </div>
  )
}

export const Game2048Meta = {
  id: '2048',
  name: '2048',
  icon: '🔢',
  description: 'Merge tiles to reach 2048!',
  color: 'from-amber-500 to-orange-500',
  credit: 'Gabriele Cirulli',
  license: 'MIT',
}
