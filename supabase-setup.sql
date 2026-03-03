-- Run this in Supabase SQL Editor (https://uhpyebkjfzkaqonoabjf.supabase.co)
-- This creates the prize_pool table for server-side prize pool tracking.

CREATE TABLE IF NOT EXISTS prize_pool (
  id TEXT PRIMARY KEY DEFAULT 'global',
  balance NUMERIC NOT NULL DEFAULT 5.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the initial row (5 SOL simulated starting balance)
INSERT INTO prize_pool (id, balance)
VALUES ('global', 5.0)
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

-- Function to claim the reward (returns current balance and resets to 5)
CREATE OR REPLACE FUNCTION claim_reward()
RETURNS NUMERIC AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  SELECT balance INTO current_balance FROM prize_pool WHERE id = 'global' FOR UPDATE;
  UPDATE prize_pool SET balance = 5.0, updated_at = now() WHERE id = 'global';
  RETURN current_balance;
END;
$$ LANGUAGE plpgsql;
