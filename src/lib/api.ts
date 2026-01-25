const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://bloc-step-arcade-backend-production.up.railway.app'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const json: ApiResponse<T> = await res.json()

  if (!json.success) {
    throw new Error(json.error || 'API request failed')
  }

  return json.data as T
}

// Game Sessions
export interface GameSession {
  id: string
  walletAddress: string
  status: 'active' | 'paused' | 'completed' | 'expired'
  startedAt: string
  endedAt?: string
  totalTimeConsumed: string
  lastConsumptionAt?: string
  currentBalance?: string
}

export async function startGameSession(walletAddress: string): Promise<GameSession> {
  return fetchApi<GameSession>('/game/sessions/start', {
    method: 'POST',
    headers: { 'X-Wallet-Address': walletAddress },
  })
}

export async function endGameSession(
  sessionId: string,
  walletAddress: string
): Promise<GameSession> {
  return fetchApi<GameSession>(`/game/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'X-Wallet-Address': walletAddress },
  })
}

export async function consumeTime(
  sessionId: string,
  seconds: number,
  walletAddress: string
): Promise<{ consumptionId: string; secondsConsumed: string; txHash: string }> {
  return fetchApi(`/game/sessions/${sessionId}/consume`, {
    method: 'POST',
    headers: { 'X-Wallet-Address': walletAddress },
    body: JSON.stringify({ seconds }),
  })
}

export async function getActiveSession(walletAddress: string): Promise<GameSession | null> {
  return fetchApi<GameSession | null>('/game/sessions/active', {
    headers: { 'X-Wallet-Address': walletAddress },
  })
}

// Player
export interface Player {
  id: string
  walletAddress: string
  farcasterFid?: number
  farcasterUsername?: string
  timeBalance: string
  cachedStakedBalance: string
  stats: {
    totalTimePurchased: string
    totalTimeConsumed: string
    totalYeeted: string
    totalTipsSent: string
    totalTipsReceived: string
  }
}

export async function getPlayer(walletAddress: string): Promise<Player> {
  return fetchApi<Player>(`/players/${walletAddress}`)
}

export async function getPlayerBalance(
  walletAddress: string
): Promise<{ timeBalance: string; timeBalanceSeconds: number; timeBalanceFormatted: string }> {
  return fetchApi(`/players/${walletAddress}/balance`)
}

// Leaderboards
export interface LeaderboardEntry {
  rank: number
  walletAddress: string
  farcasterUsername?: string
  score: string
  scoreFormatted?: string
}

export async function getYeetLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return fetchApi<LeaderboardEntry[]>(`/leaderboards/yeet?limit=${limit}`)
}

export async function getStakingLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return fetchApi<LeaderboardEntry[]>(`/leaderboards/staking?limit=${limit}`)
}

export async function getTimePlayedLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return fetchApi<LeaderboardEntry[]>(`/leaderboards/time-played?limit=${limit}`)
}
