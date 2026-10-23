-- ========================================================================
-- TRADING JOURNAL TABLES (structure only)
-- Generated from the local 'trade' database with pg_dump --schema-only.
-- Requires the existing users table. Applied by scripts/migrate_trading_schema.js.
-- ========================================================================
--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assign_trade_num(); Type: FUNCTION; Schema: public
-- Numbers trades sequentially per account; serialised per account so concurrent inserts never collide
--

CREATE OR REPLACE FUNCTION public.assign_trade_num() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('trade_num:' || NEW.account_id));
  SELECT COALESCE(MAX(trade_num), 0) + 1 INTO NEW.trade_num
  FROM public.trades
  WHERE account_id = NEW.account_id;
  RETURN NEW;
END;
$$;

--
-- Name: daily_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_reviews (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    account_id character varying(36),
    review_date date NOT NULL,
    what_went_well text,
    what_went_wrong text,
    lessons text,
    next_session_plan text,
    market_condition character varying(100),
    daily_rating integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT daily_reviews_daily_rating_check CHECK (((daily_rating >= 1) AND (daily_rating <= 5)))
);


--
-- Name: pre_market_routines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_market_routines (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    account_id character varying(36),
    routine_date date NOT NULL,
    economic_calendar_reviewed boolean DEFAULT false,
    economic_calendar_notes text,
    trade_plan_reviewed boolean DEFAULT false,
    daily_bias character varying(50),
    max_daily_loss numeric(15,2),
    trade_plan_notes text,
    charts_analyzed boolean DEFAULT false,
    watchlist text,
    chart_notes text,
    meditation_completed boolean DEFAULT false,
    meditation_minutes integer DEFAULT 10,
    mindset_rating integer DEFAULT 5,
    is_completed boolean DEFAULT false,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategies (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(20) DEFAULT '#3B82F6'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    archived_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(20) DEFAULT '#06B6D4'::character varying,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: trade_journals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trade_journals (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    trade_id character varying(36) NOT NULL,
    entry_reason text,
    exit_reason text,
    emotion_before character varying(50),
    emotion_after character varying(50),
    discipline_rating integer,
    rule_adherence boolean DEFAULT true,
    mistakes text,
    lessons_learned text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    emotion_during character varying(50),
    confidence_rating integer,
    mistake_flag boolean DEFAULT false,
    mistake_type character varying(100),
    market_condition character varying(100),
    CONSTRAINT trade_journals_discipline_rating_check CHECK (((discipline_rating >= 1) AND (discipline_rating <= 10)))
);


--
-- Name: trade_screenshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trade_screenshots (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    trade_id character varying(36) NOT NULL,
    storage_key character varying(255) NOT NULL,
    original_filename character varying(255) NOT NULL,
    content_type character varying(100) DEFAULT 'image/png'::character varying NOT NULL,
    size_bytes bigint,
    caption character varying(255),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: trade_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trade_tags (
    trade_id character varying(36) NOT NULL,
    tag_id character varying(36) NOT NULL
);


--
-- Name: trades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trades (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    account_id character varying(36) NOT NULL,
    strategy_id character varying(36),
    symbol character varying(50) NOT NULL,
    direction character varying(10) NOT NULL,
    status character varying(10) DEFAULT 'CLOSED'::character varying NOT NULL,
    opened_at timestamp(6) with time zone NOT NULL,
    closed_at timestamp(6) with time zone,
    entry_price numeric(18,6) NOT NULL,
    exit_price numeric(18,6),
    stop_loss numeric(18,6),
    take_profit numeric(18,6),
    volume numeric(18,4),
    planned_risk_amount numeric(18,4),
    planned_reward_amount numeric(18,4),
    planned_rr_ratio numeric(10,2),
    actual_r numeric(10,2),
    gross_pnl numeric(18,4),
    commission numeric(18,4) DEFAULT 0.0000 NOT NULL,
    swap numeric(18,4) DEFAULT 0.0000 NOT NULL,
    fees numeric(18,4) DEFAULT 0.0000 NOT NULL,
    net_pnl numeric(18,4),
    pnl_percentage numeric(10,4),
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp(6) with time zone,
    trade_num integer,
    market character varying(50),
    session character varying(50),
    sl_points numeric(18,4),
    tp_points numeric(18,4),
    market_condition character varying(100),
    result character varying(20),
    CONSTRAINT trades_direction_check CHECK (((direction)::text = ANY ((ARRAY['BUY'::character varying, 'SELL'::character varying, 'LONG'::character varying, 'SHORT'::character varying])::text[]))),
    CONSTRAINT trades_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'CLOSED'::character varying])::text[])))
);


--
-- Name: trading_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trading_accounts (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    account_type character varying(30) DEFAULT 'demo'::character varying NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    starting_balance numeric(18,4) DEFAULT 10000.0000 NOT NULL,
    current_balance numeric(18,4) DEFAULT 10000.0000 NOT NULL,
    description text,
    is_archived boolean DEFAULT false NOT NULL,
    archived_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT trading_accounts_account_type_check CHECK (((account_type)::text = ANY ((ARRAY['demo'::character varying, 'live'::character varying, 'backtest'::character varying, 'funded'::character varying])::text[])))
);


--
-- Name: daily_reviews daily_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reviews
    ADD CONSTRAINT daily_reviews_pkey PRIMARY KEY (id);


--
-- Name: pre_market_routines pre_market_routines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_market_routines
    ADD CONSTRAINT pre_market_routines_pkey PRIMARY KEY (id);


--
-- Name: strategies strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: trade_journals trade_journals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_journals
    ADD CONSTRAINT trade_journals_pkey PRIMARY KEY (id);


--
-- Name: trade_journals trade_journals_trade_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_journals
    ADD CONSTRAINT trade_journals_trade_id_key UNIQUE (trade_id);


--
-- Name: trade_screenshots trade_screenshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_screenshots
    ADD CONSTRAINT trade_screenshots_pkey PRIMARY KEY (id);


--
-- Name: trade_tags trade_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_tags
    ADD CONSTRAINT trade_tags_pkey PRIMARY KEY (trade_id, tag_id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: trading_accounts trading_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trading_accounts
    ADD CONSTRAINT trading_accounts_pkey PRIMARY KEY (id);


--
-- Name: pre_market_routines uq_routine_user_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_market_routines
    ADD CONSTRAINT uq_routine_user_date UNIQUE (user_id, routine_date);


--
-- Name: daily_reviews uq_user_account_review_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reviews
    ADD CONSTRAINT uq_user_account_review_date UNIQUE (user_id, account_id, review_date);


--
-- Name: strategies uq_user_strategy_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT uq_user_strategy_name UNIQUE (user_id, name);


--
-- Name: tags uq_user_tag_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT uq_user_tag_name UNIQUE (user_id, name);


--
-- Name: idx_daily_reviews_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_reviews_user_date ON public.daily_reviews USING btree (user_id, review_date);


--
-- Name: idx_strategies_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_strategies_user ON public.strategies USING btree (user_id);


--
-- Name: idx_tags_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_user ON public.tags USING btree (user_id);


--
-- Name: idx_trade_journals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trade_journals_user ON public.trade_journals USING btree (user_id);


--
-- Name: idx_trade_screenshots_trade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trade_screenshots_trade ON public.trade_screenshots USING btree (trade_id);


--
-- Name: idx_trade_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trade_tags_tag ON public.trade_tags USING btree (tag_id);


--
-- Name: idx_trades_strategy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_strategy ON public.trades USING btree (strategy_id);


--
-- Name: idx_trades_user_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_user_account ON public.trades USING btree (user_id, account_id);


--
-- Name: idx_trades_user_opened; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_user_opened ON public.trades USING btree (user_id, opened_at);


--
-- Name: idx_trades_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_user_status ON public.trades USING btree (user_id, status);


--
-- Name: idx_trades_user_symbol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_user_symbol ON public.trades USING btree (user_id, symbol);


--
-- Name: idx_trading_accounts_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trading_accounts_type ON public.trading_accounts USING btree (user_id, account_type);


--
-- Name: idx_trading_accounts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trading_accounts_user ON public.trading_accounts USING btree (user_id);


--
-- Name: trades_account_trade_num_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX trades_account_trade_num_key ON public.trades USING btree (account_id, trade_num);


--
-- Name: trades trades_assign_trade_num; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trades_assign_trade_num BEFORE INSERT ON public.trades FOR EACH ROW EXECUTE FUNCTION public.assign_trade_num();


--
-- Name: daily_reviews daily_reviews_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reviews
    ADD CONSTRAINT daily_reviews_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.trading_accounts(id) ON DELETE SET NULL;


--
-- Name: daily_reviews daily_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reviews
    ADD CONSTRAINT daily_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: strategies strategies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tags tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trade_journals trade_journals_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_journals
    ADD CONSTRAINT trade_journals_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: trade_journals trade_journals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_journals
    ADD CONSTRAINT trade_journals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trade_screenshots trade_screenshots_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_screenshots
    ADD CONSTRAINT trade_screenshots_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: trade_screenshots trade_screenshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_screenshots
    ADD CONSTRAINT trade_screenshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trade_tags trade_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_tags
    ADD CONSTRAINT trade_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: trade_tags trade_tags_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_tags
    ADD CONSTRAINT trade_tags_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: trades trades_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.trading_accounts(id) ON DELETE CASCADE;


--
-- Name: trades trades_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON DELETE SET NULL;


--
-- Name: trades trades_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trading_accounts trading_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trading_accounts
    ADD CONSTRAINT trading_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


