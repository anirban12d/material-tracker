-- Seed file for Material Request Tracker
-- This script inserts 50 sample material requests
--
-- PREREQUISITES: You must have at least one user registered in the system.
-- The script will use the first user found in the profiles table.
--
-- Run this in your Supabase SQL Editor after you have created an account.

-- ============================================
-- Create sample projects first
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_project_1 UUID;
  v_project_2 UUID;
  v_project_3 UUID;
BEGIN
  -- Get the first user and their company
  SELECT id, company_id INTO v_user_id, v_company_id
  FROM public.profiles
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please create an account first before running this seed.';
  END IF;

  -- Create sample projects
  INSERT INTO public.projects (id, name, company_id)
  VALUES
    (gen_random_uuid(), 'Highway Bridge Construction', v_company_id),
    (gen_random_uuid(), 'Commercial Building Phase 2', v_company_id),
    (gen_random_uuid(), 'Residential Complex East Wing', v_company_id)
  ON CONFLICT DO NOTHING;

  -- Get project IDs
  SELECT id INTO v_project_1 FROM public.projects WHERE name = 'Highway Bridge Construction' AND company_id = v_company_id LIMIT 1;
  SELECT id INTO v_project_2 FROM public.projects WHERE name = 'Commercial Building Phase 2' AND company_id = v_company_id LIMIT 1;
  SELECT id INTO v_project_3 FROM public.projects WHERE name = 'Residential Complex East Wing' AND company_id = v_company_id LIMIT 1;

  -- ============================================
  -- Insert 50 material requests
  -- ============================================

  INSERT INTO public.material_requests (project_id, material_name, quantity, unit, status, priority, requested_by, notes, company_id, requested_at)
  VALUES
    -- Concrete & Cement (1-8)
    (v_project_1, 'Portland Cement Type I', 500, 'kg', 'pending', 'high', v_user_id, 'Needed for foundation pour next week', v_company_id, NOW() - INTERVAL '2 days'),
    (v_project_1, 'Ready-Mix Concrete M25', 50, 'cubic_meters', 'approved', 'urgent', v_user_id, 'For bridge deck casting', v_company_id, NOW() - INTERVAL '5 days'),
    (v_project_2, 'Ready-Mix Concrete M30', 75, 'cubic_meters', 'pending', 'high', v_user_id, 'Structural columns floor 3-5', v_company_id, NOW() - INTERVAL '1 day'),
    (v_project_3, 'White Cement', 200, 'kg', 'fulfilled', 'low', v_user_id, 'For decorative finishing', v_company_id, NOW() - INTERVAL '15 days'),
    (v_project_1, 'Rapid Setting Cement', 100, 'kg', 'approved', 'medium', v_user_id, 'Emergency repairs', v_company_id, NOW() - INTERVAL '3 days'),
    (v_project_2, 'Self-Compacting Concrete', 30, 'cubic_meters', 'pending', 'high', v_user_id, 'Complex formwork areas', v_company_id, NOW() - INTERVAL '1 day'),
    (v_project_3, 'Lightweight Concrete', 25, 'cubic_meters', 'rejected', 'low', v_user_id, 'Alternative material selected', v_company_id, NOW() - INTERVAL '20 days'),
    (v_project_1, 'Fiber Reinforced Concrete', 40, 'cubic_meters', 'pending', 'medium', v_user_id, 'For crack-resistant applications', v_company_id, NOW() - INTERVAL '4 days'),

    -- Steel & Reinforcement (9-16)
    (v_project_1, 'TMT Steel Bars 12mm', 5000, 'kg', 'approved', 'urgent', v_user_id, 'Main reinforcement for foundation', v_company_id, NOW() - INTERVAL '7 days'),
    (v_project_2, 'TMT Steel Bars 16mm', 3500, 'kg', 'pending', 'high', v_user_id, 'Column reinforcement', v_company_id, NOW() - INTERVAL '2 days'),
    (v_project_1, 'TMT Steel Bars 20mm', 2000, 'kg', 'fulfilled', 'high', v_user_id, 'Beam reinforcement delivered', v_company_id, NOW() - INTERVAL '10 days'),
    (v_project_3, 'TMT Steel Bars 8mm', 1500, 'kg', 'approved', 'medium', v_user_id, 'Stirrups and ties', v_company_id, NOW() - INTERVAL '6 days'),
    (v_project_2, 'Steel Wire Mesh', 500, 'square_meters', 'pending', 'medium', v_user_id, 'Slab reinforcement', v_company_id, NOW() - INTERVAL '3 days'),
    (v_project_1, 'Binding Wire', 200, 'kg', 'approved', 'low', v_user_id, 'For tying rebars', v_company_id, NOW() - INTERVAL '8 days'),
    (v_project_3, 'Structural Steel I-Beam', 2500, 'kg', 'pending', 'high', v_user_id, 'Roof support structure', v_company_id, NOW() - INTERVAL '1 day'),
    (v_project_2, 'Steel Plates 10mm', 800, 'kg', 'fulfilled', 'medium', v_user_id, 'Connection plates', v_company_id, NOW() - INTERVAL '12 days'),

    -- Aggregates & Sand (17-22)
    (v_project_1, 'Coarse Aggregate 20mm', 100, 'tons', 'approved', 'high', v_user_id, 'For concrete mixing', v_company_id, NOW() - INTERVAL '4 days'),
    (v_project_2, 'Fine Aggregate (Sand)', 80, 'tons', 'pending', 'high', v_user_id, 'Plastering and concrete', v_company_id, NOW() - INTERVAL '2 days'),
    (v_project_3, 'River Sand', 50, 'tons', 'fulfilled', 'medium', v_user_id, 'Masonry work', v_company_id, NOW() - INTERVAL '18 days'),
    (v_project_1, 'Crushed Stone 40mm', 75, 'tons', 'pending', 'medium', v_user_id, 'Base layer material', v_company_id, NOW() - INTERVAL '5 days'),
    (v_project_2, 'M-Sand (Manufactured Sand)', 60, 'tons', 'approved', 'high', v_user_id, 'Alternative to river sand', v_company_id, NOW() - INTERVAL '3 days'),
    (v_project_3, 'Gravel', 40, 'tons', 'pending', 'low', v_user_id, 'Drainage layer', v_company_id, NOW() - INTERVAL '6 days'),

    -- Bricks & Blocks (23-28)
    (v_project_3, 'Red Clay Bricks', 10000, 'pieces', 'approved', 'high', v_user_id, 'External wall construction', v_company_id, NOW() - INTERVAL '5 days'),
    (v_project_2, 'AAC Blocks 600x200x200', 5000, 'pieces', 'pending', 'high', v_user_id, 'Internal partitions', v_company_id, NOW() - INTERVAL '2 days'),
    (v_project_3, 'Fly Ash Bricks', 8000, 'pieces', 'fulfilled', 'medium', v_user_id, 'Eco-friendly option', v_company_id, NOW() - INTERVAL '14 days'),
    (v_project_2, 'Concrete Hollow Blocks', 3000, 'pieces', 'approved', 'medium', v_user_id, 'Compound wall', v_company_id, NOW() - INTERVAL '7 days'),
    (v_project_1, 'Solid Concrete Blocks', 2000, 'pieces', 'pending', 'low', v_user_id, 'Retaining wall', v_company_id, NOW() - INTERVAL '4 days'),
    (v_project_3, 'Glass Blocks', 500, 'pieces', 'rejected', 'low', v_user_id, 'Design changed', v_company_id, NOW() - INTERVAL '25 days'),

    -- Timber & Wood (29-33)
    (v_project_2, 'Plywood 18mm BWR', 200, 'pieces', 'approved', 'high', v_user_id, 'Formwork shuttering', v_company_id, NOW() - INTERVAL '6 days'),
    (v_project_3, 'Teak Wood Planks', 500, 'm', 'pending', 'medium', v_user_id, 'Door and window frames', v_company_id, NOW() - INTERVAL '3 days'),
    (v_project_1, 'Scaffolding Timber', 300, 'pieces', 'fulfilled', 'high', v_user_id, 'Temporary works', v_company_id, NOW() - INTERVAL '20 days'),
    (v_project_2, 'Marine Plywood', 100, 'pieces', 'pending', 'medium', v_user_id, 'Wet area formwork', v_company_id, NOW() - INTERVAL '2 days'),
    (v_project_3, 'Sal Wood Beams', 50, 'pieces', 'approved', 'low', v_user_id, 'Decorative ceiling', v_company_id, NOW() - INTERVAL '10 days'),

    -- Waterproofing & Chemicals (34-38)
    (v_project_1, 'Bitumen 60/70 Grade', 500, 'liters', 'approved', 'high', v_user_id, 'Waterproofing for deck', v_company_id, NOW() - INTERVAL '4 days'),
    (v_project_2, 'Waterproofing Membrane', 1000, 'square_meters', 'pending', 'high', v_user_id, 'Basement waterproofing', v_company_id, NOW() - INTERVAL '1 day'),
    (v_project_3, 'Concrete Admixture', 200, 'liters', 'fulfilled', 'medium', v_user_id, 'Plasticizer for workability', v_company_id, NOW() - INTERVAL '16 days'),
    (v_project_1, 'Epoxy Coating', 100, 'liters', 'pending', 'medium', v_user_id, 'Rebar protection', v_company_id, NOW() - INTERVAL '5 days'),
    (v_project_2, 'Curing Compound', 150, 'liters', 'approved', 'low', v_user_id, 'Concrete curing', v_company_id, NOW() - INTERVAL '8 days'),

    -- Pipes & Fittings (39-43)
    (v_project_3, 'PVC Pipes 4 inch', 500, 'm', 'pending', 'high', v_user_id, 'Drainage system', v_company_id, NOW() - INTERVAL '2 days'),
    (v_project_2, 'CPVC Pipes 1 inch', 300, 'm', 'approved', 'medium', v_user_id, 'Hot water supply', v_company_id, NOW() - INTERVAL '5 days'),
    (v_project_3, 'GI Pipes 2 inch', 200, 'm', 'fulfilled', 'medium', v_user_id, 'Fire fighting system', v_company_id, NOW() - INTERVAL '22 days'),
    (v_project_1, 'HDPE Pipes 6 inch', 400, 'm', 'pending', 'high', v_user_id, 'Storm water drainage', v_company_id, NOW() - INTERVAL '3 days'),
    (v_project_2, 'Copper Pipes 15mm', 150, 'm', 'rejected', 'low', v_user_id, 'Changed to CPVC', v_company_id, NOW() - INTERVAL '30 days'),

    -- Electrical (44-47)
    (v_project_3, 'Electrical Conduit 25mm', 1000, 'm', 'approved', 'high', v_user_id, 'Concealed wiring', v_company_id, NOW() - INTERVAL '4 days'),
    (v_project_2, 'Copper Wire 4 sqmm', 2000, 'm', 'pending', 'high', v_user_id, 'Power distribution', v_company_id, NOW() - INTERVAL '1 day'),
    (v_project_3, 'Distribution Boards', 50, 'pieces', 'pending', 'medium', v_user_id, 'Each apartment unit', v_company_id, NOW() - INTERVAL '3 days'),
    (v_project_1, 'Armored Cable 35mm', 500, 'm', 'approved', 'urgent', v_user_id, 'Main power supply', v_company_id, NOW() - INTERVAL '2 days'),

    -- Finishing Materials (48-50)
    (v_project_3, 'Ceramic Floor Tiles 600x600', 2000, 'square_meters', 'pending', 'medium', v_user_id, 'Living room flooring', v_company_id, NOW() - INTERVAL '4 days'),
    (v_project_2, 'Wall Primer', 500, 'liters', 'approved', 'low', v_user_id, 'Interior wall preparation', v_company_id, NOW() - INTERVAL '6 days'),
    (v_project_3, 'Exterior Emulsion Paint', 300, 'liters', 'pending', 'low', v_user_id, 'Building facade - Phase 1', v_company_id, NOW() - INTERVAL '5 days');

  RAISE NOTICE 'Successfully inserted 50 material requests!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Projects created: Highway Bridge Construction, Commercial Building Phase 2, Residential Complex East Wing';
END $$;
