-- Fix the handle_new_user function to properly cast status to user_status enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
  is_first_user BOOLEAN;
  user_status_value user_status;
BEGIN
  -- Get organization name from metadata
  org_name := NEW.raw_user_meta_data ->> 'organization_name';
  
  IF org_name IS NULL OR org_name = '' THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;
  
  -- Check if organization exists
  SELECT id INTO org_id FROM public.organizations WHERE name = org_name;
  
  IF org_id IS NULL THEN
    -- Create new organization
    INSERT INTO public.organizations (name) VALUES (org_name) RETURNING id INTO org_id;
    is_first_user := TRUE;
  ELSE
    is_first_user := FALSE;
  END IF;
  
  -- Set status based on whether first user
  IF is_first_user THEN
    user_status_value := 'approved'::user_status;
  ELSE
    user_status_value := 'pending'::user_status;
  END IF;
  
  -- Create profile with proper enum cast
  INSERT INTO public.profiles (id, email, full_name, organization_id, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    org_id,
    user_status_value
  );
  
  -- If first user, make them admin
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;