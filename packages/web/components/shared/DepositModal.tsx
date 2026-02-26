'use client'

import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useDollyStore } from '@/lib/store'
import { STABLECOINS } from '@/lib/stablecoins'
import { useDeposit } from '@/hooks/useDeposit'
import { useWallet } from '@/hooks/useWallet'
import TransactionStatus from './TransactionStatus'
import { UI } from '@/lib/strings'
import { cn } from '@/lib/utils'

const QUICK_AMOUNTS = ['5', '10', '25', '50', '100']

export default function DepositModal() {
  const { address } = useAccount()
  const { balance } = useWallet()
  const { depositModal, closeDepositModal, selectedCoin, setCoinSelectorOpen } =
    useDollyStore()

  const { open, marketAddress, side } = depositModal
  const coin = STABLECOINS[selectedCoin]
  const { deposit, status, error, txHash, reset } = useDeposit(marketAddress)

  const [amount, setAmount] = useState('')

  const isSube = side === 'sube'
  const accentColor = isSube ? 'text-sube-green' : 'text-baja-red'
  const accentBg = isSube ? 'bg-sube-bg' : 'bg-baja-bg'
  const ctaBg = isSube
    ? 'bg-sube-green hover:bg-sube-green/90'
    : 'bg-baja-red hover:bg-baja-red/90'

  const canDeposit =
    !!amount && parseFloat(amount) > 0 && !!address && status === 'idle'

  const handleDeposit = useCallback(() => {
    if (!canDeposit || !side || !address) return
    deposit(side, amount, address)
  }, [canDeposit, side, address, amount, deposit])

  const handleClose = useCallback(() => {
    setAmount('')
    reset()
    closeDepositModal()
  }, [closeDepositModal, reset])

  // Auto-close on success after delay
  if (status === 'success') {
    setTimeout(() => {
      handleClose()
    }, 2500)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Transaction status toast */}
      <TransactionStatus
        status={status}
        error={error}
        txHash={txHash}
        onDismiss={reset}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-base font-bold text-text-primary">
            {UI.deposit.title}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5"
          >
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Side indicator */}
        <div className="px-6 mb-4">
          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold', accentBg, accentColor)}>
            {isSube ? '↗' : '↘'} {isSube ? UI.market.sube : UI.market.baja}
          </div>
        </div>

        {/* Amount input */}
        <div className="px-6 mb-3">
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-1">
              <span className="text-4xl font-bold text-text-primary">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-4xl font-bold text-text-primary tabular-nums bg-transparent outline-none w-32 text-center"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Stablecoin + Balance row */}
        <div className="px-6 flex items-center justify-between mb-4">
          <button
            onClick={() => setCoinSelectorOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-bold">
              {coin.symbol.slice(0, 2)}
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {coin.symbol}
            </span>
            <span className="text-xs text-text-muted">&#9662;</span>
          </button>
          <p className="text-xs text-text-muted">
            {UI.deposit.balance}: <span className="font-medium tabular-nums">{balance}</span>
          </p>
        </div>

        {/* Quick amounts */}
        <div className="px-6 flex gap-2 mb-6">
          {QUICK_AMOUNTS.map((qa) => (
            <button
              key={qa}
              onClick={() => setAmount(qa)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition-colors',
                amount === qa
                  ? `${accentBg} ${accentColor}`
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              )}
            >
              ${qa}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-8">
          <button
            onClick={handleDeposit}
            disabled={!canDeposit}
            className={cn(
              'w-full py-4 rounded-2xl text-white font-bold text-base transition-colors',
              canDeposit ? ctaBg : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            {status === 'approving'
              ? UI.deposit.approving
              : status === 'depositing'
                ? UI.deposit.depositing
                : amount && parseFloat(amount) > 0
                  ? `${UI.deposit.cta} $${amount}`
                  : UI.deposit.enterAmount}
          </button>
        </div>
      </div>
    </div>
  )
}
