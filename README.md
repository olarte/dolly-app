# Dolly

Dolly is a wallet-native prediction game where users bet on whether their national currency will rise or fall against the U.S. dollar. Built on the Celo blockchain, it targets emerging markets where currency volatility is a daily reality.

## How It Works

1. **Pick a side** -- Users choose **SUBE** (up) or **BAJA** (down) on whether their local currency will close higher or lower against USD.
2. **Join the pool** -- Deposits go into a pari-mutuel pool. No AMM, no order book -- just a shared pot.
3. **Wait for resolution** -- At market close, the outcome is determined from official exchange rate sources (e.g., Banco de la Republica TRM for Colombia).
4. **Winners split the pot** -- Correct predictors share the losing side's deposits proportionally, minus a 3% rake.

Markets run on daily, weekly, and monthly timeframes. The MVP launches with USD/COP (Colombian Peso), with architecture ready for USD/NGN, USD/EGP, USD/ARS, USD/KES, and more.

## Key Features

- **Stablecoin deposits** -- Users deposit in cUSD, USDC, or USDT. No need to hold CELO -- gas fees are paid in the same stablecoin via Celo's native fee currency support.
- **MiniPay + Privy wallets** -- Runs as an embedded app inside Opera MiniPay, with Privy as a fallback for browser users.
- **PWA** -- Installable to homescreen with a native app feel (standalone mode, no browser chrome).
- **Geo-fencing** -- Users are automatically routed to their national currency market based on IP location.
- **XP & Leaderboard** -- Reputation system tracked from the first deposit. Earn XP for wagering and bonus XP for winning. Global leaderboard with tiers (Bronze through GOAT).
- **Spanish UI** -- All user-facing text in Spanish for the Colombia launch, with i18n architecture for future markets.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Blockchain | Celo Mainnet, Solidity 0.8.20, Hardhat |
| Web3 | wagmi v2, viem (with `feeCurrency` for gas-in-stablecoin) |
| Wallets | MiniPay (injected provider), Privy (embedded wallet) |
| State | TanStack Query (server), zustand (client) |
| Backend | Next.js API routes, Supabase (PostgreSQL) |
| Price Feeds | Twelve Data (intraday), Banco de la Republica TRM (weekly/monthly) |
| Monitoring | Sentry |

## Project Structure

```
dolly-app/
  packages/
    web/          # Next.js frontend + API routes
    contracts/    # Solidity contracts + Hardhat tests
```

## Getting Started

```bash
# Install dependencies
npm install

# Run the frontend dev server
npm run dev

# Compile contracts
cd packages/contracts && npx hardhat compile

# Run contract tests
cd packages/contracts && npx hardhat test
```

Environment variables are documented in `packages/web/.env.local.example`.

## Smart Contracts

- **MarketFactory.sol** -- Creates and registers Market contracts using CREATE2 for deterministic addresses.
- **Market.sol** -- Pari-mutuel logic: deposit, resolve, claim. Accepts cUSD/USDC/USDT with internal 18-decimal normalization. Includes emergency refund (7-day grace period) and price validation.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the step-by-step deployment checklist covering Celo Sepolia (testnet) and Celo Mainnet.
