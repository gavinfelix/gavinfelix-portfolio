-- Migration: Add status column to users table
-- Run this SQL in your Supabase SQL editor or Postgres database
-- This migration adds a status column to track user account status (active/banned)

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'banned'));
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update existing users to have 'active' status if somehow they don't have it
UPDATE users SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'banned');

-- Add comment to column
COMMENT ON COLUMN users.status IS 'User account status: active or banned';

