-- Update the most recent profile to admin role (for the user who just registered)
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'admin@stuwflex.nl' OR email LIKE '%admin%' 
   OR created_at = (SELECT MAX(created_at) FROM public.profiles);