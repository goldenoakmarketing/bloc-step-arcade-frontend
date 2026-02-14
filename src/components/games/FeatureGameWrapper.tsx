'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAccount } from 'wagmi'
import { useFarcaster } from '@/providers/FarcasterProvider'
import { reportTimeConsumed } from '@/lib/api'

const APP_URL = 'blocsteparcade.netlify.app'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bloc-step-arcade-backend-production.up.railway.app'

// ─── Backend helpers ────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  isCurrentPlayer?: boolean
}

async function submitScore(
  walletAddress: string,
  gameId: string,
  score: number,
  farcasterUsername?: string,
  farcasterFid?: number,
  farcasterPfp?: string
): Promise<{ rank: number | null }> {
  try {
    const res = await fetch(`${API_URL}/api/v1/leaderboards/game/${gameId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Wallet-Address': walletAddress },
      body: JSON.stringify({ score, farcasterUsername, farcasterFid, farcasterPfp }),
    })
    const json = await res.json()
    if (json.success) return { rank: json.data.rank }
    return { rank: null }
  } catch {
    return { rank: null }
  }
}

async function fetchGameLeaderboard(gameId: string, limit = 5): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/leaderboards/game/${gameId}?limit=${limit}`)
    const json = await res.json()
    if (json.success && json.data) {
      return json.data.map((entry: { rank: number; farcasterUsername?: string; walletAddress: string; score: string }) => ({
        rank: entry.rank,
        name: entry.farcasterUsername || `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`,
        score: parseInt(entry.score),
        isCurrentPlayer: false,
      }))
    }
    return []
  } catch {
    return []
  }
}

// ─── Share helpers ───────────────────────────────────────────────

async function shareToFarcaster(text: string, imageUrl: string, isInFarcaster: boolean) {
  const shareTextWithLink = `${text}\n\n${APP_URL}`
  try {
    if (isInFarcaster) {
      await sdk.actions.composeCast({
        text: shareTextWithLink,
        embeds: [imageUrl as `https://${string}`],
      })
    } else {
      const t = encodeURIComponent(shareTextWithLink)
      const embed = encodeURIComponent(imageUrl)
      window.open(`https://warpcast.com/~/compose?text=${t}&embeds[]=${embed}`, '_blank', 'noopener,noreferrer')
    }
  } catch {
    const t = encodeURIComponent(shareTextWithLink)
    const embed = encodeURIComponent(imageUrl)
    const url = `https://warpcast.com/~/compose?text=${t}&embeds[]=${embed}`
    if (isInFarcaster) {
      await sdk.actions.openUrl(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
}

// ─── Victory Share Card (same style as other arcade games) ──────

interface VictoryShareCardProps {
  gameId: string
  score: number
  highScore: number
  isNewHighScore: boolean
  leaderboard: LeaderboardEntry[]
  playerRank: number
  onClose: () => void
  isInFarcaster: boolean
}

function VictoryShareCard({ gameId, score, highScore, isNewHighScore, leaderboard, playerRank, onClose, isInFarcaster }: VictoryShareCardProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const leaderboardImageUrl = `${API_URL}/api/v1/leaderboards/image/${gameId}?score=${score}&t=${Date.now()}`

  const getShareText = () => {
    const scoreText = score.toLocaleString()
    if (playerRank === 1) return `I reached WAGMI Valley with ${scoreText} pts - #1 on the leaderboard! 🏆🌄`
    if (playerRank === 2) return `I reached WAGMI Valley with ${scoreText} pts - ranked #2! 🥈🌄`
    if (playerRank === 3) return `I reached WAGMI Valley with ${scoreText} pts - ranked #3! 🥉🌄`
    if (playerRank && playerRank <= 10) return `I reached WAGMI Valley with ${scoreText} pts - ranked #${playerRank}! 🌄`
    if (isNewHighScore) return `New personal best! I reached WAGMI Valley with ${scoreText} pts in Onchain Trail! 🌄`
    return `I reached WAGMI Valley with ${scoreText} pts in Onchain Trail! 🌄`
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      await shareToFarcaster(getShareText(), leaderboardImageUrl, isInFarcaster)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${getShareText()}\n\n${APP_URL}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 pb-20 overflow-y-auto">
      <div className="w-full max-w-sm my-auto">
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-2xl p-6 border-2 border-purple-500 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🌄</div>
            <h2 className="text-xl font-bold text-white">Onchain Trail</h2>
            <p className="text-purple-300 text-sm">Bloc Step Arcade</p>
          </div>

          {/* Score */}
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-purple-300 text-sm mb-1">Your Score</div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                {score.toLocaleString()}
              </div>
              {isNewHighScore && (
                <div className="mt-2 inline-block px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                  NEW HIGH SCORE!
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-black/20 rounded-xl p-3 mb-4">
            <div className="text-center text-xs font-bold text-purple-300 tracking-wider mb-3">
              🏆 TOP PLAYERS
            </div>
            <div className="space-y-1.5">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between text-sm px-2 py-1 rounded ${
                    entry.isCurrentPlayer ? 'bg-yellow-500/20 border border-yellow-500/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-center ${entry.isCurrentPlayer ? 'text-yellow-400' : 'text-purple-400'}`}>
                      {entry.isCurrentPlayer ? '→' : ''}{entry.rank}.
                    </span>
                    <span className={entry.isCurrentPlayer ? 'text-yellow-300 font-bold' : 'text-white'}>
                      {entry.name}
                    </span>
                  </div>
                  <span className={entry.isCurrentPlayer ? 'text-yellow-300 font-bold' : 'text-purple-200'}>
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            {playerRank > 0 && playerRank <= 5 && (
              <div className="text-center mt-3 text-yellow-400 text-sm font-bold">
                You ranked #{playerRank} in Onchain Trail!
              </div>
            )}
            {playerRank > 5 && playerRank <= 10 && (
              <div className="text-center mt-3 text-purple-300 text-sm">
                You ranked #{playerRank} — keep playing!
              </div>
            )}
          </div>

          {/* Best Score */}
          <div className="flex justify-center text-sm mb-4">
            <div className="text-center">
              <div className="text-purple-300">Personal Best</div>
              <div className="text-white font-bold">{highScore.toLocaleString()}</div>
            </div>
          </div>

          <div className="text-center text-purple-400 text-xs">{APP_URL}</div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">
          <button onClick={handleShare} disabled={isSharing} className="btn btn-primary btn-full flex items-center justify-center gap-2">
            <span>{isSharing ? 'Opening...' : 'Share on Farcaster'}</span>
          </button>
          <button onClick={handleCopy} className="btn btn-secondary btn-full flex items-center justify-center gap-2">
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-full">Continue</button>
        </div>
      </div>
    </div>
  )
}

// ─── Death / Acquisition Share Card ─────────────────────────────

interface OutcomeShareCardProps {
  imageUrl: string
  message: string
  onClose: () => void
  isInFarcaster: boolean
}

function OutcomeShareCard({ imageUrl, message, onClose, isInFarcaster }: OutcomeShareCardProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      await shareToFarcaster(message, imageUrl, isInFarcaster)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${message}\n\n${APP_URL}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 pb-20 overflow-y-auto">
      <div className="w-full max-w-sm my-auto">
        <div className="rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-2xl">
          <img src={imageUrl} alt="" className="w-full" />
          <div className="bg-black p-4 text-center">
            <p className="text-white text-lg font-bold">{message}</p>
            <p className="text-purple-400 text-xs mt-2">{APP_URL}</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <button onClick={handleShare} disabled={isSharing} className="btn btn-primary btn-full flex items-center justify-center gap-2">
            <span>{isSharing ? 'Opening...' : 'Share on Farcaster'}</span>
          </button>
          <button onClick={handleCopy} className="btn btn-secondary btn-full flex items-center justify-center gap-2">
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-full">Continue</button>
        </div>
      </div>
    </div>
  )
}

// ─── Feature Game Wrapper ───────────────────────────────────────

interface FeatureGameWrapperProps {
  gameId: string
  gameName: string
  gameIcon: string
  children: React.ReactNode
  onExit: () => void
  creditCost: number
  quarterBalance: number
  onBuyCredit: () => Promise<'started' | 'has-time' | 'failed'>
  isPurchasing?: boolean
}

export function FeatureGameWrapper({
  gameId,
  gameName,
  gameIcon,
  children,
  onExit,
  creditCost,
  quarterBalance,
  onBuyCredit,
  isPurchasing = false,
}: FeatureGameWrapperProps) {
  const { isInFarcaster, user: farcasterUser } = useFarcaster()
  const { address } = useAccount()
  const [gameState, setGameState] = useState<'ready' | 'playing'>('ready')
  const [isInsertingQuarter, setIsInsertingQuarter] = useState(false)
  const playStartTimeRef = useRef<number>(0)

  // Game result tracking
  const [lastEnding, setLastEnding] = useState<string | null>(null)
  const [lastScore, setLastScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [playerRank, setPlayerRank] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showShareCard, setShowShareCard] = useState(false)

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem(`highscore_${gameId}`)
    if (saved) setHighScore(parseInt(saved))
  }, [gameId])

  // Listen for postMessages from the iframe game
  useEffect(() => {
    if (gameState !== 'playing') return

    const handleMessage = async (event: MessageEvent) => {
      const { type } = event.data || {}

      if (type === 'GAME_END') {
        const { ending, score } = event.data.result || {}
        console.log('[FeatureGameWrapper] GAME_END:', { ending, score })
        setLastEnding(ending)
        setLastScore(score || 0)

        // Track high score
        const newHigh = (score || 0) > highScore
        if (newHigh) {
          setHighScore(score)
          localStorage.setItem(`highscore_${gameId}`, String(score))
        }
        setIsNewHighScore(newHigh)

        // Only victory goes on the leaderboard
        if (ending === 'victory' && address && score > 0) {
          const { rank } = await submitScore(
            address, gameId, score,
            farcasterUser?.username, farcasterUser?.fid, farcasterUser?.pfpUrl
          )
          setPlayerRank(rank || 0)

          const entries = await fetchGameLeaderboard(gameId, 5)
          if (address) {
            const lower = address.toLowerCase()
            entries.forEach(e => {
              if (e.name.toLowerCase().startsWith(lower.slice(0, 6).toLowerCase())) {
                e.isCurrentPlayer = true
              }
            })
          }
          setLeaderboard(entries)
        }

        // Report play time
        if (address && playStartTimeRef.current > 0) {
          const elapsed = Math.floor((Date.now() - playStartTimeRef.current) / 1000)
          if (elapsed > 0) reportTimeConsumed(address, elapsed).catch(() => {})
          playStartTimeRef.current = 0
        }
      }

      if (type === 'SHARE_TO_FARCASTER') {
        setShowShareCard(true)
      }

      if (type === 'EXIT_GAME') {
        onExit()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [gameState, address, gameId, highScore, farcasterUser, onExit])

  const startGame = async () => {
    setIsInsertingQuarter(true)
    try {
      const result = await onBuyCredit()
      if (result === 'failed') {
        setIsInsertingQuarter(false)
        return
      }
    } catch (error) {
      console.error('Failed to insert credit:', error)
      setIsInsertingQuarter(false)
      return
    }
    setIsInsertingQuarter(false)
    setLastEnding(null)
    setLastScore(0)
    setShowShareCard(false)
    playStartTimeRef.current = Date.now()
    setGameState('playing')
  }

  const handleExit = useCallback(() => {
    if (address && playStartTimeRef.current > 0) {
      const elapsed = Math.floor((Date.now() - playStartTimeRef.current) / 1000)
      if (elapsed > 0) reportTimeConsumed(address, elapsed).catch(() => {})
      playStartTimeRef.current = 0
    }
    onExit()
  }, [address, onExit])

  // ─── Playing state ──────────────────────────────────────────

  if (gameState === 'playing') {
    const deathEndings = ['runway_zero', 'team_zero', 'exploited']
    const gameImageBase = `${window.location.origin}/games/onchain-trail/assets/images`

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Share card overlays */}
        {showShareCard && lastEnding === 'victory' && (
          <VictoryShareCard
            gameId={gameId}
            score={lastScore}
            highScore={Math.max(lastScore, highScore)}
            isNewHighScore={isNewHighScore}
            leaderboard={leaderboard}
            playerRank={playerRank}
            onClose={() => setShowShareCard(false)}
            isInFarcaster={isInFarcaster}
          />
        )}

        {showShareCard && lastEnding && deathEndings.includes(lastEnding) && (
          <OutcomeShareCard
            imageUrl={`${gameImageBase}/death_screen.jpg`}
            message="Onchain Trail rekt me"
            onClose={() => setShowShareCard(false)}
            isInFarcaster={isInFarcaster}
          />
        )}

        {showShareCard && lastEnding === 'acquisition' && (
          <OutcomeShareCard
            imageUrl={`${gameImageBase}/series_a.jpg`}
            message="I sold out my community before reaching wagmi valley in Onchain Trail"
            onClose={() => setShowShareCard(false)}
            isInFarcaster={isInFarcaster}
          />
        )}

        {/* Minimal exit button */}
        <div className="absolute top-3 left-3 z-50">
          <button
            onClick={handleExit}
            className="px-3 py-1.5 bg-black/70 backdrop-blur border border-white/20 rounded-lg text-white text-sm hover:bg-black/90 transition-colors"
          >
            Exit
          </button>
        </div>

        {/* Full screen game iframe */}
        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    )
  }

  // ─── Ready screen (credit gate) ────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full">
        <div className="text-6xl mb-6">{gameIcon}</div>
        <h2 className="text-2xl font-bold mb-2">{gameName}</h2>
        <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-full text-xs font-bold mb-4">
          Feature Game
        </div>
        <p className="text-muted text-sm mb-6">
          {isInsertingQuarter || isPurchasing
            ? 'Confirm in wallet...'
            : `Insert ${creditCost} credit${creditCost > 1 ? 's' : ''} to play`}
        </p>
        <button
          onClick={startGame}
          className="btn btn-primary btn-lg btn-full"
          disabled={quarterBalance < creditCost || isInsertingQuarter || isPurchasing}
        >
          {isInsertingQuarter || isPurchasing
            ? 'Inserting Credit...'
            : quarterBalance < creditCost
            ? 'Need BLOC to Play'
            : `Insert Credit (${creditCost * 250} BLOC)`}
        </button>
        {quarterBalance < creditCost && !isInsertingQuarter && !isPurchasing && (
          <p className="text-xs text-muted mt-2">Buy BLOC tokens to get credits</p>
        )}
        <button
          onClick={onExit}
          className="btn btn-secondary btn-full mt-3"
        >
          Back to Games
        </button>
      </div>
    </div>
  )
}
