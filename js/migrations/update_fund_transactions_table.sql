-- Add columns for the transfer transaction type
ALTER TABLE fund_transactions
ADD COLUMN IF NOT EXISTS "fromMember" TEXT REFERENCES members(name) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "toMember" TEXT REFERENCES members(name) ON DELETE SET NULL; 