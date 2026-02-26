'use client'

import { useAccount, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { STABLECOINS, type StablecoinKey } from '@/lib/stablecoins'
import { ERC20_ABI } from '@/lib/contracts'
import { useDollyStore } from '@/lib/store'

interface BalanceInfo {
  formatted: string
  raw: bigint
}

function formatBalance(raw: bigint | undefined, decimals: number): BalanceInfo {
  if (!raw) return { formatted: '$0.00', raw: 0n }
  const value = parseFloat(formatUnits(raw, decimals))
  return {
    formatted: `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    raw,
  }
}

export function useWallet() {
  const { address, isConnected } = useAccount()
  const selectedCoin = useDollyStore((s) => s.selectedCoin)

  const stablecoinKeys = Object.keys(STABLECOINS) as StablecoinKey[]

  const { data: balanceResults, refetch } = useReadContracts({
    contracts: stablecoinKeys.map((key) => ({
      address: STABLECOINS[key].tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf' as const,
      args: [address!],
    })),
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  })

  const allBalances: Record<StablecoinKey, BalanceInfo> = {
    cUSD: { formatted: '$0.00', raw: 0n },
    USDC: { formatted: '$0.00', raw: 0n },
    USDT: { formatted: '$0.00', raw: 0n },
  }
  stablecoinKeys.forEach((key, i) => {
    const result = balanceResults?.[i]
    const raw = result?.status === 'success' ? (result.result as bigint) : undefined
    allBalances[key] = formatBalance(raw, STABLECOINS[key].decimals)
  })

  const balance = allBalances[selectedCoin] ?? { formatted: '$0.00', raw: 0n }

  return {
    address,
    isConnected,
    balance: balance.formatted,
    rawBalance: balance.raw,
    allBalances,
    selectedCoin,
    refetchBalances: refetch,
  }
}
