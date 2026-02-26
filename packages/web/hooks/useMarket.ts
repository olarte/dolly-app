'use client'

import { useReadContract, useReadContracts } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { MARKET_ABI, MARKET_FACTORY_ABI, MARKET_FACTORY_ADDRESS } from '@/lib/contracts'

// Outcome enum matches Solidity: 0=UNRESOLVED, 1=UP, 2=DOWN
export type MarketOutcome = 0 | 1 | 2

export interface MarketData {
  totalUp: number
  totalDown: number
  totalPool: number
  multiplierUp: number
  multiplierDown: number
  subePercent: number
  bajaPercent: number
  outcome: MarketOutcome
  resolved: boolean
  bettingClosed: boolean
  bettingCloseTime: Date
  isLoading: boolean
}

export interface UserDeposit {
  upAmount: bigint
  downAmount: bigint
  token: Address
  hasClaimed: boolean
  side: 'sube' | 'baja' | null
  normalizedAmount: number
}

export function useMarket(marketAddress: Address | undefined): MarketData {
  const enabled = !!marketAddress && marketAddress !== '0x0000000000000000000000000000000000000000'

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'totalUp' },
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'totalDown' },
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'getMultiplier', args: [0] },
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'getMultiplier', args: [1] },
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'outcome' },
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'resolved' },
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'bettingClosed' },
      { address: marketAddress!, abi: MARKET_ABI, functionName: 'bettingCloseTime' },
    ],
    query: {
      enabled,
      refetchInterval: 30_000,
    },
  })

  const safeResult = (index: number): bigint => {
    const r = data?.[index]
    return r?.status === 'success' ? (r.result as bigint) : 0n
  }
  const safeBool = (index: number): boolean => {
    const r = data?.[index]
    return r?.status === 'success' ? (r.result as boolean) : false
  }

  const totalUpRaw = safeResult(0)
  const totalDownRaw = safeResult(1)
  const multiplierUpRaw = safeResult(2)
  const multiplierDownRaw = safeResult(3)
  const outcome = (data?.[4]?.status === 'success' ? Number(data[4].result) : 0) as MarketOutcome
  const resolved = safeBool(5)
  const bettingClosed = safeBool(6)
  const bettingCloseTimeRaw = safeResult(7)

  // Convert from 18-decimal normalized values to USD
  const totalUp = parseFloat(formatUnits(totalUpRaw, 18))
  const totalDown = parseFloat(formatUnits(totalDownRaw, 18))
  const totalPool = totalUp + totalDown

  // Multipliers are returned as 18-decimal fixed point (1e18 = 1.00x)
  const multiplierUp = multiplierUpRaw > 0n ? parseFloat(formatUnits(multiplierUpRaw, 18)) : 1
  const multiplierDown = multiplierDownRaw > 0n ? parseFloat(formatUnits(multiplierDownRaw, 18)) : 1

  // Percentages
  const subePercent = totalPool > 0 ? (totalUp / totalPool) * 100 : 50
  const bajaPercent = totalPool > 0 ? (totalDown / totalPool) * 100 : 50

  // Betting close time
  const bettingCloseTime = new Date(Number(bettingCloseTimeRaw) * 1000)

  return {
    totalUp,
    totalDown,
    totalPool,
    multiplierUp,
    multiplierDown,
    subePercent,
    bajaPercent,
    outcome,
    resolved,
    bettingClosed,
    bettingCloseTime,
    isLoading,
  }
}

export function useUserDeposit(
  marketAddress: Address | undefined,
  userAddress: Address | undefined
): UserDeposit & { isLoading: boolean } {
  const enabled = !!marketAddress && !!userAddress &&
    marketAddress !== '0x0000000000000000000000000000000000000000'

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: marketAddress!,
        abi: MARKET_ABI,
        functionName: 'getUserDeposit',
        args: [userAddress!],
      },
      {
        address: marketAddress!,
        abi: MARKET_ABI,
        functionName: 'hasClaimed',
        args: [userAddress!],
      },
    ],
    query: {
      enabled,
      refetchInterval: 30_000,
    },
  })

  const depositResult = data?.[0]
  const claimedResult = data?.[1]

  let upAmount = 0n
  let downAmount = 0n
  let token: Address = '0x0000000000000000000000000000000000000000'

  if (depositResult?.status === 'success') {
    const [up, down, t] = depositResult.result as [bigint, bigint, Address]
    upAmount = up
    downAmount = down
    token = t
  }

  const hasClaimed = claimedResult?.status === 'success'
    ? (claimedResult.result as boolean)
    : false

  const side: 'sube' | 'baja' | null =
    upAmount > 0n ? 'sube' : downAmount > 0n ? 'baja' : null

  const raw = side === 'sube' ? upAmount : downAmount
  const normalizedAmount = parseFloat(formatUnits(raw, 18))

  return { upAmount, downAmount, token, hasClaimed, side, normalizedAmount, isLoading }
}

export function useMarketList(currencyPair: string) {
  const { data, isLoading } = useReadContract({
    address: MARKET_FACTORY_ADDRESS,
    abi: MARKET_FACTORY_ABI,
    functionName: 'getMarketsByCurrency',
    args: [currencyPairToBytes32(currencyPair)],
    query: {
      enabled: MARKET_FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 60_000,
    },
  })

  return {
    markets: (data as Address[] | undefined) ?? [],
    isLoading,
  }
}

// Helper: convert "USD/COP" to bytes32
function currencyPairToBytes32(pair: string): `0x${string}` {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(pair)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, '0')
  return `0x${hex}` as `0x${string}`
}

export { currencyPairToBytes32 }
