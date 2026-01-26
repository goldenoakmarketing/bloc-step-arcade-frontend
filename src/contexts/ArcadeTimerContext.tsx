'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const QUARTER_DURATION = 900 // 15 minutes in seconds

interface ArcadeTimerContextType {
  // Timer state
  timeRemaining: number
  isActive: boolean

  // Actions
  addTime: (seconds?: number) => void

  // Formatters
  formatTime: (seconds: number) => string
}

const ArcadeTimerContext = createContext<ArcadeTimerContextType | null>(null)

export function useArcadeTimer() {
  const context = useContext(ArcadeTimerContext)
  if (!context) {
    throw new Error('useArcadeTimer must be used within ArcadeTimerProvider')
  }
  return context
}

interface ArcadeTimerProviderProps {
  children: ReactNode
}

export function ArcadeTimerProvider({ children }: ArcadeTimerProviderProps) {
  // Core timer state
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = sessionStorage.getItem('arcadeTimer')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        const elapsed = Math.floor((Date.now() - data.savedAt) / 1000)
        const remaining = Math.max(0, data.timeRemaining - elapsed)
        setTimeRemaining(remaining)
      } catch (e) {
        // Invalid saved state, start fresh
      }
    }
  }, [])

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    sessionStorage.setItem('arcadeTimer', JSON.stringify({
      timeRemaining,
      savedAt: Date.now(),
    }))
  }, [timeRemaining])

  // Global timer - counts down every second
  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1
        if (newTime <= 0) {
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining > 0]) // Only re-run effect when timer becomes active/inactive

  // Add time to the timer (called after successful BLOC transfer)
  const addTime = useCallback((seconds: number = QUARTER_DURATION) => {
    setTimeRemaining(prev => prev + seconds)
  }, [])

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const isActive = timeRemaining > 0

  return (
    <ArcadeTimerContext.Provider
      value={{
        timeRemaining,
        isActive,
        addTime,
        formatTime,
      }}
    >
      {children}
    </ArcadeTimerContext.Provider>
  )
}
