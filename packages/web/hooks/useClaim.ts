'use client'

import { useState, useCallback } from 'react'
import { useWriteContract } from 'wagmi'
import type { Address } from 'viem'
import { MARKET_ABI } from '@/lib/contracts'
import { STABLECOINS } from '@/lib/stablecoins'
import { useDollyStore } from '@/lib/store'

export type ClaimStatus = 'idle' | 'claiming' | 'success' | 'error'

export function useClaim(marketAddress: Address) {
  const selectedCoin = useDollyStore((s) => s.selectedCoin)
  const coin = STABLECOINS[selectedCoin]

  const [status, setStatus] = useState<ClaimStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContractAsync } = useWriteContract()

  const claim = useCallback(async () => {
    setStatus('idle')
    setError(null)
    setTxHash(undefined)

    try {
      setStatus('claiming')
      const tx = await writeContractAsync({
        address: marketAddress,
        abi: MARKET_ABI,
        functionName: 'claim',
        feeCurrency: coin.feeCurrencyAddress,
      } as Parameters<typeof writeContractAsync>[0])

      setTxHash(tx)
      setStatus('success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      if (message.includes('User rejected') || message.includes('denied')) {
        setError('Transacción cancelada')
      } else {
        setError(message.slice(0, 100))
      }
      setStatus('error')
    }
  }, [marketAddress, coin, writeContractAsync])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setTxHash(undefined)
  }, [])

  return { claim, status, error, txHash, reset }
}
