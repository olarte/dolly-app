const withSerwist = require('@serwist/next').default({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = withSerwist(nextConfig)
