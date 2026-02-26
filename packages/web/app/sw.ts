/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import {
  Serwist,
  CacheFirst,
  NetworkOnly,
  ExpirationPlugin,
} from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

const sw = self as unknown as ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: sw.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache fonts
    {
      matcher: /\/fonts\/.*\.woff2?$/,
      handler: new CacheFirst({
        cacheName: 'font-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    // Cache static icons
    {
      matcher: /\/icons\/.*\.(png|svg|ico)$/,
      handler: new CacheFirst({
        cacheName: 'icon-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    // Do NOT cache API routes — market data must always be fresh
    {
      matcher: /\/api\/.*/,
      handler: new NetworkOnly(),
    },
    // Default caching for other assets
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()
