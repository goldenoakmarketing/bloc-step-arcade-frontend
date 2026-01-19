'use client'

import { clsx } from 'clsx'

interface CRTScreenProps {
  children: React.ReactNode
  className?: string
  scanlines?: boolean
}

export function CRTScreen({ children, className, scanlines = true }: CRTScreenProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-lg',
        'bg-arcade-black',
        scanlines && 'crt-screen',
        className
      )}
    >
      {/* Scanlines overlay */}
      {scanlines && (
        <div className="absolute inset-0 pointer-events-none z-50 scanlines" />
      )}

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
