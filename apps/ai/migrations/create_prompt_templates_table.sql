-- Migration: Create prompt_templates table
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on (user_id, created_at desc) for efficient listing of templates by user
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id_created_at 
  ON prompt_templates(user_id, created_at DESC);

-- Create a function to automatically update updated_at timestamp (if not already exists)
-- This function may already exist from the user_settings migration
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE prompt_templates IS 'Stores user-created prompt templates for chat conversations';

