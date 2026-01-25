'use client'

import { useEffect } from 'react'
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
  useEffect(() => {
    // Mount OnChat when script is loaded and component mounts
    if (window.OnChat) {
      window.OnChat.mount('#onchat-widget', {
        channel: 'bloc',
        hideMobileTabs: true,
        hideBrand: true,
      })
    }
  }, [])

  const handleScriptLoad = () => {
    if (window.OnChat) {
      window.OnChat.mount('#onchat-widget', {
        channel: 'bloc',
        hideMobileTabs: true,
        hideBrand: true,
      })
    }
  }

  return (
    <>
      <div id="onchat-widget" />
      <Script
        src="https://onchat.sebayaki.com/widget.js"
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />
    </>
  )
}
