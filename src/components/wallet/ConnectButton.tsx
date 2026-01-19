'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArcadeButton } from '@/components/ui/ArcadeButton'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showModal, setShowModal] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className="flex items-center gap-2 px-4 py-2 font-pixel text-xs
                     bg-arcade-dark border-2 border-neon-cyan
                     hover:bg-arcade-purple/20 transition-colors"
          style={{
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
          }}
        >
          <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          <span className="text-neon-cyan">{formatAddress(address)}</span>
        </button>

        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 p-4 min-w-[200px]
                         bg-arcade-dark border-2 border-arcade-purple z-50"
            >
              <p className="font-arcade text-sm text-gray-400 mb-3">Connected</p>
              <p className="font-pixel text-xs text-white mb-4 break-all">
                {address}
              </p>
              <ArcadeButton
                variant="danger"
                size="sm"
                fullWidth
                onClick={() => {
                  disconnect()
                  setShowModal(false)
                }}
              >
                Disconnect
              </ArcadeButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      <ArcadeButton
        onClick={() => setShowModal(true)}
        variant="primary"
        size="sm"
        loading={isPending}
      >
        Insert Coin
      </ArcadeButton>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-arcade-dark border-4 border-neon-pink p-6 max-w-md w-full"
              style={{
                boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)',
              }}
            >
              <h2 className="font-pixel text-lg text-neon-pink text-center mb-6">
                SELECT WALLET
              </h2>

              <div className="space-y-3">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => {
                      connect({ connector })
                      setShowModal(false)
                    }}
                    className="w-full p-4 font-arcade text-lg text-left
                               bg-arcade-black border-2 border-arcade-purple
                               hover:border-neon-cyan hover:bg-arcade-purple/20
                               transition-all duration-200
                               flex items-center justify-between"
                  >
                    <span>{connector.name}</span>
                    <span className="text-neon-cyan">→</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-6 py-2 font-pixel text-xs text-gray-500
                           hover:text-white transition-colors"
              >
                CANCEL
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
