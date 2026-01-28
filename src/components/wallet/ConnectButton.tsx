'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState } from 'react'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showModal, setShowModal] = useState(false)

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className="btn btn-secondary text-sm"
        >
          {formatAddress(address)}
        </button>

        {showModal && (
          <div className="absolute right-0 top-full mt-2 card min-w-[200px] z-50">
            <p className="text-sm text-muted mb-2">Connected</p>
            <p className="text-xs break-all mb-4">{address}</p>
            <button
              className="btn btn-secondary btn-full text-sm"
              onClick={() => {
                disconnect()
                setShowModal(false)
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-primary text-sm"
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : 'Connect'}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card max-w-sm w-full"
          >
            <h2 className="text-xl font-bold mb-6 text-center">Connect Wallet</h2>

            <div className="space-y-3">
              {connectors.map((connector: { uid: string; name: string }) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector })
                    setShowModal(false)
                  }}
                  className="btn btn-secondary btn-full justify-between"
                >
                  <span>{connector.name}</span>
                  <span>→</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 text-sm text-muted hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
