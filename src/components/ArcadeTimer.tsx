'use client'

import { useArcadeTimer } from '@/contexts/ArcadeTimerContext'

interface ArcadeTimerProps {
  showQuarters?: boolean
  compact?: boolean
}

export function ArcadeTimer({ showQuarters = false, compact = false }: ArcadeTimerProps) {
  const { timeRemaining, formatTime, lostQuarters, quartersUsed } = useArcadeTimer()

  if (timeRemaining <= 0 && !showQuarters) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {timeRemaining > 0 && (
          <span className={`font-mono font-bold ${timeRemaining <= 60 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
            {formatTime(timeRemaining)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {timeRemaining > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 rounded-full border border-zinc-700">
          <span className="text-xs text-muted">Time:</span>
          <span className={`font-mono font-bold ${timeRemaining <= 60 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}

      {showQuarters && (
        <>
          {quartersUsed > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 rounded-full border border-zinc-700">
              <span className="text-xs text-muted">Used:</span>
              <span className="font-bold text-purple-400">{quartersUsed}Q</span>
            </div>
          )}

          {lostQuarters > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 rounded-full border border-red-700/50">
              <span className="text-xs text-red-300">Lost:</span>
              <span className="font-bold text-red-400">{lostQuarters}Q</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
