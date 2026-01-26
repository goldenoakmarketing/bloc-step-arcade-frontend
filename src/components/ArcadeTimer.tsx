'use client'

import { useArcadeTimer } from '@/contexts/ArcadeTimerContext'

interface ArcadeTimerProps {
  compact?: boolean
}

export function ArcadeTimer({ compact = false }: ArcadeTimerProps) {
  const { timeRemaining, formatTime } = useArcadeTimer()

  if (timeRemaining <= 0) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-mono font-bold ${timeRemaining <= 60 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 rounded-full border border-zinc-700">
        <span className="text-xs text-muted">Time:</span>
        <span className={`font-mono font-bold ${timeRemaining <= 60 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  )
}
