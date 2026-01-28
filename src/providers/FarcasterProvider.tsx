'use client'

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAccount } from 'wagmi'
import { linkFarcaster, registerNotificationToken } from '@/lib/api'

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
  notificationsEnabled: boolean
  promptAddApp: () => Promise<boolean>
}

const FarcasterContext = createContext<FarcasterContextType>({
  isInFarcaster: false,
  isLoading: true,
  user: null,
  clientFid: null,
  hasAddedApp: false,
  isLinked: false,
  notificationsEnabled: false,
  promptAddApp: async () => false,
})

export function useFarcaster() {
  return useContext(FarcasterContext)
}

interface FarcasterProviderProps {
  children: ReactNode
}

// Inner component that uses wagmi hooks - only rendered after mount
function FarcasterProviderInner({ children }: FarcasterProviderProps) {
  const [isInFarcaster, setIsInFarcaster] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [clientFid, setClientFid] = useState<number | null>(null)
  const [hasAddedApp, setHasAddedApp] = useState(false)
  const [isLinked, setIsLinked] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const linkAttemptedRef = useRef(false)
  const notificationAttemptedRef = useRef(false)
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
            // Check if notifications are already enabled
            if (context.client.notificationDetails) {
              setNotificationsEnabled(true)
            }
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

  // Auto-prompt to add app and enable notifications when user and wallet are ready
  useEffect(() => {
    const promptNotifications = async () => {
      // Only attempt once per session, when in Farcaster context with user and wallet
      if (notificationAttemptedRef.current || !isInFarcaster || !user || !address || hasAddedApp) {
        return
      }
      notificationAttemptedRef.current = true

      try {
        // Prompt user to add the mini app (which also enables notifications)
        const result = await sdk.actions.addFrame()

        if (result.type === 'added' && result.notificationDetails) {
          setHasAddedApp(true)
          setNotificationsEnabled(true)

          // Register notification token with backend
          await registerNotificationToken(
            address,
            user.fid,
            result.notificationDetails.url,
            result.notificationDetails.token
          )
          console.log('Notification token registered with backend')
        } else if (result.type === 'added') {
          setHasAddedApp(true)
          console.log('App added but notifications not enabled')
        }
      } catch (error) {
        // User declined or error occurred - that's OK
        console.log('Add app prompt:', error)
      }
    }

    // Delay the prompt slightly so it doesn't interfere with initial load
    const timer = setTimeout(promptNotifications, 2000)
    return () => clearTimeout(timer)
  }, [isInFarcaster, user, address, hasAddedApp])

  // Function to manually prompt user to add app
  const promptAddApp = async (): Promise<boolean> => {
    if (!isInFarcaster || !user || !address) {
      return false
    }

    try {
      const result = await sdk.actions.addFrame()

      if (result.type === 'added') {
        setHasAddedApp(true)

        if (result.notificationDetails) {
          setNotificationsEnabled(true)
          await registerNotificationToken(
            address,
            user.fid,
            result.notificationDetails.url,
            result.notificationDetails.token
          )
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to add app:', error)
      return false
    }
  }

  return (
    <FarcasterContext.Provider
      value={{
        isInFarcaster,
        isLoading,
        user,
        clientFid,
        hasAddedApp,
        isLinked,
        notificationsEnabled,
        promptAddApp,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  )
}

// Outer component that handles SSR
export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR, render children without Farcaster context
  if (!mounted) {
    return (
      <FarcasterContext.Provider
        value={{
          isInFarcaster: false,
          isLoading: true,
          user: null,
          clientFid: null,
          hasAddedApp: false,
          isLinked: false,
          notificationsEnabled: false,
          promptAddApp: async () => false,
        }}
      >
        {children}
      </FarcasterContext.Provider>
    )
  }

  return <FarcasterProviderInner>{children}</FarcasterProviderInner>
}
