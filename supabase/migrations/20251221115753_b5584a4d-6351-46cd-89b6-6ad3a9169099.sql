-- Add 'deactivated' value to user_status enum
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'deactivated';

-- Update is_approved function to also check for deactivation
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND status = 'approved'
  )
$$;