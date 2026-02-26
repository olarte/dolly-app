import { http } from 'wagmi'
import { celo } from 'viem/chains'
import { createConfig } from '@privy-io/wagmi'

export const wagmiConfig = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(
      process.env.NEXT_PUBLIC_CELO_RPC || 'https://forno.celo.org'
    ),
  },
})
