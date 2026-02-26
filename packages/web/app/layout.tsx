import type { Metadata, Viewport } from 'next'
import Providers from '@/components/providers/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dolly — Predice el dólar. Gana.',
  description: 'Predice si el dólar sube o baja. Gana.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dolly',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#c8d5b9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased safe-top">
        <Providers>
          <div className="mx-auto max-w-[430px] min-h-dvh relative">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
