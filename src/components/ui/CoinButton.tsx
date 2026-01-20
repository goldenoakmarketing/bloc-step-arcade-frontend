'use client'

import { useState } from 'react'

interface CoinButtonProps {
  onClaim: (found: number) => void
}

export function CoinButton({ onClaim }: CoinButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastFound, setLastFound] = useState<number | null>(null)

  const handleClick = () => {
    if (isPlaying) return

    setIsPressed(true)
    setIsPlaying(true)
    setLastFound(null)

    // Play coin sound
    const audio = new Audio('/sounds/coins.mp3')
    audio.play().catch(() => {})

    // Simulate checking the pool - result comes back after delay
    setTimeout(() => {
      // Mock: randomly find 0-4 quarters (in real app, this comes from backend)
      const found = Math.floor(Math.random() * 5)
      setLastFound(found)
      if (found > 0) {
        onClaim(found)
      }
      setIsPlaying(false)
    }, 1500)

    setTimeout(() => setIsPressed(false), 200)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPlaying}
      className="relative group"
    >
      {/* Main button container */}
      <div
        className={`
          relative w-32 h-40 rounded-lg
          ${isPressed ? 'bg-red-600' : 'bg-zinc-900'}
          border-4 border-zinc-700
          transition-all duration-150
          hover:border-red-800 cursor-pointer
          ${isPressed ? 'shadow-[0_0_30px_rgba(239,68,68,0.7)]' : ''}
        `}
        style={{
          boxShadow: isPressed
            ? '0 0 30px rgba(239,68,68,0.7), inset 0 0 20px rgba(239,68,68,0.5)'
            : 'inset 0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        {/* Quarter slot on left */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-black rounded-sm border border-zinc-600" />

        {/* Main content */}
        <div className="flex flex-col items-center justify-center h-full pl-4">
          {/* 25¢ text */}
          <div className={`text-3xl font-bold ${isPressed ? 'text-white' : 'text-zinc-400'}`}>
            25¢
          </div>

          {/* Insert here text */}
          <div className={`text-[10px] mt-2 tracking-wider ${isPressed ? 'text-red-200' : 'text-zinc-600'}`}>
            LOST & FOUND
          </div>
        </div>

        {/* Red backlight glow when pressed */}
        {isPressed && (
          <div className="absolute inset-0 rounded-lg bg-red-500/20 animate-pulse" />
        )}
      </div>

      {/* Label below */}
      <div className="text-center mt-2 text-xs text-muted">
        {isPlaying ? 'Searching...' : lastFound !== null ? (
          lastFound > 0 ? `Found ${lastFound} quarter${lastFound > 1 ? 's' : ''}!` : 'Nothing this time'
        ) : 'Try your luck'}
      </div>
    </button>
  )
}
