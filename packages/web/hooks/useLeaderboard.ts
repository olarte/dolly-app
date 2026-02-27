'use client'

import { useQuery } from '@tanstack/react-query'
import {
  useMockLeaderboardData,
  type LeaderboardUser,
  type LeaderboardData,
} from './useMockLeaderboardData'

interface ApiLeaderboardUser {
  rank: number
  address: string
  xp: number
  tier: string
  name: string
  flag: string
  bets: number
}

interface ApiLeaderboardResponse {
  userXp: number
  userTier: string
  topThree: ApiLeaderboardUser[]
  goats: ApiLeaderboardUser[]
  diamond: ApiLeaderboardUser[]
  total: number
}

function mapUser(u: ApiLeaderboardUser): LeaderboardUser {
  return {
    rank: u.rank,
    name: u.name,
    flag: u.flag,
    bets: u.bets,
    xp: u.xp,
  }
}

export function useLeaderboard(userAddress?: string) {
  const mockData = useMockLeaderboardData()

  const query = useQuery<ApiLeaderboardResponse>({
    queryKey: ['leaderboard', userAddress],
    queryFn: async () => {
      const params = new URLSearchParams({ weekly: 'true' })
      if (userAddress) params.set('user', userAddress)
      const res = await fetch(`/api/leaderboard?${params}`)
      if (!res.ok) throw new Error('Leaderboard fetch failed')
      return res.json()
    },
    staleTime: 60_000,
  })

  // If API fails or returns no players, fall back to mock data
  if (query.isError || (!query.isLoading && query.data && query.data.total === 0)) {
    return {
      ...mockData,
      isLoading: false,
      isError: false,
      refetch: query.refetch,
    }
  }

  if (query.isLoading || !query.data) {
    return {
      userXp: 0,
      userTier: 'Bronze',
      topThree: [] as LeaderboardUser[],
      goats: [] as LeaderboardUser[],
      diamond: [] as LeaderboardUser[],
      total: 0,
      isLoading: query.isLoading,
      isError: false,
      refetch: query.refetch,
    }
  }

  const data = query.data

  const result: LeaderboardData & {
    total: number
    isLoading: boolean
    isError: boolean
    refetch: typeof query.refetch
  } = {
    userXp: data.userXp,
    userTier: data.userTier,
    topThree: data.topThree.map(mapUser) as LeaderboardData['topThree'],
    goats: data.goats.map(mapUser),
    diamond: data.diamond.map(mapUser),
    total: data.total,
    isLoading: false,
    isError: false,
    refetch: query.refetch,
  }

  return result
}
