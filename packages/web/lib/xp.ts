// XP & Reputation System
// 1 XP per $1 wagered (all stablecoins = $1)
// +50% bonus XP for winning predictions

export const TIER_THRESHOLDS = [
  { name: 'Bronze', icon: '🥉', minXp: 0 },
  { name: 'Silver', icon: '🥈', minXp: 100 },
  { name: 'Gold', icon: '🥇', minXp: 500 },
  { name: 'Diamond', icon: '💎', minXp: 2000 },
  { name: 'GOAT', icon: '🐐', minXp: 5000 },
] as const

export type TierName = (typeof TIER_THRESHOLDS)[number]['name']

export function getTier(xp: number): (typeof TIER_THRESHOLDS)[number] {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= TIER_THRESHOLDS[i].minXp) return TIER_THRESHOLDS[i]
  }
  return TIER_THRESHOLDS[0]
}

// 1 XP per $1 equivalent wagered (normalized 18-decimal → dollar amount)
export function calculateWagerXp(normalizedAmount: bigint): number {
  // Normalized amount is 18 decimals, so divide by 1e18 to get dollar value
  const dollars = Number(normalizedAmount) / 1e18
  return Math.floor(dollars)
}

// +50% bonus for winning
export function calculateWinBonusXp(wagerXp: number): number {
  return Math.floor(wagerXp * 0.5)
}

// Known stablecoin decimals (hardcoded for speed — no on-chain call needed)
const TOKEN_DECIMALS: Record<string, number> = {
  '0x765de816845861e75a25fca122bb6898b8b1282a': 18, // cUSD
  '0xceba9300f2b948710d2653dd7b07f33a8b32118c': 6,  // USDC
  '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e': 6,  // USDT
}

// Normalize a raw token amount to 18-decimal representation
export function normalizeToWei(amount: bigint, tokenAddress: string): bigint {
  const decimals = TOKEN_DECIMALS[tokenAddress.toLowerCase()] ?? 18
  if (decimals === 18) return amount
  // Scale up: 6-decimal → 18-decimal means multiply by 1e12
  return amount * BigInt(10 ** (18 - decimals))
}
