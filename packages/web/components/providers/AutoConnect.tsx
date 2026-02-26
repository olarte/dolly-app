'use client'

import { useEffect, useRef } from 'react'
import { useConnect, useAccount } from 'wagmi'
import { isMiniPay, detectUserGeo } from '@/lib/geo'
import { useDollyStore } from '@/lib/store'

export default function AutoConnect() {
  const { connectors, connect } = useConnect()
  const { isConnected } = useAccount()
  const ran = useRef(false)
  const setGeo = useDollyStore((s) => s.setGeo)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    // Auto-connect MiniPay
    if (isMiniPay() && !isConnected) {
      const injected = connectors.find((c) => c.id === 'injected')
      if (injected) {
        connect({ connector: injected })
      }
    }

    // Geo-detection
    detectUserGeo().then(({ countryCode, currencyCode }) => {
      setGeo(countryCode, currencyCode)
    })
  }, [connectors, connect, isConnected, setGeo])

  return null
}
