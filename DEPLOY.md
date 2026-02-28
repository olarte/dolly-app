# Dolly Deployment Checklist

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Deployer wallet funded with CELO for gas (Alfajores faucet: https://faucet.celo.org)
- [ ] Supabase project created with schema applied
- [ ] Sentry project created
- [ ] Vercel account with project linked

---

## 1. Contract Deployment (Alfajores Testnet)

```bash
cd packages/contracts

# Set deployer private key
export DEPLOYER_PRIVATE_KEY=0x...

# Compile contracts
npx hardhat compile

# Deploy to Alfajores testnet
npx hardhat run scripts/deploy.ts --network alfajores

# Note the MarketFactory address from output

# Verify on CeloScan (optional)
npx hardhat verify --network alfajores <FACTORY_ADDRESS>
```

After deployment, update `NEXT_PUBLIC_MARKET_FACTORY_ADDRESS` in your `.env.local`.

### Mainnet Deployment

Same steps but use `--network celo` instead of `--network alfajores`.
Ensure deployer wallet has CELO on mainnet for gas.

---

## 2. Database Setup (Supabase)

```bash
# Apply schema migration
psql <SUPABASE_CONNECTION_STRING> -f supabase/migrations/001_initial_schema.sql

# Seed news data (optional)
psql <SUPABASE_CONNECTION_STRING> -f supabase/seed-news.sql
```

---

## 3. Export ABIs

After contract changes, regenerate frontend ABIs:

```bash
cd packages/contracts
npx ts-node scripts/export-abi.ts
```

This writes to `packages/web/lib/contracts.ts`.

---

## 4. Environment Variables

### Vercel Dashboard

Set these in Vercel project settings (Settings > Environment Variables):

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID | Yes |
| `NEXT_PUBLIC_CELO_RPC` | Celo RPC URL (`https://forno.celo.org`) | Yes |
| `NEXT_PUBLIC_MARKET_FACTORY_ADDRESS` | Deployed MarketFactory address | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `DEPLOYER_PRIVATE_KEY` | Server-side wallet for market creation/resolution | Yes |
| `CRON_SECRET` | Random secret for cron job auth | Yes |
| `EXCHANGE_RATE_API_KEY` | Exchange rate API key (optional for free tier) | No |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | Recommended |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps | Recommended |
| `SENTRY_ORG` | Sentry organization slug | If using Sentry |
| `SENTRY_PROJECT` | Sentry project slug | If using Sentry |

---

## 5. Frontend Deployment (Vercel)

```bash
# Verify build passes locally
cd packages/web
npx next build

# Deploy via Vercel CLI or Git push
vercel --prod
```

### Vercel Configuration

The `vercel.json` at the repo root configures:
- **Cron jobs**: Market creation (daily), resolution (every 5min), event indexing (every 2min)
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

---

## 6. Post-Deployment Verification

- [ ] App loads at production URL
- [ ] PWA installable (Lighthouse PWA audit)
- [ ] Wallet connection works (MiniPay + Privy)
- [ ] Live price displays correctly
- [ ] Markets list loads
- [ ] Deposit flow works (approve + deposit)
- [ ] Cron jobs execute (check Vercel logs)
- [ ] Sentry captures test error
- [ ] Leaderboard loads

### API Route Tests

```bash
# Run against production
npx tsx packages/web/scripts/test-e2e.ts https://your-domain.vercel.app
```

---

## 7. Contract Tests

```bash
cd packages/contracts
npx hardhat test  # 74 tests should pass
```

---

## Networks

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Alfajores (testnet) | 44787 | `https://alfajores-forno.celo-testnet.org` | `https://alfajores.celoscan.io` |
| Celo (mainnet) | 42220 | `https://forno.celo.org` | `https://celoscan.io` |
