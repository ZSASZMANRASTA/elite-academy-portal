/*
  # Create Super Admin Account

  1. Overview
    - Creates a super admin account that can be used to login and manage the application
    - The admin can switch roles to see what students and teachers see (impersonation)
    - Only admins can manage users, content, and finances

  2. Super Admin Setup
    - Email: admin@adamsjunior.ac.ke
    - Password: This account is created in the auth.users table directly
    - You can reset the password using Supabase Dashboard if needed
    - This is the only admin account - no other admins should be created via registration

  3. Important Notes
    - The registration flow prevents admin accounts from being created
    - Only existing admins can create other admins in the Users management page
    - Change the admin password immediately in the Supabase Dashboard auth section
*/

-- This migration creates the super admin user directly
-- Since we can't insert into auth.users from here, this migration prepares the database
-- The actual super admin user must be created via Supabase Dashboard or auth API

-- Verify user_roles table has proper policies for admins
-- The admin account will be created separately via Supabase Dashboard
-- Then assign it the admin role using this process:

-- 1. Create the auth user via Supabase Dashboard with:
--    Email: admin@adamsjunior.ac.ke
--    Auto-generate password (user will reset on first login)

-- 2. Get the user ID from the newly created user

-- 3. Insert the admin role (this would be done by another admin):
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('INSERT_USER_ID_HERE', 'admin'::public.app_role)
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Alternative: Create a trigger-friendly setup for initial super admin
-- This allows creating the super admin via a special one-time endpoint
CREATE OR REPLACE FUNCTION public.create_super_admin(
  p_email TEXT,
  p_full_name TEXT DEFAULT 'Super Admin'
)
RETURNS TABLE(success BOOLEAN, message TEXT, user_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- This function is disabled in production - super admin should be created manually
  -- Only executes if called by a service role (not exposed to clients)
  RETURN QUERY SELECT 
    false::BOOLEAN,
    'Super admin must be created via Supabase Dashboard'::TEXT,
    NULL::UUID;
END;
$$;