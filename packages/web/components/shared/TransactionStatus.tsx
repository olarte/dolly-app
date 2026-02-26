'use client'

import { useEffect, useState } from 'react'
import { X, Check, Loader2, AlertCircle } from 'lucide-react'
import { UI } from '@/lib/strings'

interface TransactionStatusProps {
  status: 'idle' | 'approving' | 'depositing' | 'claiming' | 'success' | 'error'
  error?: string | null
  txHash?: `0x${string}`
  onDismiss: () => void
  successMessage?: string
}

export default function TransactionStatus({
  status,
  error,
  txHash,
  onDismiss,
  successMessage,
}: TransactionStatusProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true)
    }
    if (status === 'success') {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [status, onDismiss])

  if (!visible || status === 'idle') return null

  const isPending = status === 'approving' || status === 'depositing' || status === 'claiming'
  const isError = status === 'error'
  const isSuccess = status === 'success'

  const message =
    status === 'approving'
      ? UI.deposit.approving
      : status === 'depositing'
        ? UI.deposit.depositing
        : status === 'claiming'
          ? UI.deposit.claiming
          : isSuccess
            ? (successMessage ?? UI.deposit.success)
            : error ?? UI.deposit.error

  const celoscanUrl = txHash ? `https://celoscan.io/tx/${txHash}` : null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[398px]">
      <div
        className={`flex items-center gap-3 p-4 rounded-2xl shadow-card-lg ${
          isPending
            ? 'bg-white'
            : isSuccess
              ? 'bg-sube-bg'
              : 'bg-baja-bg'
        }`}
      >
        {isPending && (
          <Loader2 size={20} className="text-text-secondary animate-spin flex-shrink-0" />
        )}
        {isSuccess && (
          <Check size={20} className="text-sube-green flex-shrink-0" />
        )}
        {isError && (
          <AlertCircle size={20} className="text-baja-red flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            isSuccess ? 'text-sube-green' : isError ? 'text-baja-red' : 'text-text-primary'
          }`}>
            {message}
          </p>
          {celoscanUrl && isSuccess && (
            <a
              href={celoscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted underline mt-0.5 block"
            >
              Ver en Celoscan
            </a>
          )}
        </div>

        <button
          onClick={() => {
            setVisible(false)
            onDismiss()
          }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
        >
          <X size={14} className="text-text-muted" />
        </button>
      </div>
    </div>
  )
}
