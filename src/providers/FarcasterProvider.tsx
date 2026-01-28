'use client'

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAccount } from 'wagmi'
import { linkFarcaster } from '@/lib/api'

interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

interface FarcasterContextType {
  isInFarcaster: boolean
  isLoading: boolean
  user: FarcasterUser | null
  clientFid: number | null
  hasAddedApp: boolean
  isLinked: boolean
}

const FarcasterContext = createContext<FarcasterContextType>({
  isInFarcaster: false,
  isLoading: true,
  user: null,
  clientFid: null,
  hasAddedApp: false,
  isLinked: false,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isInFarcaster, setIsInFarcaster] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [clientFid, setClientFid] = useState<number | null>(null)
  const [hasAddedApp, setHasAddedApp] = useState(false)
  const [isLinked, setIsLinked] = useState(false)
  const linkAttemptedRef = useRef(false)
  const { address } = useAccount()

  useEffect(() => {
    const initFarcaster = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        // Get context from SDK (returns a Promise)
        const context = await sdk.context

        if (context && context.user) {
          // We're in a Farcaster Mini App context
          setIsInFarcaster(true)

          // Extract user info
          setUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          })

          // Extract client info
          if (context.client) {
            setClientFid(context.client.clientFid)
            setHasAddedApp(context.client.added)
          }

          // Call ready() to dismiss the splash screen
          await sdk.actions.ready()
        } else {
          // Not in Farcaster context
          setIsInFarcaster(false)
        }
      } catch (error) {
        // Not in Farcaster context or SDK not available
        console.log('Farcaster SDK not available, running in browser mode')
        setIsInFarcaster(false)
      } finally {
        setIsLoading(false)
      }
    }

    initFarcaster()
  }, [])

  // Auto-link Farcaster account when wallet is connected
  useEffect(() => {
    const autoLink = async () => {
      // Only attempt once per session, when we have user and wallet
      if (linkAttemptedRef.current || !user || !address || !user.username) {
        return
      }
      linkAttemptedRef.current = true

      try {
        await linkFarcaster(address, user.fid, user.username)
        setIsLinked(true)
        console.log('Farcaster account linked to wallet')
      } catch (error) {
        // Likely already linked or another error - that's OK
        console.log('Farcaster link attempt:', error)
        setIsLinked(true) // Assume linked if we get an error (likely duplicate)
      }
    }

    autoLink()
  }, [user, address])

  return (
    <FarcasterContext.Provider
      value={{
        isInFarcaster,
        isLoading,
        user,
        clientFid,
        hasAddedApp,
        isLinked,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}
