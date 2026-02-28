const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'

// Celo Sepolia testnet mock token addresses (deployed via deploy.ts)
const TESTNET_TOKENS = {
  cUSD: process.env.NEXT_PUBLIC_TESTNET_CUSD || '0xa7F70ea6Ad5CB6B1f072c146f0AC88da5D62761A',
  USDC: process.env.NEXT_PUBLIC_TESTNET_USDC || '0x962A01419F5bEf350a0AEaefDbfb2f8B9a51f345',
  USDT: process.env.NEXT_PUBLIC_TESTNET_USDT || '0x112842fD0f6332e7D4aa6D2DA4F4de19CA64Be6d',
}

export const STABLECOINS = {
  cUSD: {
    symbol: 'cUSD',
    name: 'Celo Dollar',
    tokenAddress: (isTestnet ? TESTNET_TOKENS.cUSD : '0x765DE816845861e75A25fCA122bb6898B8B1282a') as `0x${string}`,
    feeCurrencyAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`, // mainnet only — testnet uses native gas
    decimals: 18,
    icon: '/icons/cusd.svg',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    tokenAddress: (isTestnet ? TESTNET_TOKENS.USDC : '0xcebA9300f2b948710d2653dD7B07f33A8B32118C') as `0x${string}`,
    feeCurrencyAddress: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' as `0x${string}`, // mainnet adapter
    decimals: 6,
    icon: '/icons/usdc.svg',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    tokenAddress: (isTestnet ? TESTNET_TOKENS.USDT : '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e') as `0x${string}`,
    feeCurrencyAddress: '0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72' as `0x${string}`, // mainnet adapter
    decimals: 6,
    icon: '/icons/usdt.svg',
  },
} as const

export type StablecoinKey = keyof typeof STABLECOINS
export type Stablecoin = (typeof STABLECOINS)[StablecoinKey]
