'use client'

import { clsx } from 'clsx'

interface NeonTextProps {
  children: React.ReactNode
  color?: 'pink' | 'cyan' | 'green' | 'yellow' | 'orange'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  pulse?: boolean
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div'
}

const colorClasses = {
  pink: 'text-neon-pink neon-text-pink',
  cyan: 'text-neon-cyan neon-text-cyan',
  green: 'text-neon-green neon-text-green',
  yellow: 'text-neon-yellow neon-text-yellow',
  orange: 'text-neon-orange',
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
}

export function NeonText({
  children,
  color = 'pink',
  size = 'md',
  className,
  pulse = false,
  as: Component = 'span',
}: NeonTextProps) {
  return (
    <Component
      className={clsx(
        'font-pixel',
        colorClasses[color],
        sizeClasses[size],
        pulse && 'animate-pulse-neon',
        className
      )}
    >
      {children}
    </Component>
  )
}
