'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    OnChat?: {
      mount: (selector: string, options: {
        channel: string
        hideMobileTabs?: boolean
        hideBrand?: boolean
      }) => void
    }
  }
}

export function OnChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()

  // Hide on gameplay pages
  const isGameplayPage = pathname?.startsWith('/play') || pathname?.startsWith('/game')

  useEffect(() => {
    // Mount OnChat when script is loaded and panel is open
    if (window.OnChat && !isMounted && isOpen) {
      window.OnChat.mount('#onchat-widget', {
        channel: 'bloc',
        hideMobileTabs: true,
        hideBrand: true,
      })
      setIsMounted(true)
    }
  }, [isMounted, isOpen])

  const handleScriptLoad = () => {
    // Will mount when user opens the chat
  }

  const handleOpen = () => {
    setIsOpen(true)
    // Mount on first open
    if (window.OnChat && !isMounted) {
      setTimeout(() => {
        window.OnChat?.mount('#onchat-widget', {
          channel: 'bloc',
          hideMobileTabs: true,
          hideBrand: true,
        })
        setIsMounted(true)
      }, 100)
    }
  }

  // Don't render on gameplay pages
  if (isGameplayPage) {
    return (
      <Script
        src="https://onchat.sebayaki.com/widget.js"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />
    )
  }

  return (
    <>
      {/* Toggle button - top right corner */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className="fixed z-50 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] shadow-lg transition-transform hover:scale-105"
        style={{
          top: '12px',
          right: '12px',
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Chat panel - expands from top right */}
      <div
        className={`fixed z-40 bg-[#09090b] border border-[#27272a] rounded-lg shadow-xl transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          top: '56px', // Below the toggle button
          right: '12px',
          width: isOpen ? 'min(calc(100vw - 24px), 360px)' : '0px',
          height: isOpen ? 'min(calc(100vh - 140px), 500px)' : '0px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          id="onchat-widget"
          style={{
            width: '100%',
            height: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        />
      </div>

      {/* CSS to ensure OnChat widget elements fill the container */}
      <style jsx global>{`
        #onchat-widget > * {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        #onchat-widget iframe {
          flex: 1 !important;
          min-height: 0 !important;
        }
      `}</style>

      <Script
        src="https://onchat.sebayaki.com/widget.js"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />
    </>
  )
}
