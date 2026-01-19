'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import {
  getPlayer,
  getPlayerBalance,
  getActiveSession,
  startGameSession,
  endGameSession,
  consumeTime,
  getYeetLeaderboard,
  getStakingLeaderboard,
  getTimePlayedLeaderboard,
  type Player,
  type GameSession,
  type LeaderboardEntry,
} from '@/lib/api'

// Player hooks
export function usePlayer() {
  const { address } = useAccount()

  return useQuery({
    queryKey: ['player', address],
    queryFn: () => getPlayer(address!),
    enabled: !!address,
    staleTime: 30_000, // 30 seconds
  })
}

export function usePlayerBalance() {
  const { address } = useAccount()

  return useQuery({
    queryKey: ['playerBalance', address],
    queryFn: () => getPlayerBalance(address!),
    enabled: !!address,
    refetchInterval: 10_000, // Refresh every 10 seconds during gameplay
  })
}

// Game session hooks
export function useActiveSession() {
  const { address } = useAccount()

  return useQuery({
    queryKey: ['activeSession', address],
    queryFn: () => getActiveSession(address!),
    enabled: !!address,
    refetchInterval: 5_000, // Check for active session every 5 seconds
  })
}

export function useStartSession() {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => startGameSession(address!),
    onSuccess: (session) => {
      queryClient.setQueryData(['activeSession', address], session)
      queryClient.invalidateQueries({ queryKey: ['playerBalance', address] })
    },
  })
}

export function useEndSession() {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => endGameSession(sessionId, address!),
    onSuccess: () => {
      queryClient.setQueryData(['activeSession', address], null)
      queryClient.invalidateQueries({ queryKey: ['player', address] })
      queryClient.invalidateQueries({ queryKey: ['playerBalance', address] })
    },
  })
}

export function useConsumeTime() {
  const { address } = useAccount()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, seconds }: { sessionId: string; seconds: number }) =>
      consumeTime(sessionId, seconds, address!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerBalance', address] })
      queryClient.invalidateQueries({ queryKey: ['activeSession', address] })
    },
  })
}

// Leaderboard hooks
export function useYeetLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', 'yeet', limit],
    queryFn: () => getYeetLeaderboard(limit),
    staleTime: 60_000, // 1 minute
  })
}

export function useStakingLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', 'staking', limit],
    queryFn: () => getStakingLeaderboard(limit),
    staleTime: 60_000,
  })
}

export function useTimePlayedLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', 'time', limit],
    queryFn: () => getTimePlayedLeaderboard(limit),
    staleTime: 60_000,
  })
}

// Combined leaderboard hook for the tabbed view
export function useLeaderboards(limit = 10) {
  const yeet = useYeetLeaderboard(limit)
  const staking = useStakingLeaderboard(limit)
  const time = useTimePlayedLeaderboard(limit)

  return {
    yeet: yeet.data ?? [],
    staking: staking.data ?? [],
    time: time.data ?? [],
    isLoading: yeet.isLoading || staking.isLoading || time.isLoading,
    error: yeet.error || staking.error || time.error,
  }
}
