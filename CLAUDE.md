# CLAUDE.md — Dolly Production MVP

## Project Overview
Dolly is a wallet-native prediction game where users bet on whether their national currency will rise or fall against the U.S. dollar. Users pick SUBE (up) or BAJA (down), join a pari-mutuel pool, and win proportional payouts if correct. 3% rake on total pool at settlement.

**MVP launch currencies:** USD/COP (Colombia), with architecture ready for USD/NGN (Nigeria), USD/EGP (Egypt), USD/ARS (Argentina), USD/KES (Kenya), etc.
**Geo-fencing:** Users are routed to their national currency market based on location. Leaderboards are global across all currencies.

**Chain:** Celo Mainnet
**Wallet:** MiniPay embedded app (primary) + Privy fallback
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Solidity + Hardhat + wagmi v2 + viem

---

## Design System

### Visual Identity
- **Background:** Soft gradient from muted sage green (#c8d5b9) to warm cream (#f5f0e8). NOT flat white. The entire app has this organic, warm gradient feel.
- **Cards:** White/off-white with generous border-radius (20-24px), soft shadows, no hard borders.
- **SUBE card:** Light green tint background (#e8f5e9), green text (#2e7d32), green border/accent.
- **BAJA card:** Light pink/red tint background (#fce4ec), red/coral text (#e53935), red border/accent.
- **Typography:** SF Pro Rounded for all text. SF Pro Symbols for icons (bottom nav, arrows, etc.). Bold, large display numbers for multipliers (48-64px). Market questions in bold 24-28px. Fall back to system -apple-system, BlinkMacSystemFont for non-Apple devices.
- **Bottom nav:** Dark rounded pill/capsule shape floating at bottom center. 3 icons: Home (house), Leaderboard (trophy), Analytics (dollar/coin). Active icon is filled bright green. Inactive icons are white/light gray. Background is dark (#2a2a2a or similar).
- **Live price display:** Arrow-up icon (↗) next to price in large bold text. Green for up, red for down.
- **Market type cards:** Rounded white cards in horizontal scroll. Show SEMANAL, MENSUAL, ELECCIONES with mini multiplier pairs (green/red) and date.
- **Countdown timer:** Monospace or tabular figures, format HH:MM:SSPM.

### Color Tokens
```
--bg-gradient-start: #c8d5b9
--bg-gradient-end: #f5f0e8
--card-bg: #ffffff (with 0.9 opacity in some cases)
--sube-green: #2e7d32
--sube-bg: #e8f5e9
--baja-red: #e53935
--baja-bg: #fce4ec
--text-primary: #1a1a1a
--text-secondary: #666666
--text-muted: #999999
--leaderboard-bg: same sage-to-cream gradient as all other pages (NOT dark theme)
```

### Component Patterns
- **Multiplier cards:** Two side-by-side rounded rectangles. Left = SUBE (green), Right = BAJA (red/pink). Each shows: label with arrow, large multiplier number (e.g., "1.58x"), pool size below.
- **Market question:** Bold Spanish text, e.g., "¿Cierra hoy más alto que la apertura?"
- **Probability graph:** Area chart showing SUBE% vs BAJA% over time. Green area on top, red area on bottom. Labels at right edge showing current percentages.
- **Back navigation:** "← BACK TO HOME" in top-left, live price in top-right.
- **Rules section:** Clean typography, bullet points for key dates and criteria.
- **Holders/Activity tabs:** Tab-style toggle. Table with Resultado, Holders count, Porcentaje columns.
- **Leaderboard:** Same sage-to-cream gradient as all pages (NOT dark theme). Tier progress bar with green fill (Bronze→Silver→Gold→Diamond→GOAT). Top 3 podium layout (1st center-top larger, 2nd left, 3rd right). Tier sections (GOATS 🐐, DIAMOND 💎) with list rows. Each row: avatar, @username, country flag, bets count, XP.

---

## Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 14 with App Router
- **PWA:** Progressive Web App — installable to homescreen, standalone display, offline-capable. Uses `next-pwa` or manual service worker + `manifest.json`. This is how non-MiniPay users get a native app experience without an app store.
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + CSS variables for design tokens
- **Fonts:** SF Pro Rounded (primary), SF Pro Symbols (icons). Load via @font-face in globals.css. Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Set `font-feature-settings: 'tnum'` for tabular numbers in prices/multipliers.
- **Charts:** Lightweight charting (recharts or lightweight-charts for price, custom SVG for probability)
- **State:** React Query (TanStack Query) for server state, zustand for local state
- **Web3:** wagmi v2 + viem (CRITICAL — see Viem & Gas section below)
- **Wallet:** Detect MiniPay via `window.ethereum?.isMiniPay`, fallback to Privy SDK

### PWA Configuration
Dolly should feel like a native mobile app. PWA enables this for all users — especially Privy users who access via a browser.

**manifest.json:**
```json
{
  "name": "Dolly",
  "short_name": "Dolly",
  "description": "Predice el dólar. Gana.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#c8d5b9",
  "theme_color": "#c8d5b9",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Key PWA requirements:**
- `display: standalone` — no browser chrome, fullscreen app feel
- `orientation: portrait` — locked to portrait (mobile-only app)
- `background_color` + `theme_color` = sage green (#c8d5b9) — splash screen and status bar match the app gradient
- Maskable icon for Android adaptive icons
- Apple-specific meta tags in `<head>`:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Dolly" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  ```
- Service worker: cache app shell, fonts, and static assets. Price data and market state should NOT be cached (always fresh). Use `next-pwa` package or `@serwist/next` for Next.js integration.
- Offline fallback page: simple "Sin conexión — reconecta para ver mercados en vivo" message on the sage green gradient.

**MiniPay context:** When running inside MiniPay, PWA install prompts should be suppressed — the app is already embedded. Detect via `window.ethereum?.isMiniPay` and skip any "Add to homescreen" banners.

### Viem & Gas Abstraction (CRITICAL)
Celo natively supports paying gas fees in ERC-20 stablecoins via the `feeCurrency` transaction field. This is a core UX requirement — users should never need to hold CELO. Dolly supports three stablecoins for both deposits and gas: **cUSD, USDC, and USDT**.

**Important: USDC and USDT require adapter addresses for gas.**
Celo's gas system works in 18 decimals. cUSD (18 decimals) can be used directly, but USDC and USDT (6 decimals) need adapter contracts that normalize their decimals for gas pricing. You use the adapter address for `feeCurrency`, but the real token address for transfers/approvals.

**Stablecoin Registry (lib/stablecoins.ts):**
```typescript
export const STABLECOINS = {
  cUSD: {
    symbol: 'cUSD',
    name: 'Celo Dollar',
    tokenAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    feeCurrencyAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // same — 18 decimals
    decimals: 18,
    icon: '/icons/cusd.svg',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    tokenAddress: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', // USDC on Celo
    feeCurrencyAddress: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B', // adapter (6→18 decimals)
    decimals: 6,
    icon: '/icons/usdc.svg',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    tokenAddress: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', // USDT on Celo
    feeCurrencyAddress: '0x0000000000000000000000000000000000000000', // TODO: confirm adapter address
    decimals: 6,
    icon: '/icons/usdt.svg',
  },
} as const

export type StablecoinKey = keyof typeof STABLECOINS
```

**Implementation pattern:**
```typescript
import { createWalletClient, custom } from 'viem'
import { celo } from 'viem/chains'
import { STABLECOINS } from '@/lib/stablecoins'

// User selects their preferred stablecoin (stored in zustand)
const selectedCoin = STABLECOINS['USDC']

// For ERC-20 approve + deposit: use tokenAddress
await client.writeContract({
  address: selectedCoin.tokenAddress,
  abi: erc20Abi,
  functionName: 'approve',
  args: [marketAddress, amount],
  feeCurrency: selectedCoin.feeCurrencyAddress, // adapter for gas
})

// For market deposit: contract accepts the token
await client.writeContract({
  address: marketAddress,
  abi: marketAbi,
  functionName: 'depositUp',
  args: [amount],
  feeCurrency: selectedCoin.feeCurrencyAddress, // adapter for gas
})
```

**Key rules:**
- `feeCurrency` = adapter address (for USDC/USDT) or token address (for cUSD)
- `approve()` / `transfer()` = always the real token address
- Transaction type must be `0x7b` (Celo fee currency transaction type)
- MiniPay handles feeCurrency natively for cUSD. For USDC/USDT on MiniPay, pass explicitly.
- Privy fallback: always pass `feeCurrency` explicitly on every write.
- User's selected stablecoin is persisted in zustand + localStorage.
- Balance display in header shows the selected stablecoin balance.

### Multi-Currency & Geo-Fencing Architecture
The app supports multiple USD/local-currency pairs, with users geo-fenced to their national market.

**Geo-detection flow:**
1. On first load, detect user location via IP geolocation API (e.g., ipapi.co or Cloudflare headers)
2. Map country → currency pair (CO → USD/COP, NG → USD/NGN, EG → USD/EGP, etc.)
3. Store in user profile + zustand local state
4. All market queries filtered by currency pair
5. User sees only their national currency markets
6. Manual override available in settings (for testing/expats)

**Data model impact:**
- Market contracts are parameterized by `currencyPair` (bytes32 or string)
- MarketFactory.createMarket() takes `currencyPair` as parameter
- API routes accept `?currency=COP` filter
- Price source module supports multiple pairs
- Leaderboard is GLOBAL (all currencies mixed) — this is intentional for cross-border competition

**Currency config (lib/currencies.ts):**
```typescript
export const CURRENCIES = {
  COP: { code: 'COP', name: 'Peso Colombiano', country: 'CO', flag: '🇨🇴', symbol: '$', decimals: 2 },
  NGN: { code: 'NGN', name: 'Nigerian Naira', country: 'NG', flag: '🇳🇬', symbol: '₦', decimals: 2 },
  EGP: { code: 'EGP', name: 'Egyptian Pound', country: 'EG', flag: '🇪🇬', symbol: 'E£', decimals: 2 },
  KES: { code: 'KES', name: 'Kenyan Shilling', country: 'KE', flag: '🇰🇪', symbol: 'KSh', decimals: 2 },
  ARS: { code: 'ARS', name: 'Peso Argentino', country: 'AR', flag: '🇦🇷', symbol: '$', decimals: 2 },
} as const
```

**MVP scope:** Launch with COP only, but build the architecture so adding a new currency is just a config entry + price source.

### Smart Contracts (Solidity ^0.8.20)
- **MarketFactory.sol** — Creates and registers Market contracts. Deterministic IDs from currencyPair + type + date.
- **Market.sol** — Pari-mutuel logic: depositUp(), depositDown(), closeBetting(), resolve(), claim(). Tracks totalUp, totalDown, user deposits per side, outcome enum, rakeBps (300 = 3%). Stores `currencyPair` for identification.
- **Multi-stablecoin support:** Market contracts accept deposits in cUSD, USDC, or USDT. Internally, all accounting is normalized to 18-decimal units (cUSD-equivalent). For 6-decimal tokens (USDC/USDT), the contract multiplies by 1e12 on deposit and divides by 1e12 on claim. The contract holds an allowlist of accepted token addresses set by the Factory.
- **Deployment:** Hardhat, Celo Mainnet (chainId 42220).
- **Key rules:** Deposits disabled 10 min before resolution. Outcome immutable post-resolution. No AMM, no tokens, no secondary market.
- **Gas:** All user transactions support `feeCurrency` via viem. Users pay gas in whichever stablecoin they deposit with. Contract itself is agnostic to gas currency — this is handled at the transaction level by viem.

### XP & Reputation System (Track from Day 1)
XP is a non-transferable, non-redeemable reputation score. It must be tracked from the very first deposit, not bolted on later.

**XP earning rules:**
- 1 XP per $1 equivalent wagered (normalized — 1 cUSD = 1 USDC = 1 USDT = $1)
- +50% bonus XP for winning predictions (e.g., wager $10 → 10 XP base + 5 XP win bonus = 15 XP)
- Future: streak bonuses, referral XP

**Implementation:**
- Emit XP-relevant data from contract events (Deposited amount, Claimed = win)
- Backend indexes Deposited + Claimed events → calculates XP → stores in DB
- XP ledger: user_address, amount, reason (WAGER | WIN_BONUS), market_id, timestamp
- Leaderboard queries aggregate XP per user, ranked globally (all currencies)

**Tier thresholds:**
| Tier | XP Range | Icon |
|------|----------|------|
| Bronze | 0–99 | 🥉 |
| Silver | 100–499 | 🥈 |
| Gold | 500–1,999 | 🥇 |
| Diamond | 2,000–4,999 | 💎 |
| GOAT | 5,000+ | 🐐 |

Leaderboard resets weekly. Tiers are cumulative (all-time XP).

### Backend Services
- **Runtime:** Node.js service (can be Next.js API routes for MVP)
- **Market Automation:** Cron-scheduled agent that creates daily/weekly/monthly markets per active currency pair, seeds pools if needed, resolves markets using price source.
- **Price Source:** Abstracted interface — `getOpenPrice(pair, date)`, `getClosePrice(pair, date)`. MVP: mock provider or simple FX API. Future: Banco de la República TRM, CBN rates, etc.
- **Database:** PostgreSQL (Supabase or similar) for user profiles, XP/leaderboard, activity logs, news cache.
- **News feed:** Curated macro news API or RSS → stored and served to frontend, filtered by user's currency/country.
- **Event indexer:** Listens to contract Deposited/Claimed events → updates XP ledger in real-time.

### Wallet Integration
1. Detect if running inside MiniPay: `window.ethereum?.isMiniPay === true`
2. If MiniPay: use MiniPay's injected provider directly via wagmi config.
3. If NOT MiniPay: initialize Privy embedded wallet.
4. **Stablecoin selection:** User picks preferred stablecoin (cUSD, USDC, or USDT). Stored in zustand + persisted.
5. **Deposits:** ERC-20 approve (real token address) → deposit to market contract. Contract normalizes 6-decimal tokens to 18-decimal internally.
6. **Gas:** Every write transaction passes `feeCurrency` = the stablecoin's fee address (adapter for USDC/USDT, direct for cUSD). Users never need CELO.
7. **Balance display:** Header shows balance of selected stablecoin (e.g., "$125.00 USDC"). Tapping shows balances for all three.
8. On first connection: detect geo-location → assign currency pair → prompt stablecoin selection → store in user profile.

---

## Project Structure
```
dolly/
├── CLAUDE.md
├── packages/
│   ├── web/                    # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with providers, gradient bg
│   │   │   ├── page.tsx        # Home screen
│   │   │   ├── market/[id]/
│   │   │   │   └── page.tsx    # Market detail page
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx    # Dollar analytics + news
│   │   │   ├── leaderboard/
│   │   │   │   └── page.tsx    # Global leaderboard
│   │   │   └── api/            # API routes (market automation, prices, etc.)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── BottomNav.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── BackHeader.tsx
│   │   │   ├── home/
│   │   │   │   ├── LivePrice.tsx
│   │   │   │   ├── DailyMarketCard.tsx
│   │   │   │   ├── MultiplierCards.tsx
│   │   │   │   ├── MarketCarousel.tsx
│   │   │   │   └── CountdownTimer.tsx
│   │   │   ├── market/
│   │   │   │   ├── MarketHeader.tsx
│   │   │   │   ├── ProbabilityChart.tsx
│   │   │   │   ├── MultiplierCards.tsx
│   │   │   │   ├── RulesSection.tsx
│   │   │   │   ├── HoldersTab.tsx
│   │   │   │   └── ActivityTab.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── PriceChart.tsx
│   │   │   │   ├── TimeRangeSelector.tsx
│   │   │   │   └── NewsFeed.tsx
│   │   │   ├── leaderboard/
│   │   │   │   ├── TierProgressBar.tsx
│   │   │   │   ├── TopThreePodium.tsx
│   │   │   │   ├── TierSection.tsx
│   │   │   │   └── LeaderboardRow.tsx
│   │   │   └── shared/
│   │   │       ├── DepositModal.tsx
│   │   │       └── TransactionStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useMarket.ts
│   │   │   ├── usePrice.ts
│   │   │   ├── useWallet.ts
│   │   │   └── useLeaderboard.ts
│   │   ├── lib/
│   │   │   ├── contracts.ts    # ABIs + addresses
│   │   │   ├── wagmi.ts        # wagmi config with MiniPay + Privy + feeCurrency
│   │   │   ├── stablecoins.ts  # cUSD, USDC, USDT addresses + adapter addresses
│   │   │   ├── currencies.ts   # Currency pair configs (COP, NGN, EGP, etc.)
│   │   │   ├── geo.ts          # Geo-detection → currency pair mapping
│   │   │   ├── xp.ts           # XP calculation utilities
│   │   │   └── utils.ts
│   │   ├── fonts/              # SF Pro Rounded font files
│   │   │   └── SFProRounded-*.woff2
│   │   ├── public/
│   │   │   ├── manifest.json   # PWA manifest
│   │   │   ├── sw.js           # Service worker (generated by next-pwa)
│   │   │   ├── offline.html    # Offline fallback page
│   │   │   └── icons/          # PWA icons (192, 512, maskable, apple-touch)
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── contracts/              # Hardhat project
│       ├── contracts/
│       │   ├── MarketFactory.sol
│       │   ├── Market.sol
│       │   └── interfaces/
│       ├── test/
│       ├── scripts/
│       │   ├── deploy.ts
│       │   └── seed.ts
│       ├── hardhat.config.ts
│       └── package.json
│
├── package.json                # Workspace root
└── turbo.json                  # (optional) Turborepo config
```

---

## Build Sequence (Claude Code Sessions)

### SESSION 1: Project Scaffolding + Design System Foundation + PWA
**Goal:** Monorepo setup, design tokens, layout shell, bottom nav, gradient background, fonts, PWA.
**Tasks:**
1. Initialize monorepo with `packages/web` (Next.js 14) and `packages/contracts` (Hardhat).
2. **Font setup:** Add SF Pro Rounded woff2 files to `packages/web/fonts/`. Configure `@font-face` in `globals.css` with weights (Regular, Medium, Semibold, Bold). Set as default font in Tailwind config. Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
3. **PWA setup:**
   - Install `next-pwa` or `@serwist/next`.
   - Create `public/manifest.json` with app name "Dolly", `display: standalone`, `orientation: portrait`, `background_color: #c8d5b9`, `theme_color: #c8d5b9`, icons (192, 512, maskable).
   - Add Apple meta tags in layout.tsx `<head>`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`.
   - Create `public/offline.html` — simple offline fallback page on sage green gradient with "Sin conexión" message.
   - Service worker: cache app shell, fonts, static assets. Do NOT cache price/market API data.
   - Suppress PWA install prompt when inside MiniPay (`window.ethereum?.isMiniPay`).
4. Configure Tailwind with custom design tokens (colors, gradients, border-radius, typography scale using SF Pro Rounded).
5. Build root layout with full-screen gradient background matching Figma.
6. Build BottomNav component — dark rounded pill, 3 tabs (Home/house, Leaderboard/trophy, Analytics/dollar), active state bright green, inactive white.
7. Build Header component (avatar, balance, country flag, notification bell).
8. Build BackHeader component ("← BACK TO HOME" + live price in top-right).
9. Set up basic page routes: `/`, `/market/[id]`, `/analytics`, `/leaderboard`.
10. Create `lib/stablecoins.ts` with cUSD, USDC, USDT config (token addresses, adapter addresses for feeCurrency, decimals) as defined in CLAUDE.md.
11. Create `lib/currencies.ts` with currency config map (COP, NGN, EGP, KES, ARS).
12. Create `lib/geo.ts` stub for geo-detection → currency pair mapping.
13. Verify: mobile-first layout matches Figma, font renders as SF Pro Rounded, PWA installable from browser, standalone mode works.

**Deliverable:** App shell that looks and feels like a native app. Navigation works. Gradient is correct. Installable as PWA.

---

### SESSION 2: Home Screen — Live Price + Daily Market + Market Carousel
**Goal:** Fully built Home screen matching Figma design.
**Tasks:**
1. LivePrice component: "DOLAR EN VIVO", large bold price with ↗ arrow, opening price, countdown timer.
2. CountdownTimer: "CIERRA EN: HH:MM:SSPM" with live countdown.
3. Market question display: "¿Cierra hoy más alto que la apertura?" in bold.
4. MultiplierCards: Side-by-side SUBE/BAJA cards with multiplier (e.g., "1.58x") and pool size. Proper green/pink styling.
5. MarketCarousel: Horizontal scrollable cards for SEMANAL, MENSUAL, ELECCIONES. Each shows type label, small icon, multiplier pair, and date.
6. Wire up mock data for all values. Create a `useMockMarketData` hook that returns realistic data.
7. Pixel-match the Figma home screen.

**Deliverable:** Home screen that is visually identical to the Figma mockup with mock data.

---

### SESSION 3: Market Detail Page
**Goal:** Fully built market detail page matching Figma.
**Tasks:**
1. MarketHeader: Market type badge (e.g., "MERCADO MENSUAL / MARZO, 2026") with icon, live price top-right.
2. Market question in bold. TRM reference price below.
3. ProbabilityChart: Area chart showing SUBE% (green) vs BAJA% (red) over time. Current percentages labeled at right edge ("SUBE 65%", "BAJA 35%"). Volume display and time range selector (1D, 1W, 2W, ALL).
4. MultiplierCards (reuse from Home with slight layout variation).
5. RulesSection: "RULES" header. Key dates (periodo, fecha de cierre, tiempo de resolución). Resolution criteria. Resolution details paragraph. Resolution source with Banco de la República link and logo.
6. Tabs: HOLDERS | ACTIVITY. Holders tab shows table: Resultado (SUBE/BAJA colored), Holders count, Porcentaje. Activity tab shows recent bets feed.
7. All mock data. Scrollable full page.

**Deliverable:** Market detail page pixel-matched to Figma.

---

### SESSION 4: Dollar Analytics Page
**Goal:** Analytics screen with price chart and news feed.
**Tasks:**
1. BackHeader with "NOTICIAS Y ANÁLISIS" title.
2. Large live price with opening price and % change (green).
3. PriceChart: Intraday line chart (jagged green line on light background). Time axis (10AM-1PM etc). Price axis on right. Volume bar or indicator below chart.
4. TimeRangeSelector: Pill buttons — 1D, 5D, 1W, 1M, 1Y, 5Y, ALL.
5. Volume indicator row.
6. "NOTICIAS CLAVES" section: News cards with flag emoji (🇺🇸/🇨🇴), bold headline, preview text, time ago, comment count icon.
7. Mock news data with realistic macro headlines in Spanish.

**Deliverable:** Analytics page matching Figma.

---

### SESSION 5: Leaderboard Page
**Goal:** Full leaderboard with tiers, podium, same light gradient as rest of app.
**Tasks:**
1. Same sage-to-cream gradient background as all other pages (NOT dark theme).
2. "← BACK TO HOME" top-left. "LEADERBOARD GLOBAL" header with trophy/money illustration.
3. TierProgressBar: Horizontal bar with 5 tier icons (🥉 Bronze, 🥈 Silver, 🥇 Gold, 💎 Diamond, 🐐 GOAT). Green fill up to user's current tier. "Your position: Silver" left, "347 xp" right.
4. "THIS WEEK'S TOP GOATS" podium: 1st center-top (larger circle, "1st" badge), 2nd left, 3rd right. Each: gray avatar circle, @username, country flag, "© bets - XPxp".
5. Tier sections: "GOATS 🐐" with goat emoji header, then list rows. "DIAMOND 💎" with diamond emoji header, then list rows.
6. Each row: avatar circle, @username + flag, "© 240", "2930xp". Clean light backgrounds.
7. Bottom nav: dark rounded pill, green active icon — consistent with all pages.
8. Mock data: @MarketHawk 🇪🇬, @CairoChad 🇪🇬, @EkoNavigator 🇳🇬 etc.

**Deliverable:** Leaderboard page matching Figma light-theme design.

---

### SESSION 6: Smart Contracts
**Goal:** Deployed, tested pari-mutuel contracts with multi-currency and multi-stablecoin support.
**Tasks:**
1. Write Market.sol: depositUp(token, amount), depositDown(token, amount), closeBetting(), resolve(outcome, openPrice, closePrice, sourceId), claim(). Accepts cUSD (18 dec), USDC (6 dec), USDT (6 dec) — an `allowedTokens` mapping set by Factory. Internally normalizes all balances to 18 decimals (6-dec tokens scaled by 1e12). State: totalUp, totalDown, mappings for user deposits per side (tracking token + normalized amount), outcome enum (UNRESOLVED/UP/DOWN), rakeBps, `currencyPair` (bytes32). 10-min pre-resolution cutoff. Events: Deposited(user, side, token, amount), Resolved(outcome, openPrice, closePrice, sourceId), Claimed(user, token, payout), RakeCollected(token, amount). Events are critical — backend indexes them for XP.
2. Write MarketFactory.sol: createMarket(currencyPair, type, startDate, endDate, rakeBps, allowedTokens[]) → deploys Market clone via CREATE2. Deterministic market IDs from currencyPair + type + date. Registry of all markets. getMarketsByCurrency(currencyPair) view. Owner-only creation (for MVP).
3. Comprehensive Hardhat tests: deposit flows with cUSD + USDC + USDT, decimal normalization correctness, resolution, payout math (verify rake deduction + proportional split), edge cases (no deposits on one side, claim twice, deposit after close, mixed stablecoin pool).
4. Deploy script for Celo Mainnet (and Alfajores testnet).
5. Export ABIs and addresses to `packages/web/lib/contracts.ts`.

**Deliverable:** Tested, deployable multi-stablecoin contracts with exported ABIs.

---

### SESSION 7: Wallet Integration + Contract Wiring
**Goal:** Connect frontend to real wallet and contracts. Multi-stablecoin support. Gas paid in user's chosen stablecoin via viem.
**Tasks:**
1. wagmi config with viem: Celo chain, MiniPay detection (`window.ethereum?.isMiniPay`), Privy fallback. **CRITICAL:** Use `lib/stablecoins.ts` to dynamically set `feeCurrency` on every write tx — use adapter address for USDC/USDT, direct address for cUSD. Users never need CELO.
2. WalletProvider context: auto-connect flow, connection status.
3. **Stablecoin selector:** On first connect (or in settings), user picks cUSD / USDC / USDT. Store selection in zustand (persisted). Header shows balance of selected stablecoin.
4. Geo-detection on first connect: call IP geolocation API → map to currency pair → store in user profile + zustand. Route user to correct markets.
5. useMarket hook: read market state (totalUp, totalDown, outcome, user deposits) from contract. Filter by user's currency pair.
6. DepositModal: amount input, SUBE/BAJA selection. Shows selected stablecoin. Two-step: approve (real token address) → deposit (passes token address to contract). Both txs use `feeCurrency` = adapter/direct address from stablecoins config.
7. TransactionStatus: pending/success/error states with appropriate UI.
8. Wire Home + Market Detail pages to live contract data (replace mock data).
9. Claim flow on resolved markets — payout in the stablecoin the user deposited with.
10. XP tracking: on successful Deposited event, log to backend for XP calculation.

**Deliverable:** Users connect wallet, choose stablecoin, are geo-routed to their currency, deposit, claim. Gas in any supported stablecoin.

---

### SESSION 8: Backend Services — Market Automation + Price Feed + XP Indexer
**Goal:** Automated market lifecycle with XP tracking from day 1.
**Tasks:**
1. API route: `/api/markets?currency=COP` — list active/resolved markets, filtered by currency pair.
2. API route: `/api/price?pair=USD/COP` — current price (mock or real FX API). Parameterized for multi-currency.
3. Market Automation Agent: cron job that creates daily/weekly/monthly markets per active currency pair. Calls MarketFactory.createMarket(currencyPair, ...).
4. Resolution Agent: fetches close price, calls Market.resolve(). Handles 10-min betting cutoff.
5. Price Source module: abstracted `getOpenPrice(pair, date)` / `getClosePrice(pair, date)`. MVP: COP via FX API. Architecture supports adding NGN, EGP, etc. easily.
6. Database schema (Supabase): users (address, username, country_code, currency_pair), xp_ledger (address, amount, reason, market_id, timestamp), markets (id, currency_pair, type, contract_address, status), news_items (id, title, body, country_code, source_url, published_at).
7. **Event Indexer:** Background job that listens to Deposited + Claimed events from all Market contracts. On Deposited: normalize amount to $1 equivalent (all stablecoins = $1), calculate XP. On Claimed: calculate win bonus XP (+50%). Write to xp_ledger.
8. Leaderboard API: `/api/leaderboard` — aggregate XP globally across all currencies, return ranked list with tier.
9. Geo API: `/api/geo` — returns user's detected country + assigned currency pair.

**Deliverable:** Automated market creation/resolution. XP tracked from first deposit. Multi-currency-ready API layer.

---

### SESSION 9: Polish, XP System, News Feed
**Goal:** Complete gamification and content layers.
**Tasks:**
1. XP calculation: 1 XP per $1 wagered + bonus XP for wins. Store in DB.
2. Wire leaderboard page to real XP data.
3. Tier calculation logic (Bronze < 100, Silver < 500, Gold < 2000, Diamond < 5000, GOAT 5000+). Adjust thresholds as needed.
4. News feed: API route that serves curated macro news. RSS ingestion or manual seeding for MVP.
5. Wire analytics page to real price data + news feed.
6. Push notification setup (optional, web push).
7. Final responsive polish across all pages.
8. Error states, loading skeletons, empty states.

**Deliverable:** Feature-complete MVP with gamification and content.

---

### SESSION 10: Testing, Optimization, Deployment
**Goal:** Production-ready deployment.
**Tasks:**
1. End-to-end testing: full user flow (connect → select stablecoin → deposit → wait → resolution → claim).
2. Contract security review: reentrancy checks, overflow protection, access control, multi-stablecoin decimal handling.
3. Frontend performance: lazy loading, image optimization, bundle size check.
4. Mobile testing: MiniPay environment, various screen sizes.
5. **PWA verification:**
   - Lighthouse PWA audit (target 100 PWA score).
   - Test "Add to Home Screen" on iOS Safari + Android Chrome.
   - Verify standalone mode: no browser chrome, sage green status bar, correct splash screen.
   - Verify offline fallback page works when network drops.
   - Verify service worker caches app shell + fonts but NOT API data.
   - Verify safe-area-insets on iPhone (notch, home indicator) in standalone mode.
   - Verify PWA install prompt is suppressed inside MiniPay.
6. Deploy contracts to Celo Mainnet.
7. Deploy frontend to Vercel.
8. Configure environment variables, RPC endpoints, contract addresses.
9. Monitoring: basic error tracking (Sentry), contract event monitoring.

**Deliverable:** Live production MVP, installable as PWA.

---

## Key Rules for Claude Code

### Code Style
- TypeScript strict mode, no `any`.
- Functional components only, no class components.
- Use `'use client'` directive only when needed (interactive components).
- Prefer server components for static content.
- Tailwind utility classes, avoid custom CSS unless necessary for gradients/animations.
- Name files in PascalCase for components, camelCase for hooks/utils.

### Design Fidelity
- **THIS IS CRITICAL:** Match the Figma mockups as closely as possible. The gradient background, card styling, SUBE/BAJA color treatment, typography scale, and spacing are all specifically designed.
- The app should feel warm and organic (sage green gradient), NOT cold/clinical.
- Mobile-first. 390px base width. No desktop layout needed for MVP.
- Bottom nav is always visible. Content scrolls behind it.
- **PWA-native feel:** In standalone mode (installed to homescreen), the app must feel indistinguishable from a native app. Status bar matches the sage green. No browser chrome. Smooth transitions. No "website" tells.
- Safe area insets: respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for notched devices (iPhone) in standalone PWA mode.

### Smart Contract Rules
- Market contracts accept deposits in cUSD (18 decimals), USDC (6 decimals), and USDT (6 decimals) on Celo.
- Internally, all accounting is normalized to 18-decimal units. 6-decimal tokens are scaled by 1e12 on deposit, and scaled back on claim.
- Always require ERC-20 approve before deposit (using real token address, not adapter).
- Use OpenZeppelin contracts where possible (ReentrancyGuard, Ownable).
- Emit events for every state change (Deposited, Resolved, Claimed — these are indexed for XP calculation).
- No upgradability patterns for MVP (keep it simple).
- Market contracts store `currencyPair` (bytes32) for multi-currency support.
- Gas fees are paid in the user's selected stablecoin via viem `feeCurrency` field. For USDC/USDT, use the adapter address for feeCurrency. This is handled client-side — contracts are gas-currency agnostic.

### Performance
- Pages should load < 2s on 3G.
- Use React Query with appropriate stale times.
- Price polling: every 30s for live price, every 5s during last hour before resolution.
- Minimize RPC calls: batch reads where possible.
- **PWA caching strategy:** Service worker caches app shell (HTML, CSS, JS bundles), fonts (SF Pro Rounded woff2), and static icons. API responses for `/api/price`, `/api/markets`, `/api/leaderboard` are network-first (never serve stale market data). Offline fallback shows cached shell with "Sin conexión" message.

### Spanish UI (MVP)
- All user-facing text is in Spanish for MVP (Colombia launch).
- Backend/code comments in English.
- Key terms: SUBE = up, BAJA = down, MERCADO = market, APERTURA = opening, CIERRE = close, SEMANAL = weekly, MENSUAL = monthly.
- Architecture supports i18n: all UI strings should be in a constants file, not hardcoded in JSX. Future: English for Nigeria/Kenya, Arabic for Egypt, etc.

### Typography
- **Primary font:** SF Pro Rounded — gives the app its friendly, approachable feel. This is non-negotiable.
- **Icons:** SF Pro Symbols where available, Lucide React as fallback for web.
- **Numeric displays:** Use `font-variant-numeric: tabular-nums` for prices, multipliers, and countdowns so digits don't shift as values change.
- **Font loading:** Include SF Pro Rounded woff2 files in `packages/web/fonts/`. Load via `@font-face` in `globals.css` with `font-display: swap`.
- **Fallback stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
