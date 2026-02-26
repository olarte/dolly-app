export const STABLECOINS = {
  cUSD: {
    symbol: 'cUSD',
    name: 'Celo Dollar',
    tokenAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`,
    feeCurrencyAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`, // same — 18 decimals
    decimals: 18,
    icon: '/icons/cusd.svg',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    tokenAddress: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as `0x${string}`, // USDC on Celo
    feeCurrencyAddress: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' as `0x${string}`, // adapter (6→18 decimals)
    decimals: 6,
    icon: '/icons/usdc.svg',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    tokenAddress: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' as `0x${string}`, // USDT on Celo
    feeCurrencyAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: confirm adapter address
    decimals: 6,
    icon: '/icons/usdt.svg',
  },
} as const

export type StablecoinKey = keyof typeof STABLECOINS
export type Stablecoin = (typeof STABLECOINS)[StablecoinKey]
