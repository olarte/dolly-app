-- Dolly MVP Database Schema
-- Run against your Supabase project SQL editor

-- Users table: wallet address + profile
CREATE TABLE IF NOT EXISTS users (
  address TEXT PRIMARY KEY, -- lowercase 0x... wallet address
  username TEXT,
  country_code TEXT NOT NULL DEFAULT 'CO',
  currency_code TEXT NOT NULL DEFAULT 'COP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_country ON users(country_code);

-- Markets table: mirrors on-chain markets with metadata
CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY, -- contract address (lowercase)
  currency_pair TEXT NOT NULL, -- e.g. "USD/COP"
  market_type SMALLINT NOT NULL DEFAULT 0, -- 0=daily, 1=weekly, 2=monthly
  contract_address TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  betting_close_time TIMESTAMPTZ NOT NULL,
  opening_price NUMERIC, -- stored at market creation
  closing_price NUMERIC, -- stored at resolution
  outcome SMALLINT NOT NULL DEFAULT 0, -- 0=UNRESOLVED, 1=UP, 2=DOWN
  status TEXT NOT NULL DEFAULT 'active', -- active, closed, resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markets_currency ON markets(currency_pair);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_end ON markets(end_date);

-- XP Ledger: all XP-earning events
CREATE TABLE IF NOT EXISTS xp_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  amount INTEGER NOT NULL, -- XP earned
  reason TEXT NOT NULL, -- 'WAGER' or 'WIN_BONUS'
  market_id TEXT, -- contract address of market
  tx_hash TEXT NOT NULL, -- transaction hash for traceability
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency: prevent double-counting same tx for same reason
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_ledger_idempotent
  ON xp_ledger(tx_hash, reason);

CREATE INDEX IF NOT EXISTS idx_xp_ledger_user ON xp_ledger(user_address);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_created ON xp_ledger(created_at);

-- News items
CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  flag TEXT NOT NULL DEFAULT '🇨🇴',
  country_code TEXT NOT NULL DEFAULT 'CO',
  source_url TEXT,
  comments INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_country ON news_items(country_code);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);

-- Indexer state: track last processed block per contract
CREATE TABLE IF NOT EXISTS indexer_state (
  contract_address TEXT PRIMARY KEY,
  last_block BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
