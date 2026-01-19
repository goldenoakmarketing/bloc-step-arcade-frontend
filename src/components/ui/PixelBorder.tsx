'use client'

import { clsx } from 'clsx'

interface PixelBorderProps {
  children: React.ReactNode
  color?: 'pink' | 'cyan' | 'green' | 'yellow'
  className?: string
  glow?: boolean
}

const colorStyles = {
  pink: {
    border: 'border-neon-pink',
    shadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff',
    glow: 'shadow-neon-pink',
  },
  cyan: {
    border: 'border-neon-cyan',
    shadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
    glow: 'shadow-neon-cyan',
  },
  green: {
    border: 'border-neon-green',
    shadow: '0 0 10px #39ff14, 0 0 20px #39ff14',
    glow: 'shadow-neon-green',
  },
  yellow: {
    border: 'border-neon-yellow',
    shadow: '0 0 10px #ffff00, 0 0 20px #ffff00',
    glow: 'shadow-neon-yellow',
  },
}

export function PixelBorder({
  children,
  color = 'pink',
  className,
  glow = true,
}: PixelBorderProps) {
  const styles = colorStyles[color]

  return (
    <div
      className={clsx(
        'border-4 bg-arcade-dark/80 backdrop-blur-sm',
        styles.border,
        glow && styles.glow,
        className
      )}
      style={glow ? { boxShadow: styles.shadow } : undefined}
    >
      {children}
    </div>
  )
}
