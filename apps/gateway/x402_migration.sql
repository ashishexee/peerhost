-- Run this in your Supabase SQL Editor to enable Agentic Payments

ALTER TABLE functions 
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS beneficiary TEXT;

-- Optional: Add an index for faster lookups if not already indexed
CREATE INDEX IF NOT EXISTS idx_functions_lookup ON functions (wallet, project, function_name);

-- Phase 4: Earnings Dashboard
-- Stores the history of settled payments
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    beneficiary TEXT NOT NULL,
    payer TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USDC',
    project TEXT,
    function_name TEXT,
    signature TEXT, 
    -- Metadata
    resource_id TEXT
);

-- Index for fast Earnings lookup
CREATE INDEX IF NOT EXISTS idx_transactions_beneficiary ON transactions (beneficiary);

    