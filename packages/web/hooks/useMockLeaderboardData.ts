// Mock data hook for leaderboard page — replaced with real API data in Session 8.

export interface LeaderboardUser {
  rank: number
  name: string
  flag: string
  bets: number
  xp: number
}

export interface LeaderboardData {
  userXp: number
  userTier: string
  topThree: [LeaderboardUser, LeaderboardUser, LeaderboardUser]
  goats: LeaderboardUser[]
  diamond: LeaderboardUser[]
}

const TIER_THRESHOLDS = [
  { name: 'Bronze', minXp: 0 },
  { name: 'Silver', minXp: 100 },
  { name: 'Gold', minXp: 500 },
  { name: 'Diamond', minXp: 2000 },
  { name: 'GOAT', minXp: 5000 },
] as const

function getTierName(xp: number): string {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= TIER_THRESHOLDS[i].minXp) return TIER_THRESHOLDS[i].name
  }
  return 'Bronze'
}

export function useMockLeaderboardData(): LeaderboardData {
  const userXp = 347

  return {
    userXp,
    userTier: getTierName(userXp),
    // Order: 2nd, 1st, 3rd — rendered left, center, right in podium
    topThree: [
      { rank: 2, name: '@CairoChad', flag: '🇪🇬', bets: 302, xp: 3632 },
      { rank: 1, name: '@MarketHawk', flag: '🇪🇬', bets: 345, xp: 3987 },
      { rank: 3, name: '@EkoNavigator', flag: '🇳🇬', bets: 276, xp: 3210 },
    ],
    goats: [
      { rank: 4, name: '@CairoChad', flag: '🇪🇬', bets: 240, xp: 2930 },
      { rank: 5, name: '@LagosKing', flag: '🇳🇬', bets: 198, xp: 2870 },
      { rank: 6, name: '@PesoHunter', flag: '🇨🇴', bets: 210, xp: 2740 },
      { rank: 7, name: '@NileOracle', flag: '🇪🇬', bets: 185, xp: 2650 },
      { rank: 8, name: '@BogotaBull', flag: '🇨🇴', bets: 176, xp: 2510 },
      { rank: 9, name: '@NairaProphet', flag: '🇳🇬', bets: 162, xp: 2320 },
    ],
    diamond: [
      { rank: 10, name: '@AndesBull', flag: '🇨🇴', bets: 155, xp: 1980 },
      { rank: 11, name: '@NilePharma', flag: '🇪🇬', bets: 140, xp: 1850 },
      { rank: 12, name: '@KenyaTrader', flag: '🇰🇪', bets: 132, xp: 1720 },
      { rank: 13, name: '@BuenosVientos', flag: '🇦🇷', bets: 118, xp: 1540 },
      { rank: 14, name: '@MedellinMax', flag: '🇨🇴', bets: 105, xp: 1380 },
      { rank: 15, name: '@AbujaBets', flag: '🇳🇬', bets: 98, xp: 1210 },
    ],
  }
}
