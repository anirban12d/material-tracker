-- Material Request Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. Create Tables
-- ============================================

-- Companies table (for multi-tenancy)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Material Requests table
CREATE TABLE IF NOT EXISTS public.material_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  material_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'm', 'pieces', 'liters', 'tons', 'cubic_meters', 'square_meters')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_material_requests_company_id ON public.material_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON public.material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_priority ON public.material_requests(priority);
CREATE INDEX IF NOT EXISTS idx_material_requests_requested_at ON public.material_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_material_requests_requested_by ON public.material_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS Policies for Companies
-- ============================================

-- Users can view their own company
CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Authenticated users can create companies (for new signups)
CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 5. RLS Policies for Profiles
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

-- Users can create their own profile
CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- ============================================
-- 6. RLS Policies for Projects
-- ============================================

-- Users can view projects in their company
CREATE POLICY "Users can view projects in their company"
  ON public.projects FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Users can create projects in their company
CREATE POLICY "Users can create projects in their company"
  ON public.projects FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 7. RLS Policies for Material Requests
-- ============================================

-- Users can view material requests in their company
CREATE POLICY "Users can view material requests in their company"
  ON public.material_requests FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Users can create material requests in their company
CREATE POLICY "Users can create material requests in their company"
  ON public.material_requests FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
    AND requested_by = (SELECT auth.uid())
  );

-- Users can update material requests in their company
CREATE POLICY "Users can update material requests in their company"
  ON public.material_requests FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- Users can delete their own material requests
CREATE POLICY "Users can delete their own material requests"
  ON public.material_requests FOR DELETE
  USING (
    requested_by = (SELECT auth.uid())
    AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 8. Functions and Triggers
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Create a new company for the user (or use existing company logic)
  INSERT INTO public.companies (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'))
  RETURNING id INTO new_company_id;

  -- Create profile for the new user
  INSERT INTO public.profiles (id, email, full_name, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_company_id
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

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_material_requests_updated_at ON public.material_requests;
CREATE TRIGGER update_material_requests_updated_at
  BEFORE UPDATE ON public.material_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 9. Sample Data (Optional - for testing)
-- ============================================

-- Uncomment the following to insert sample data after creating a user

/*
-- Get a user's company_id (replace USER_ID with actual UUID)
-- INSERT INTO public.projects (name, company_id)
-- SELECT 'Construction Site A', company_id FROM public.profiles WHERE id = 'USER_ID';

-- INSERT INTO public.material_requests (material_name, quantity, unit, priority, requested_by, company_id)
-- SELECT 'Concrete', 500, 'kg', 'high', 'USER_ID', company_id FROM public.profiles WHERE id = 'USER_ID';
*/

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Database migration completed successfully!';
  RAISE NOTICE 'Tables created: companies, profiles, projects, material_requests';
  RAISE NOTICE 'RLS policies enabled for multi-tenancy';
END $$;
