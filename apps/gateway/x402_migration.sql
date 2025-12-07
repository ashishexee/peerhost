-- Run this in your Supabase SQL Editor to enable Agentic Payments

ALTER TABLE functions 
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS beneficiary TEXT;

-- Optional: Add an index for faster lookups if not already indexed
CREATE INDEX IF NOT EXISTS idx_functions_lookup ON functions (wallet, project, function_name);
