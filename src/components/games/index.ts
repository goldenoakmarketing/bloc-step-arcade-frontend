// Game Registry
// All games are open source with proper attribution
//
// To add a new game:
// 1. Create a new file: MyGame.tsx (include license/credit in header comment)
// 2. Export the game component and MyGameMeta object
// 3. Add import and register it in GAMES array below

import { Game2048, Game2048Meta } from './Game2048'
import { Hextris, HextrisMeta } from './Hextris'
import { FlappyBird, FlappyBirdMeta } from './FlappyBird'
import { Snake, SnakeMeta } from './Snake'
import { EndlessRunner, EndlessRunnerMeta } from './EndlessRunner'
import { Solitaire, SolitaireMeta } from './Solitaire'
import { Ping, PingMeta } from './Ping'
import { DrBloc, DrBlocMeta } from './DrBloc'
import { AngryBlocs, AngryBlocsMeta } from './AngryBlocs'
import { Breakout, BreakoutMeta } from './Breakout'
import { OnchainTrail, OnchainTrailMeta } from './OnchainTrail'
import { GameProps } from './GameWrapper'

export interface GameMeta {
  id: string
  name: string
  icon: string
  description: string
  color: string
  credit?: string
  license?: string
  isFeature?: boolean
  creditCost?: number
  noTimer?: boolean
  fullScreen?: boolean
}

export interface GameRegistration {
  meta: GameMeta
  component: React.ComponentType<GameProps>
}

// ============================================
// REGISTERED GAMES
// ============================================
export const GAMES: GameRegistration[] = [
  { meta: AngryBlocsMeta, component: AngryBlocs },
  { meta: Game2048Meta, component: Game2048 },
  { meta: DrBlocMeta, component: DrBloc },
  { meta: FlappyBirdMeta, component: FlappyBird },
  { meta: SnakeMeta, component: Snake },
  { meta: PingMeta, component: Ping },
  { meta: SolitaireMeta, component: Solitaire },
  { meta: EndlessRunnerMeta, component: EndlessRunner },
  { meta: HextrisMeta, component: Hextris },
  { meta: BreakoutMeta, component: Breakout },
  { meta: OnchainTrailMeta, component: OnchainTrail },
]

// Helper to get game by ID
export function getGameById(id: string): GameRegistration | undefined {
  return GAMES.find(g => g.meta.id === id)
}

// Re-export wrappers
export { GameWrapper } from './GameWrapper'
export { FeatureGameWrapper } from './FeatureGameWrapper'
export type { GameProps } from './GameWrapper'
