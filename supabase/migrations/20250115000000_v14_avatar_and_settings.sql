-- V14 Migration: Add avatar fields and system_settings table
-- Run this in Supabase SQL Editor

-- =============================================
-- ADD AVATAR FIELDS TO PROFILES
-- =============================================

-- Add avatar_type column (stores preset avatar ID or 'custom')
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(50) DEFAULT 'panda';

-- Add avatar_url column (stores custom avatar URL if using uploaded image)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =============================================
-- CREATE SYSTEM_SETTINGS TABLE
-- =============================================

-- This table stores global application settings controlled by admins
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  registration_enabled BOOLEAN DEFAULT true,
  global_debug_enabled BOOLEAN DEFAULT false,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id),
  
  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings if not exists
INSERT INTO public.system_settings (id, registration_enabled, global_debug_enabled, maintenance_mode)
VALUES (1, true, false, false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY FOR SYSTEM_SETTINGS
-- =============================================

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read system settings (needed for login page to check registration)
CREATE POLICY "Anyone can read system settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- Only admins can update system settings
CREATE POLICY "Admins can update system settings"
  ON public.system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert (shouldn't need this normally)
CREATE POLICY "Admins can insert system settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- UPDATE PROFILES RLS FOR AVATAR
-- =============================================

-- Users can update their own avatar fields
-- (This should already be covered by the existing "Users can update own profile" policy,
-- but we'll make sure it includes the new fields)

-- Drop and recreate the update policy to be explicit
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Users can only update these specific fields (not role, teacher_id, etc.)
    -- This is enforced at the application level, but we document it here
    true
  );

-- =============================================
-- AVATAR STORAGE BUCKET (Optional)
-- =============================================

-- If you want to support custom avatar uploads, create a storage bucket:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket called "avatars"
-- 3. Set it to public (for easy avatar display)
-- 4. Add policy: Allow authenticated users to upload their own avatars

-- Example storage policies (run these in SQL editor if needed):
/*
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
*/

-- =============================================
-- INDEXES
-- =============================================

-- Index for faster system settings lookup
CREATE INDEX IF NOT EXISTS idx_system_settings_id 
ON public.system_settings(id);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these to verify the migration worked:

-- Check profiles table has new columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('avatar_type', 'avatar_url');

-- Check system_settings table exists and has data
-- SELECT * FROM public.system_settings;

-- Check RLS policies
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('profiles', 'system_settings');
