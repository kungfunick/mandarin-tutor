-- Mandarin Tutor Database Schema
-- Version: 1.0.0
-- Description: Initial schema with all tables and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher ON public.profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

-- =============================================
-- STUDY GUIDES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.study_guides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  conversation_count INTEGER DEFAULT 0,
  vocabulary_mastered INTEGER DEFAULT 0,
  fluency_score INTEGER DEFAULT 0,
  strengths TEXT[],
  weaknesses TEXT[],
  goals JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for study guides
CREATE INDEX IF NOT EXISTS idx_study_guides_user ON public.study_guides(user_id);

-- =============================================
-- OBSERVATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.observations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for observations
CREATE INDEX IF NOT EXISTS idx_observations_student ON public.observations(student_id);
CREATE INDEX IF NOT EXISTS idx_observations_teacher ON public.observations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_observations_created ON public.observations(created_at DESC);

-- =============================================
-- LEARNING MATERIALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.learning_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  is_global BOOLEAN DEFAULT false,
  student_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for learning materials
CREATE INDEX IF NOT EXISTS idx_materials_teacher ON public.learning_materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_global ON public.learning_materials(is_global);
CREATE INDEX IF NOT EXISTS idx_materials_created ON public.learning_materials(created_at DESC);

-- =============================================
-- AREAS TO IMPROVE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.areas_to_improve (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  area TEXT NOT NULL,
  details TEXT,
  suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for areas to improve
CREATE INDEX IF NOT EXISTS idx_improvements_student ON public.areas_to_improve(student_id);
CREATE INDEX IF NOT EXISTS idx_improvements_teacher ON public.areas_to_improve(teacher_id);
CREATE INDEX IF NOT EXISTS idx_improvements_created ON public.areas_to_improve(created_at DESC);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('normal', 'important', 'urgent')) DEFAULT 'normal',
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_teacher ON public.announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_announcements_global ON public.announcements(is_global);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

-- =============================================
-- CONVERSATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  messages JSONB NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON public.conversations(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_to_improve ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own display_name and email
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Teachers can read their students' profiles
CREATE POLICY "Teachers can read students"
  ON public.profiles FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Admins can do everything with profiles
CREATE POLICY "Admins full access to profiles"
  ON public.profiles
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- STUDY GUIDES POLICIES
-- =============================================

-- Students can read their own study guide
CREATE POLICY "Students can read own guide"
  ON public.study_guides FOR SELECT
  USING (user_id = auth.uid());

-- Students can insert their own study guide
CREATE POLICY "Students can create own guide"
  ON public.study_guides FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Students can update their own study guide
CREATE POLICY "Students can update own guide"
  ON public.study_guides FOR UPDATE
  USING (user_id = auth.uid());

-- Teachers can read their students' guides
CREATE POLICY "Teachers can read student guides"
  ON public.study_guides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_id AND teacher_id = auth.uid()
    )
  );

-- Teachers can update their students' guides
CREATE POLICY "Teachers can update student guides"
  ON public.study_guides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_id AND teacher_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins full access to guides"
  ON public.study_guides
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- OBSERVATIONS POLICIES
-- =============================================

-- Students can read observations about themselves
CREATE POLICY "Students can read own observations"
  ON public.observations FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can read observations they created
CREATE POLICY "Teachers can read own observations"
  ON public.observations FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can create observations for their students
CREATE POLICY "Teachers can create observations"
  ON public.observations FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = student_id AND teacher_id = auth.uid()
    )
  );

-- Teachers can delete their own observations
CREATE POLICY "Teachers can delete own observations"
  ON public.observations FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to observations"
  ON public.observations
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- LEARNING MATERIALS POLICIES
-- =============================================

-- Students can read global materials or materials assigned to them
CREATE POLICY "Students can read assigned materials"
  ON public.learning_materials FOR SELECT
  USING (
    is_global = true OR
    auth.uid() = ANY(student_ids)
  );

-- Teachers can read their own materials
CREATE POLICY "Teachers can read own materials"
  ON public.learning_materials FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can create materials
CREATE POLICY "Teachers can create materials"
  ON public.learning_materials FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own materials
CREATE POLICY "Teachers can update own materials"
  ON public.learning_materials FOR UPDATE
  USING (teacher_id = auth.uid());

-- Teachers can delete their own materials
CREATE POLICY "Teachers can delete own materials"
  ON public.learning_materials FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to materials"
  ON public.learning_materials
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- AREAS TO IMPROVE POLICIES
-- =============================================

-- Students can read their own improvement areas
CREATE POLICY "Students can read own improvements"
  ON public.areas_to_improve FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can read improvement areas for their students
CREATE POLICY "Teachers can read student improvements"
  ON public.areas_to_improve FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = student_id AND teacher_id = auth.uid()
    )
  );

-- Teachers can create improvement areas for their students
CREATE POLICY "Teachers can create improvements"
  ON public.areas_to_improve FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = student_id AND teacher_id = auth.uid()
    )
  );

-- Teachers can delete their own improvement areas
CREATE POLICY "Teachers can delete own improvements"
  ON public.areas_to_improve FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to improvements"
  ON public.areas_to_improve
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ANNOUNCEMENTS POLICIES
-- =============================================

-- Students can read global announcements from their teacher
CREATE POLICY "Students can read announcements"
  ON public.announcements FOR SELECT
  USING (
    is_global = true AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND teacher_id = announcements.teacher_id
    )
  );

-- Teachers can read their own announcements
CREATE POLICY "Teachers can read own announcements"
  ON public.announcements FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can create announcements
CREATE POLICY "Teachers can create announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can delete their own announcements
CREATE POLICY "Teachers can delete own announcements"
  ON public.announcements FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to announcements"
  ON public.announcements
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- CONVERSATIONS POLICIES
-- =============================================

-- Users can read their own conversations
CREATE POLICY "Users can read own conversations"
  ON public.conversations FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own conversations
CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (user_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to conversations"
  ON public.conversations
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for study_guides
DROP TRIGGER IF EXISTS update_study_guides_updated_at ON public.study_guides;
CREATE TRIGGER update_study_guides_updated_at
  BEFORE UPDATE ON public.study_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================

-- Note: To insert seed data, you need to create auth users first via Supabase Auth API
-- Then you can manually insert profiles here with matching IDs

-- Example seed data would go here after auth users are created
-- INSERT INTO public.profiles (id, email, display_name, role) VALUES (...);
