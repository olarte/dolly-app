'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from '@privy-io/wagmi'
import { useState } from 'react'
import { celo } from 'viem/chains'
import { wagmiConfig } from '@/lib/wagmi'
import AutoConnect from './AutoConnect'

function InnerProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <AutoConnect />
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  )
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // If no Privy app ID is configured, render without Privy (dev mode)
  if (!privyAppId) {
    return <InnerProviders>{children}</InnerProviders>
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        defaultChain: celo,
        supportedChains: [celo],
        appearance: {
          theme: 'light',
          accentColor: '#2e7d32',
        },
        loginMethods: ['wallet', 'email'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <InnerProviders>{children}</InnerProviders>
    </PrivyProvider>
  )
}
