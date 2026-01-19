'use client'

import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface ArcadeButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  fullWidth?: boolean
}

const variantClasses = {
  primary: 'bg-gradient-to-b from-arcade-purple to-arcade-pink border-arcade-pink',
  secondary: 'bg-gradient-to-b from-arcade-dark to-arcade-black border-arcade-cyan',
  success: 'bg-gradient-to-b from-green-500 to-green-700 border-green-400',
  danger: 'bg-gradient-to-b from-red-500 to-red-700 border-red-400',
}

const sizeClasses = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function ArcadeButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  fullWidth = false,
}: ArcadeButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.95, y: 4 }}
      className={clsx(
        'relative font-pixel uppercase tracking-wider',
        'border-4 transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      style={{
        boxShadow: `0 6px 0 rgba(0,0,0,0.4), 0 8px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)`,
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin">⟳</span>
          <span className="loading-dots">Loading</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
