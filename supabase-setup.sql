-- Run this in Supabase SQL Editor (https://uhpyebkjfzkaqonoabjf.supabase.co)
-- This creates the prize_pool table for server-side prize pool tracking.

CREATE TABLE IF NOT EXISTS prize_pool (
  id TEXT PRIMARY KEY DEFAULT 'global',
  balance NUMERIC NOT NULL DEFAULT 11.50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the initial row (11.50 SOL starting balance)
INSERT INTO prize_pool (id, balance)
VALUES ('global', 11.50)
ON CONFLICT (id) DO NOTHING;

-- Function to atomically add to the pool
CREATE OR REPLACE FUNCTION add_to_pool(amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE prize_pool
  SET balance = balance + amount, updated_at = now()
  WHERE id = 'global'
  RETURNING balance INTO new_balance;
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to claim a fixed reward (deducts reward_amount from pool, returns new balance)
CREATE OR REPLACE FUNCTION claim_fixed_reward(reward_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE prize_pool
  SET balance = GREATEST(balance - reward_amount, 0), updated_at = now()
  WHERE id = 'global'
  RETURNING balance INTO new_balance;
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;
