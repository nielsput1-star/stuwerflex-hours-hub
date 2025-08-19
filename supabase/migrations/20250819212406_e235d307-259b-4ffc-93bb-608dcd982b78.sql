-- Create admin user account
-- First, we need to insert into auth.users (this is typically done via Supabase Auth API)
-- For testing purposes, let's create a profile entry that can be linked to a manually created user

-- Insert a test admin profile (you'll need to create the actual auth user via Supabase dashboard or signup)
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  role,
  employee_number,
  phone
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Placeholder UUID - replace with actual user_id after creating auth user
  'admin@stuwflex.nl',
  'Admin',
  'User',
  'admin',
  'EMP000001',
  '+31612345678'
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  email = 'admin@stuwflex.nl',
  first_name = 'Admin',
  last_name = 'User',
  employee_number = 'EMP000001';

-- Also create an employee record for the admin
INSERT INTO public.employees (
  profile_id,
  hire_date,
  status,
  hourly_rate
) VALUES (
  (SELECT id FROM public.profiles WHERE email = 'admin@stuwflex.nl'),
  CURRENT_DATE,
  'active',
  50.00
) ON CONFLICT DO NOTHING;