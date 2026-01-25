'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        // Check if we're in a Farcaster Mini App context
        // The SDK will be available if loaded in Warpcast or other Farcaster clients
        if (typeof window !== 'undefined') {
          // Call ready() to dismiss the splash screen
          await sdk.actions.ready()
          setIsReady(true)
        }
      } catch (error) {
        // Not in Farcaster context or SDK not available
        // App should still work in regular browser
        console.log('Farcaster SDK not available, running in browser mode')
        setIsReady(true)
      }
    }

    initFarcaster()
  }, [])

  // Render children immediately - the splash screen is handled by Farcaster
  // We don't need to block rendering while waiting for ready()
  return <>{children}</>
}
