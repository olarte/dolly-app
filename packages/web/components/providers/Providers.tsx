'use client'

import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues with wagmi/privy
const ClientProviders = dynamic(() => import('./ClientProviders'), {
  ssr: false,
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>
}
