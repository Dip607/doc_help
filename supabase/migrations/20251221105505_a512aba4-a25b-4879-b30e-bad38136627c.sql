-- Create function to increment documents used
CREATE OR REPLACE FUNCTION public.increment_documents_used(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET documents_used = documents_used + 1
  WHERE organization_id = org_id;
END;
$$;