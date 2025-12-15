-- Migration: Create admin_settings table
-- Run this SQL in your Supabase SQL editor or Postgres database

CREATE TABLE IF NOT EXISTS admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  site_name TEXT NOT NULL DEFAULT 'Admin Panel',
  allow_signup BOOLEAN NOT NULL DEFAULT true,
  daily_token_limit INTEGER NOT NULL DEFAULT 20000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row if it doesn't exist
INSERT INTO admin_settings (id, site_name, allow_signup, daily_token_limit)
VALUES ('singleton', 'Admin Panel', true, 20000)
ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();

-- Add comment to table
COMMENT ON TABLE admin_settings IS 'Stores admin panel system settings (singleton pattern)';

