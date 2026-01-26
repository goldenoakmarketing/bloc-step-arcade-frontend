'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const QUARTER_DURATION = 900 // 15 minutes in seconds
const ABANDON_THRESHOLD = 60 // 1 minute in seconds

interface ArcadeTimerContextType {
  // Timer state
  timeRemaining: number
  isActive: boolean

  // Quarter tracking
  quartersUsed: number
  lostQuarters: number
  availableQuarters: number

  // Actions
  insertQuarter: () => boolean
  setAvailableQuarters: (quarters: number) => void

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
  const [quartersUsed, setQuartersUsed] = useState(0)
  const [lostQuarters, setLostQuarters] = useState(0)
  const [availableQuarters, setAvailableQuarters] = useState(0)

  // Track when last quarter was inserted (for abandon detection)
  const [lastQuarterTimestamp, setLastQuarterTimestamp] = useState<number | null>(null)
  const [lastQuarterTimeValue, setLastQuarterTimeValue] = useState<number>(0)

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
        setQuartersUsed(data.quartersUsed || 0)
        setLostQuarters(data.lostQuarters || 0)

        // Check if there was a pending quarter that got abandoned
        if (data.lastQuarterTimestamp && data.lastQuarterTimeValue) {
          const timeSinceInsert = Math.floor((Date.now() - data.lastQuarterTimestamp) / 1000)
          if (timeSinceInsert < ABANDON_THRESHOLD) {
            // Quarter was inserted recently, check if it should be abandoned
            setLastQuarterTimestamp(data.lastQuarterTimestamp)
            setLastQuarterTimeValue(data.lastQuarterTimeValue)
          } else if (timeSinceInsert < QUARTER_DURATION) {
            // More than 1 minute passed, quarter is "safe"
            setLastQuarterTimestamp(null)
            setLastQuarterTimeValue(0)
          }
        }
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
      quartersUsed,
      lostQuarters,
      lastQuarterTimestamp,
      lastQuarterTimeValue,
      savedAt: Date.now(),
    }))
  }, [timeRemaining, quartersUsed, lostQuarters, lastQuarterTimestamp, lastQuarterTimeValue])

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

  // Check for quarter abandonment when page becomes visible or on navigation
  useEffect(() => {
    const checkAbandonment = () => {
      if (!lastQuarterTimestamp) return

      const timeSinceInsert = Math.floor((Date.now() - lastQuarterTimestamp) / 1000)

      // If more than 1 minute has passed, quarter is "safe" - clear tracking
      if (timeSinceInsert >= ABANDON_THRESHOLD) {
        setLastQuarterTimestamp(null)
        setLastQuarterTimeValue(0)
      }
    }

    // Check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAbandonment()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [lastQuarterTimestamp])

  // Handle page unload - check if quarter should be marked as lost
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!lastQuarterTimestamp) return

      const timeSinceInsert = Math.floor((Date.now() - lastQuarterTimestamp) / 1000)

      // If less than 1 minute, mark quarter as lost
      if (timeSinceInsert < ABANDON_THRESHOLD) {
        const newLost = lostQuarters + 1
        sessionStorage.setItem('arcadeTimer', JSON.stringify({
          timeRemaining: Math.max(0, timeRemaining - lastQuarterTimeValue),
          quartersUsed,
          lostQuarters: newLost,
          lastQuarterTimestamp: null,
          lastQuarterTimeValue: 0,
          savedAt: Date.now(),
        }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [lastQuarterTimestamp, lastQuarterTimeValue, timeRemaining, quartersUsed, lostQuarters])

  // Insert a quarter - adds time and tracks for abandonment
  const insertQuarter = useCallback((): boolean => {
    if (availableQuarters < 1) return false

    setQuartersUsed(prev => prev + 1)
    setTimeRemaining(prev => prev + QUARTER_DURATION)
    setLastQuarterTimestamp(Date.now())
    setLastQuarterTimeValue(QUARTER_DURATION)

    return true
  }, [availableQuarters])

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
        quartersUsed,
        lostQuarters,
        availableQuarters,
        insertQuarter,
        setAvailableQuarters,
        formatTime,
      }}
    >
      {children}
    </ArcadeTimerContext.Provider>
  )
}
