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
  stakeStartedAt: string | null
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

export async function getTipsSentLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return fetchApi<LeaderboardEntry[]>(`/leaderboards/tips-sent?limit=${limit}`)
}

export async function getTipsReceivedLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return fetchApi<LeaderboardEntry[]>(`/leaderboards/tips-received?limit=${limit}`)
}

// Game-specific leaderboards
export interface GameLeaderboardEntry {
  rank: number
  walletAddress: string
  farcasterUsername?: string
  score: string
}

export async function getGameLeaderboard(gameId: string, limit = 20): Promise<GameLeaderboardEntry[]> {
  return fetchApi<GameLeaderboardEntry[]>(`/leaderboards/game/${gameId}?limit=${limit}`)
}

export async function submitGameScore(
  walletAddress: string,
  gameId: string,
  score: number,
  farcasterUsername?: string,
  farcasterFid?: number,
  farcasterPfp?: string
): Promise<{ id: string; gameId: string; score: string; rank: number | null }> {
  return fetchApi(`/leaderboards/game/${gameId}/score`, {
    method: 'POST',
    headers: { 'X-Wallet-Address': walletAddress },
    body: JSON.stringify({ score, farcasterUsername, farcasterFid, farcasterPfp }),
  })
}

// Report time consumed (for time-played leaderboard)
export async function reportTimeConsumed(
  walletAddress: string,
  seconds: number
): Promise<void> {
  await fetchApi(`/players/${walletAddress}/add-time`, {
    method: 'POST',
    headers: { 'X-Wallet-Address': walletAddress },
    body: JSON.stringify({ seconds }),
  })
}

// Link Farcaster account to wallet
export async function linkFarcaster(
  walletAddress: string,
  fid: number,
  username: string
): Promise<{ id: string; walletAddress: string; farcasterFid: number; farcasterUsername: string }> {
  return fetchApi('/players/link-farcaster', {
    method: 'POST',
    headers: { 'X-Wallet-Address': walletAddress },
    body: JSON.stringify({ walletAddress, fid, username }),
  })
}

// Player Ranks
export interface PlayerRanks {
  walletAddress: string
  yeetRank: number | null
  stakingRank: number | null
  timePlayedRank: number | null
}

export async function getPlayerRanks(walletAddress: string): Promise<PlayerRanks> {
  return fetchApi<PlayerRanks>(`/players/${walletAddress}/ranks`)
}

// Stats
export interface Stats {
  totalPlayers: number
  totalDonated: number
  totalStaked: number
  totalTimePlayed: number
}

export async function getStats(): Promise<Stats> {
  return fetchApi<Stats>('/stats')
}

// Notifications
export async function registerNotificationToken(
  walletAddress: string,
  fid: number,
  notificationUrl: string,
  notificationToken: string
): Promise<{ id: string; enabled: boolean }> {
  return fetchApi('/notifications/register', {
    method: 'POST',
    headers: { 'X-Wallet-Address': walletAddress },
    body: JSON.stringify({ fid, notificationUrl, notificationToken }),
  })
}

export async function getNotificationStatus(walletAddress: string): Promise<{ enabled: boolean }> {
  return fetchApi<{ enabled: boolean }>(`/notifications/status/${walletAddress}`)
}
