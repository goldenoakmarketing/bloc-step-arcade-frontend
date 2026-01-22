'use client'

/**
 * Dr. Bloc (Tetris Clone)
 * Based on the original Tetris by Alexey Pajitnov (1984)
 * Implementation created for Bloc Step Arcade
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameProps } from './GameWrapper'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 18
const INITIAL_DROP_INTERVAL = 800

type Cell = string | null
type Board = Cell[][]

interface Piece {
  shape: number[][]
  color: string
  x: number
  y: number
}

const TETROMINOES: { shape: number[][], color: string }[] = [
  // I
  { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
  // O
  { shape: [[1, 1], [1, 1]], color: '#eab308' },
  // T
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
  // S
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' },
  // Z
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' },
  // J
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' },
  // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' },
]

function createBoard(): Board {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
}

function randomPiece(): Piece {
  const tetromino = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]
  return {
    shape: tetromino.shape,
    color: tetromino.color,
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
    y: 0,
  }
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length
  const cols = shape[0].length
  const rotated: number[][] = []
  for (let c = 0; c < cols; c++) {
    const newRow: number[] = []
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(shape[r][c])
    }
    rotated.push(newRow)
  }
  return rotated
}

function isValidPosition(board: Board, piece: Piece): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.x + x
        const boardY = piece.y + y
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return false
        }
        if (boardY >= 0 && board[boardY][boardX]) {
          return false
        }
      }
    }
  }
  return true
}

function placePiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(row => [...row])
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y
        const boardX = piece.x + x
        if (boardY >= 0) {
          newBoard[boardY][boardX] = piece.color
        }
      }
    }
  }
  return newBoard
}

function clearLines(board: Board): { board: Board; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => !cell))
  const linesCleared = BOARD_HEIGHT - newBoard.length
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null))
  }
  return { board: newBoard, linesCleared }
}

export function DrBloc({ onScore, onGameOver, isPaused }: GameProps) {
  const [board, setBoard] = useState<Board>(createBoard)
  const [currentPiece, setCurrentPiece] = useState<Piece>(randomPiece)
  const [nextPiece, setNextPiece] = useState<Piece>(randomPiece)
  const [gameStarted, setGameStarted] = useState(false)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [dropInterval, setDropInterval] = useState(INITIAL_DROP_INTERVAL)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startGame = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true)
    }
  }, [gameStarted])

  // Move piece
  const movePiece = useCallback((dx: number, dy: number): boolean => {
    if (isPaused || !gameStarted) return false

    const newPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy }
    if (isValidPosition(board, newPiece)) {
      setCurrentPiece(newPiece)
      return true
    }
    return false
  }, [isPaused, gameStarted, currentPiece, board])

  // Rotate piece
  const rotatePiece = useCallback(() => {
    if (isPaused || !gameStarted) return

    const rotated = rotate(currentPiece.shape)
    const newPiece = { ...currentPiece, shape: rotated }

    // Try normal position, then wall kicks
    const kicks = [0, -1, 1, -2, 2]
    for (const kick of kicks) {
      const kicked = { ...newPiece, x: newPiece.x + kick }
      if (isValidPosition(board, kicked)) {
        setCurrentPiece(kicked)
        return
      }
    }
  }, [isPaused, gameStarted, currentPiece, board])

  // Hard drop
  const hardDrop = useCallback(() => {
    if (isPaused || !gameStarted) return

    let dropY = currentPiece.y
    while (isValidPosition(board, { ...currentPiece, y: dropY + 1 })) {
      dropY++
    }
    setCurrentPiece(prev => ({ ...prev, y: dropY }))
  }, [isPaused, gameStarted, currentPiece, board])

  // Lock piece and spawn new one
  const lockPiece = useCallback(() => {
    const newBoard = placePiece(board, currentPiece)
    const { board: clearedBoard, linesCleared } = clearLines(newBoard)

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared] * level
      onScore(points)
      setLines(l => {
        const newLines = l + linesCleared
        const newLevel = Math.floor(newLines / 10) + 1
        if (newLevel > level) {
          setLevel(newLevel)
          setDropInterval(Math.max(100, INITIAL_DROP_INTERVAL - (newLevel - 1) * 80))
        }
        return newLines
      })
    }

    setBoard(clearedBoard)

    // Check game over
    if (!isValidPosition(clearedBoard, nextPiece)) {
      onGameOver()
      return
    }

    setCurrentPiece(nextPiece)
    setNextPiece(randomPiece())
  }, [board, currentPiece, nextPiece, level, onScore, onGameOver])

  // Game loop - auto drop
  useEffect(() => {
    if (isPaused || !gameStarted) return

    const drop = setInterval(() => {
      if (!movePiece(0, 1)) {
        lockPiece()
      }
    }, dropInterval)

    return () => clearInterval(drop)
  }, [isPaused, gameStarted, dropInterval, movePiece, lockPiece])

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!gameStarted) {
        if (e.code === 'Space') {
          e.preventDefault()
          startGame()
        }
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          e.preventDefault()
          movePiece(-1, 0)
          break
        case 'ArrowRight':
        case 'd':
          e.preventDefault()
          movePiece(1, 0)
          break
        case 'ArrowDown':
        case 's':
          e.preventDefault()
          movePiece(0, 1)
          break
        case 'ArrowUp':
        case 'w':
          e.preventDefault()
          rotatePiece()
          break
        case ' ':
          e.preventDefault()
          hardDrop()
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameStarted, startGame, movePiece, rotatePiece, hardDrop])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const boardPixelWidth = BOARD_WIDTH * CELL_SIZE
    const boardPixelHeight = BOARD_HEIGHT * CELL_SIZE

    // Clear
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw board background
    ctx.fillStyle = '#0f0f1e'
    ctx.fillRect(0, 0, boardPixelWidth, boardPixelHeight)

    // Draw grid
    ctx.strokeStyle = '#2a2a3e'
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, 0)
      ctx.lineTo(x * CELL_SIZE, boardPixelHeight)
      ctx.stroke()
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL_SIZE)
      ctx.lineTo(boardPixelWidth, y * CELL_SIZE)
      ctx.stroke()
    }

    // Draw placed blocks
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y][x]) {
          ctx.fillStyle = board[y][x]!
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
        }
      }
    }

    // Draw ghost piece
    let ghostY = currentPiece.y
    while (isValidPosition(board, { ...currentPiece, y: ghostY + 1 })) {
      ghostY++
    }
    ctx.globalAlpha = 0.3
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          ctx.fillStyle = currentPiece.color
          ctx.fillRect(
            (currentPiece.x + x) * CELL_SIZE + 1,
            (ghostY + y) * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          )
        }
      }
    }
    ctx.globalAlpha = 1

    // Draw current piece
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          ctx.fillStyle = currentPiece.color
          ctx.fillRect(
            (currentPiece.x + x) * CELL_SIZE + 1,
            (currentPiece.y + y) * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          )
        }
      }
    }

    // Draw next piece preview
    const previewX = boardPixelWidth + 10
    ctx.fillStyle = 'white'
    ctx.font = '12px sans-serif'
    ctx.fillText('Next:', previewX, 15)

    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          ctx.fillStyle = nextPiece.color
          ctx.fillRect(
            previewX + x * CELL_SIZE + 1,
            25 + y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          )
        }
      }
    }

    // Draw stats
    ctx.fillStyle = 'white'
    ctx.font = '12px sans-serif'
    ctx.fillText(`Level: ${level}`, previewX, 110)
    ctx.fillText(`Lines: ${lines}`, previewX, 130)

    // Start message
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(0, 0, boardPixelWidth, boardPixelHeight)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Tap to Start!', boardPixelWidth / 2, boardPixelHeight / 2)
      ctx.textAlign = 'left'
    }

  }, [board, currentPiece, nextPiece, gameStarted, level, lines])

  return (
    <div className="text-center">
      <canvas
        ref={canvasRef}
        width={BOARD_WIDTH * CELL_SIZE + 80}
        height={BOARD_HEIGHT * CELL_SIZE}
        onClick={startGame}
        className="mx-auto rounded-lg border-2 border-zinc-700"
      />

      {/* Touch controls */}
      <div className="grid grid-cols-4 gap-2 mt-4 max-w-[280px] mx-auto">
        <button
          onClick={() => movePiece(-1, 0)}
          className="btn bg-zinc-800 hover:bg-zinc-700 p-3"
        >
          ←
        </button>
        <button
          onClick={rotatePiece}
          className="btn bg-zinc-800 hover:bg-zinc-700 p-3"
        >
          ↻
        </button>
        <button
          onClick={() => movePiece(0, 1)}
          className="btn bg-zinc-800 hover:bg-zinc-700 p-3"
        >
          ↓
        </button>
        <button
          onClick={() => movePiece(1, 0)}
          className="btn bg-zinc-800 hover:bg-zinc-700 p-3"
        >
          →
        </button>
      </div>
      <button
        onClick={hardDrop}
        className="btn bg-purple-700 hover:bg-purple-600 mt-2 px-8"
      >
        Drop
      </button>

      <p className="text-muted text-sm mt-4">
        Arrows to move, Up to rotate, Space to drop
      </p>

      <p className="text-zinc-600 text-xs mt-2">
        Based on Tetris by Alexey Pajitnov (1984)
      </p>
    </div>
  )
}

export const DrBlocMeta = {
  id: 'dr-bloc',
  name: 'Dr. Bloc',
  icon: '\ud83e\uddf1',
  description: 'Stack blocks, clear lines!',
  color: 'from-purple-600 to-indigo-700',
  credit: 'Alexey Pajitnov (1984 concept)',
  license: 'Public Domain',
}
