'use client'

import { useState, useCallback } from 'react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, type Address } from 'viem'
import { MARKET_ABI, ERC20_ABI } from '@/lib/contracts'
import { STABLECOINS } from '@/lib/stablecoins'
import { useDollyStore } from '@/lib/store'

export type DepositStatus = 'idle' | 'approving' | 'depositing' | 'success' | 'error'

export function useDeposit(marketAddress: Address) {
  const selectedCoin = useDollyStore((s) => s.selectedCoin)
  const coin = STABLECOINS[selectedCoin]

  const [status, setStatus] = useState<DepositStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  const { writeContractAsync } = useWriteContract()

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: coin.tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [marketAddress, marketAddress], // placeholder — overridden at call time
    query: { enabled: false },
  })

  const deposit = useCallback(
    async (side: 'sube' | 'baja', amount: string, userAddress: Address) => {
      setStatus('idle')
      setError(null)
      setTxHash(undefined)

      try {
        const parsedAmount = parseUnits(amount, coin.decimals)
        if (parsedAmount <= 0n) {
          setError('Monto inválido')
          setStatus('error')
          return
        }

        // Step 1: Approve
        setStatus('approving')
        const approveTx = await writeContractAsync({
          address: coin.tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [marketAddress, parsedAmount],
          feeCurrency: coin.feeCurrencyAddress,
        } as Parameters<typeof writeContractAsync>[0])

        // Step 2: Deposit
        setStatus('depositing')
        const depositFn = side === 'sube' ? 'depositUp' : 'depositDown'
        const depositTx = await writeContractAsync({
          address: marketAddress,
          abi: MARKET_ABI,
          functionName: depositFn,
          args: [coin.tokenAddress, parsedAmount],
          feeCurrency: coin.feeCurrencyAddress,
        } as Parameters<typeof writeContractAsync>[0])

        setTxHash(depositTx)
        setStatus('success')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        // Simplify common error messages
        if (message.includes('User rejected') || message.includes('denied')) {
          setError('Transacción cancelada')
        } else if (message.includes('insufficient')) {
          setError('Balance insuficiente')
        } else {
          setError(message.slice(0, 100))
        }
        setStatus('error')
      }
    },
    [coin, marketAddress, writeContractAsync]
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setTxHash(undefined)
  }, [])

  return { deposit, status, error, txHash, reset }
}
