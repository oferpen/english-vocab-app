-- Simplified schema: Google login directly to child profile
-- Run this in Supabase SQL Editor

-- Add provider_user_id to child_profiles if it doesn't exist
ALTER TABLE child_profiles 
ADD COLUMN IF NOT EXISTS provider_user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_child_profiles_provider_user_id 
ON child_profiles(provider_user_id);

-- Update RLS policy to allow users to access their own child profile
DROP POLICY IF EXISTS "Users can access own child profile" ON child_profiles;

CREATE POLICY "Users can access own child profile" ON child_profiles
  FOR ALL USING (
    provider_user_id = auth.uid()::text
  );

-- Allow users to insert their own child profile
CREATE POLICY "Users can create own child profile" ON child_profiles
  FOR INSERT WITH CHECK (
    provider_user_id = auth.uid()::text
  );
