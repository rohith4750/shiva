-- ========================================================================
-- MANUAL TRADING JOURNAL PLATFORM - POSTGRESQL DATABASE SCHEMA
-- Database: trade
-- Host: localhost:5432
-- ========================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in reverse dependency order if recreating
DROP TABLE IF EXISTS trade_tags CASCADE;
DROP TABLE IF EXISTS trade_screenshots CASCADE;
DROP TABLE IF EXISTS trade_journals CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS daily_reviews CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS trading_accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================================================
-- 1. USERS TABLE
-- ========================================================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    avatar_url TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ========================================================================
-- 2. SESSIONS TABLE (Opaque server-managed session tokens)
-- ========================================================================
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ(6) NOT NULL,
    revoked_at TIMESTAMPTZ(6),
    last_seen_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

-- ========================================================================
-- 3. TRADING ACCOUNTS TABLE (Multiple manual accounts per user)
-- ========================================================================
CREATE TABLE trading_accounts (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(30) NOT NULL DEFAULT 'demo' CHECK (account_type IN ('demo', 'live', 'backtest', 'funded')),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    starting_balance NUMERIC(18, 4) NOT NULL DEFAULT 10000.0000,
    current_balance NUMERIC(18, 4) NOT NULL DEFAULT 10000.0000,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ(6),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trading_accounts_user ON trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_type ON trading_accounts(user_id, account_type);

-- ========================================================================
-- 4. STRATEGIES TABLE
-- ========================================================================
CREATE TABLE strategies (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    archived_at TIMESTAMPTZ(6),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_strategy_name UNIQUE (user_id, name)
);

CREATE INDEX idx_strategies_user ON strategies(user_id);

-- ========================================================================
-- 5. TAGS TABLE
-- ========================================================================
CREATE TABLE tags (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#06B6D4',
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_tag_name UNIQUE (user_id, name)
);

CREATE INDEX idx_tags_user ON tags(user_id);

-- ========================================================================
-- 6. TRADES TABLE (Core trade lifecycle & financial precision)
-- ========================================================================
CREATE TABLE trades (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(36) NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    strategy_id VARCHAR(36) REFERENCES strategies(id) ON DELETE SET NULL,
    symbol VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('BUY', 'SELL', 'LONG', 'SHORT')),
    status VARCHAR(10) NOT NULL DEFAULT 'CLOSED' CHECK (status IN ('OPEN', 'CLOSED')),
    opened_at TIMESTAMPTZ(6) NOT NULL,
    closed_at TIMESTAMPTZ(6),
    entry_price NUMERIC(18, 6) NOT NULL,
    exit_price NUMERIC(18, 6),
    stop_loss NUMERIC(18, 6),
    take_profit NUMERIC(18, 6),
    volume NUMERIC(18, 4),
    planned_risk_amount NUMERIC(18, 4),
    planned_reward_amount NUMERIC(18, 4),
    planned_rr_ratio NUMERIC(10, 2),
    actual_r NUMERIC(10, 2),
    gross_pnl NUMERIC(18, 4),
    commission NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    swap NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    fees NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    net_pnl NUMERIC(18, 4),
    pnl_percentage NUMERIC(10, 4),
    notes TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ(6)
);

CREATE INDEX idx_trades_user_account ON trades(user_id, account_id);
CREATE INDEX idx_trades_user_status ON trades(user_id, status);
CREATE INDEX idx_trades_user_opened ON trades(user_id, opened_at);
CREATE INDEX idx_trades_user_symbol ON trades(user_id, symbol);
CREATE INDEX idx_trades_strategy ON trades(strategy_id);

-- ========================================================================
-- 7. TRADE TAGS JOIN TABLE (Many-to-Many)
-- ========================================================================
CREATE TABLE trade_tags (
    trade_id VARCHAR(36) NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    tag_id VARCHAR(36) NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (trade_id, tag_id)
);

CREATE INDEX idx_trade_tags_tag ON trade_tags(tag_id);

-- ========================================================================
-- 8. TRADE JOURNAL TABLE (One-to-One psychology, discipline & review)
-- ========================================================================
CREATE TABLE trade_journals (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_id VARCHAR(36) NOT NULL UNIQUE REFERENCES trades(id) ON DELETE CASCADE,
    entry_reason TEXT,
    exit_reason TEXT,
    emotion_before VARCHAR(50),
    emotion_after VARCHAR(50),
    discipline_rating INTEGER CHECK (discipline_rating >= 1 AND discipline_rating <= 5),
    rule_adherence BOOLEAN DEFAULT TRUE,
    mistakes TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_journals_user ON trade_journals(user_id);

-- ========================================================================
-- 9. TRADE SCREENSHOTS TABLE (Private S3/Local object references)
-- ========================================================================
CREATE TABLE trade_screenshots (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_id VARCHAR(36) NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    storage_key VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL DEFAULT 'image/png',
    size_bytes BIGINT,
    caption VARCHAR(255),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_screenshots_trade ON trade_screenshots(trade_id);

-- ========================================================================
-- 10. DAILY REVIEWS TABLE
-- ========================================================================
CREATE TABLE daily_reviews (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(36) REFERENCES trading_accounts(id) ON DELETE SET NULL,
    review_date DATE NOT NULL,
    what_went_well TEXT,
    what_went_wrong TEXT,
    lessons TEXT,
    next_session_plan TEXT,
    market_condition VARCHAR(100),
    daily_rating INTEGER CHECK (daily_rating >= 1 AND daily_rating <= 5),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_account_review_date UNIQUE (user_id, account_id, review_date)
);

CREATE INDEX idx_daily_reviews_user_date ON daily_reviews(user_id, review_date);
