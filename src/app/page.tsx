'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { CRTScreen } from '@/components/ui/CRTScreen'
import { ArcadeButton } from '@/components/ui/ArcadeButton'
import { NeonText } from '@/components/ui/NeonText'
import { PixelBorder } from '@/components/ui/PixelBorder'

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen px-4 py-8">
      {/* Hero Section - Arcade Cabinet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Cabinet Frame */}
        <div className="cabinet-frame">
          <CRTScreen className="p-6 md:p-8">
            {/* Title */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="font-pixel text-2xl md:text-4xl rainbow-text mb-2">
                BLOC STEP
              </h1>
              <h2 className="font-pixel text-lg md:text-2xl text-neon-pink neon-text-pink">
                ARCADE
              </h2>
            </motion.div>

            {/* Animated Characters */}
            <div className="flex justify-center gap-4 mb-8">
              <motion.span
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                className="text-4xl"
              >
                👾
              </motion.span>
              <motion.span
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                className="text-4xl"
              >
                🎮
              </motion.span>
              <motion.span
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                className="text-4xl"
              >
                🕹️
              </motion.span>
              <motion.span
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                className="text-4xl"
              >
                💎
              </motion.span>
              <motion.span
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
                className="text-4xl"
              >
                🚀
              </motion.span>
            </div>

            {/* Insert Coin Message */}
            {!isConnected ? (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-center mb-6"
              >
                <p className="font-pixel text-sm text-neon-yellow">
                  INSERT COIN TO START
                </p>
                <p className="font-arcade text-lg text-gray-500 mt-2">
                  Connect your wallet to play
                </p>
              </motion.div>
            ) : (
              <div className="text-center mb-6">
                <p className="font-pixel text-sm text-neon-green">
                  READY PLAYER ONE
                </p>
                <p className="font-arcade text-lg text-gray-400 mt-2">
                  Select your game
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <Link href="/play">
                <ArcadeButton fullWidth variant="primary">
                  🎮 START GAME
                </ArcadeButton>
              </Link>

              <Link href="/leaderboard">
                <ArcadeButton fullWidth variant="secondary">
                  🏆 HI-SCORES
                </ArcadeButton>
              </Link>
            </div>

            {/* Credits Display */}
            <div className="mt-8 pt-4 border-t border-arcade-purple/30">
              <div className="flex justify-between items-center">
                <span className="font-arcade text-sm text-gray-500">CREDITS</span>
                <span className="font-pixel text-lg text-neon-cyan">
                  {isConnected ? '99' : '00'}
                </span>
              </div>
            </div>
          </CRTScreen>
        </div>

        {/* Coin Slot */}
        <div className="mt-4 flex justify-center">
          <div className="w-24 h-8 bg-gradient-to-b from-gray-700 to-gray-900 rounded-sm
                          border-2 border-gray-600 flex items-center justify-center">
            <div className="w-16 h-1 bg-black rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <PixelBorder color="pink" className="p-4">
          <div className="text-center">
            <span className="text-3xl">⏱️</span>
            <h3 className="font-pixel text-xs text-neon-pink mt-2">BUY TIME</h3>
            <p className="font-arcade text-sm text-gray-400 mt-1">
              Purchase arcade time with $BLOC tokens
            </p>
          </div>
        </PixelBorder>

        <PixelBorder color="cyan" className="p-4">
          <div className="text-center">
            <span className="text-3xl">🚀</span>
            <h3 className="font-pixel text-xs text-neon-cyan mt-2">YEET</h3>
            <p className="font-arcade text-sm text-gray-400 mt-1">
              Burn tokens for glory on the leaderboard
            </p>
          </div>
        </PixelBorder>

        <PixelBorder color="green" className="p-4">
          <div className="text-center">
            <span className="text-3xl">💰</span>
            <h3 className="font-pixel text-xs text-neon-green mt-2">STAKE</h3>
            <p className="font-arcade text-sm text-gray-400 mt-1">
              Stake $BLOC to earn rewards
            </p>
          </div>
        </PixelBorder>
      </div>

      {/* Marquee Text */}
      <div className="mt-12 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="whitespace-nowrap"
        >
          <span className="font-pixel text-xs text-arcade-purple/50 mx-4">
            ★ PLAY TO EARN ★ YEET TO BURN ★ STAKE TO EARN ★ TOP SCORES WIN PRIZES ★
            ★ PLAY TO EARN ★ YEET TO BURN ★ STAKE TO EARN ★ TOP SCORES WIN PRIZES ★
          </span>
        </motion.div>
      </div>
    </div>
  )
}
