/**
 * E2E test script for API routes.
 *
 * Usage: npx tsx scripts/test-e2e.ts [base_url]
 * Default base URL: http://localhost:3000
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  status?: number
  error?: string
}

const results: TestResult[] = []

async function testRoute(name: string, path: string, validate: (data: unknown, status: number) => void) {
  try {
    const url = `${BASE_URL}${path}`
    const res = await fetch(url)
    const data = await res.json()
    validate(data, res.status)
    results.push({ name, passed: true, status: res.status })
    console.log(`  PASS  ${name} (${res.status})`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    results.push({ name, passed: false, error: message })
    console.log(`  FAIL  ${name}: ${message}`)
  }
}

async function main() {
  console.log(`\nDolly API E2E Tests — ${BASE_URL}\n`)
  console.log('─'.repeat(50))

  // 1. Geo API
  await testRoute('GET /api/geo', '/api/geo', (data: any, status) => {
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.countryCode) throw new Error('Missing countryCode')
    if (!data.currencyCode) throw new Error('Missing currencyCode')
  })

  // 2. Price API
  await testRoute('GET /api/price?pair=USD/COP', '/api/price?pair=USD/COP', (data: any, status) => {
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (typeof data.rate !== 'number' || data.rate <= 0) throw new Error(`Invalid rate: ${data.rate}`)
    if (!data.pair) throw new Error('Missing pair')
  })

  // 3. Price history
  await testRoute('GET /api/price/history?pair=USD/COP&period=1D', '/api/price/history?pair=USD/COP&period=1D', (data: any, status) => {
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data.data)) throw new Error('data.data should be an array')
  })

  // 4. Markets
  await testRoute('GET /api/markets?currency=COP', '/api/markets?currency=COP', (data: any, status) => {
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data.markets)) throw new Error('markets should be an array')
  })

  // 5. Leaderboard
  await testRoute('GET /api/leaderboard', '/api/leaderboard', (data: any, status) => {
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data.leaderboard)) throw new Error('leaderboard should be an array')
  })

  // 6. News
  await testRoute('GET /api/news?country=CO', '/api/news?country=CO', (data: any, status) => {
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data.news)) throw new Error('news should be an array')
  })

  // Summary
  console.log('\n' + '─'.repeat(50))
  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`\nResults: ${passed}/${total} passed`)

  if (passed < total) {
    console.log('\nFailed tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
    process.exit(1)
  }

  console.log('\nAll tests passed!')
}

main().catch((err) => {
  console.error('Test runner error:', err)
  process.exit(1)
})
