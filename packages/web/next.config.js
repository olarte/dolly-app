const { withSentryConfig } = require('@sentry/nextjs')

const withSerwist = require('@serwist/next').default({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  webpack: (config) => {
    // Optional peer deps of wagmi connectors — not needed
    config.resolve.fallback = {
      ...config.resolve.fallback,
      porto: false,
      'porto/internal': false,
      '@react-native-async-storage/async-storage': false,
    }
    return config
  },
}

const sentryBuildEnabled = process.env.SENTRY_AUTH_TOKEN && process.env.NEXT_PUBLIC_USE_TESTNET !== 'true'

module.exports = sentryBuildEnabled
  ? withSentryConfig(withSerwist(nextConfig), {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  : withSerwist(nextConfig)
