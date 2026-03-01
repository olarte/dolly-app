import { http, createConfig as createWagmiConfig } from 'wagmi'
import { celo, celoSepolia } from 'viem/chains'
import { createConfig as createPrivyConfig } from '@privy-io/wagmi'

const isTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
export const activeChain = isTestnet ? celoSepolia : celo

const rpcUrl = isTestnet
  ? (process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC || 'https://forno.celo-sepolia.celo-testnet.org')
  : (process.env.NEXT_PUBLIC_CELO_RPC || 'https://forno.celo.org')

const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID
const createConfig = hasPrivy ? createPrivyConfig : createWagmiConfig

export const wagmiConfig = isTestnet
  ? createConfig({
      chains: [celoSepolia],
      transports: {
        [celoSepolia.id]: http(rpcUrl),
      },
    })
  : createConfig({
      chains: [celo],
      transports: {
        [celo.id]: http(rpcUrl),
      },
    })
