'use client'

// Onchain Trail - A blockchain survival adventure game
// Lead your crypto startup from garage to WAGMI Valley
// Loaded as an iframe from static build in /games/onchain-trail/

import { GameProps } from './GameWrapper'

export function OnchainTrail(_props: GameProps) {
  return (
    <iframe
      src="/games/onchain-trail/index.html"
      className="w-full h-full border-0"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      allow="autoplay; fullscreen"
      title="Onchain Trail"
    />
  )
}

export const OnchainTrailMeta = {
  id: 'onchain-trail',
  name: 'Onchain Trail',
  icon: '🌄',
  description: 'Lead your crypto startup to WAGMI Valley!',
  color: 'from-amber-600 to-orange-700',
  credit: 'Bloc Step Studios',
  license: 'Proprietary',
  isFeature: true,
  creditCost: 1,
  noTimer: true,
  fullScreen: true,
}
