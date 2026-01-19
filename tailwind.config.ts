import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Retro arcade neon palette
        arcade: {
          black: '#0a0a0f',
          dark: '#12121a',
          purple: '#9d4edd',
          pink: '#ff006e',
          cyan: '#00f5d4',
          yellow: '#fee440',
          orange: '#ff9500',
          red: '#ff0054',
          green: '#00ff87',
          blue: '#00bbf9',
        },
        neon: {
          pink: '#ff00ff',
          cyan: '#00ffff',
          green: '#39ff14',
          yellow: '#ffff00',
          orange: '#ff6600',
        }
      },
      fontFamily: {
        pixel: ['var(--font-pixel)', 'monospace'],
        arcade: ['var(--font-arcade)', 'monospace'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'scanline': 'scanline 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'coin-insert': 'coin-insert 0.5s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': {
            opacity: '1',
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor'
          },
          '50%': {
            opacity: '0.8',
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor'
          },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'coin-insert': {
          '0%': { transform: 'translateY(-100%) rotateX(0deg)', opacity: '0' },
          '50%': { transform: 'translateY(0) rotateX(180deg)', opacity: '1' },
          '100%': { transform: 'translateY(100%) rotateX(360deg)', opacity: '0' },
        },
      },
      boxShadow: {
        'neon-pink': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff',
        'neon-cyan': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff',
        'neon-green': '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 20px #39ff14',
        'neon-yellow': '0 0 5px #ffff00, 0 0 10px #ffff00, 0 0 20px #ffff00',
        'arcade': '0 0 0 2px #ff00ff, 0 0 10px #ff00ff, inset 0 0 20px rgba(255,0,255,0.1)',
        'cabinet': '0 10px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(157, 78, 221, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(157, 78, 221, 0.1) 1px, transparent 1px)`,
        'crt-overlay': `repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        )`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}

export default config
