import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Use custom RPC URL if provided (e.g., Alchemy), otherwise fallback to default
const baseRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'

// Lazy initialization to avoid SSR issues
let configInstance: ReturnType<typeof createConfig> | null = null

export function getConfig() {
  if (typeof window === 'undefined') {
    // Return a minimal config for SSR - will be replaced on client
    return null
  }

  if (!configInstance) {
    configInstance = createConfig({
      chains: [base, baseSepolia],
      connectors: [
        farcasterMiniApp(),
        injected(),
        walletConnect({ projectId }),
      ],
      transports: {
        [base.id]: http(baseRpcUrl),
        [baseSepolia.id]: http(),
      },
    })
  }

  return configInstance
}

// For backwards compatibility - but prefer getConfig()
export const config = typeof window !== 'undefined' ? createConfig({
  chains: [base, baseSepolia],
  connectors: [
    farcasterMiniApp(),
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [base.id]: http(baseRpcUrl),
    [baseSepolia.id]: http(),
  },
}) : null as any

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
