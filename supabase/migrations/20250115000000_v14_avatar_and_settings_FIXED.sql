-- V14 Migration: Add avatar fields and system_settings table
-- Run this in Supabase SQL Editor
-- FIXED VERSION - Proper execution order

-- =============================================
-- STEP 1: ADD AVATAR FIELDS TO PROFILES
-- =============================================

-- Add avatar_type column (stores preset avatar ID or 'custom')
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(50) DEFAULT 'panda';

-- Add avatar_url column (stores custom avatar URL if using uploaded image)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =============================================
-- STEP 2: CREATE SYSTEM_SETTINGS TABLE
-- =============================================

-- Drop existing table if it exists with wrong schema
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Create fresh system_settings table
CREATE TABLE public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  registration_enabled BOOLEAN DEFAULT true,
  global_debug_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- =============================================
-- STEP 3: INSERT DEFAULT SETTINGS
-- =============================================

INSERT INTO public.system_settings (id, registration_enabled, global_debug_enabled)
VALUES (1, true, false);

-- =============================================
-- STEP 4: ROW LEVEL SECURITY FOR SYSTEM_SETTINGS
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

-- Only admins can insert (for upsert operations)
CREATE POLICY "Admins can insert system settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- STEP 5: INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_system_settings_id 
ON public.system_settings(id);

-- =============================================
-- VERIFICATION
-- =============================================

-- This should show the system_settings row
SELECT * FROM public.system_settings;

-- This should show avatar columns in profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('avatar_type', 'avatar_url');
