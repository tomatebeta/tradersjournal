-- TradeJournal Pro — Supabase Schema
-- Run this entire file in the Supabase SQL Editor

-- ─── TRADES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trades (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date          date NOT NULL,
  time          time NOT NULL,
  symbol        text NOT NULL,
  asset_type    text NOT NULL,
  direction     text NOT NULL,
  entry_price   numeric NOT NULL,
  exit_price    numeric NOT NULL,
  stop_loss     numeric,
  take_profit   numeric,
  position_size numeric NOT NULL,
  pnl           numeric NOT NULL DEFAULT 0,
  fees          numeric DEFAULT 0,
  risk_amount   numeric,
  leverage      numeric,
  r_multiple    numeric,
  outcome       text NOT NULL,
  strategy      text,
  setup         text,
  timeframe     text,
  session       text,
  notes         text,
  lessons_learned text,
  tags          text[],
  mistakes      text[],
  emotion_before text,
  emotion_after  text,
  confidence_rating integer,
  execution_rating  integer,
  screenshots   text[],
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── WEEKLY REVIEWS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start           date NOT NULL,
  week_end             date NOT NULL,
  total_pnl            numeric NOT NULL DEFAULT 0,
  trade_count          integer NOT NULL DEFAULT 0,
  win_rate             numeric NOT NULL DEFAULT 0,
  went_well            text,
  went_wrong           text,
  most_common_mistake  text,
  best_setup           text,
  goal_for_next_week   text,
  psychological_notes  text,
  discipline_score     integer,
  created_at           timestamptz DEFAULT now()
);

-- ─── PSYCHOLOGY ENTRIES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.psychology_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date              date NOT NULL,
  type              text NOT NULL,
  title             text NOT NULL,
  content           text NOT NULL,
  mood              integer NOT NULL DEFAULT 5,
  confidence_level  integer NOT NULL DEFAULT 5,
  created_at        timestamptz DEFAULT now()
);

-- ─── TRADING RULES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trading_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        text NOT NULL,
  title       text NOT NULL,
  description text,
  value       numeric,
  active      boolean DEFAULT true
);

-- ─── USER SETTINGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name         text NOT NULL DEFAULT 'Trader',
  currency             text NOT NULL DEFAULT 'USD',
  theme                text NOT NULL DEFAULT 'dark',
  timezone             text NOT NULL DEFAULT 'America/New_York',
  default_account_size numeric NOT NULL DEFAULT 10000,
  risk_per_trade       numeric NOT NULL DEFAULT 1,
  notifications        jsonb NOT NULL DEFAULT '{"dailyReminder":true,"weeklyReview":true,"missedJournaling":false}'::jsonb,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
ALTER TABLE public.trades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychology_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings      ENABLE ROW LEVEL SECURITY;

-- Policies: each user can only touch their own rows
CREATE POLICY "own_trades"      ON public.trades             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_reviews"     ON public.weekly_reviews     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_psychology"  ON public.psychology_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_rules"       ON public.trading_rules      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_settings"    ON public.user_settings      FOR ALL USING (auth.uid() = user_id);

-- Auto-create user_settings row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Trader'));
  RETURN NEW;
END;
$$;

-- If upgrading an existing DB, run these:
-- ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS leverage numeric;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
