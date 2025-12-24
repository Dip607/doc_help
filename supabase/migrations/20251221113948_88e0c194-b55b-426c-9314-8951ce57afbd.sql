-- Fix 1: Update storage policies to include organization isolation
-- First, drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Editors can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Editors can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete their documents" ON storage.objects;

-- Create new policies with organization isolation
CREATE POLICY "Org members can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND public.is_approved(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.storage_path = storage.objects.name
    AND d.organization_id = public.get_user_organization(auth.uid())
  )
);

CREATE POLICY "Org members can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND public.is_approved(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role))
);

CREATE POLICY "Org members can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND public.is_approved(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role))
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.storage_path = storage.objects.name
    AND d.organization_id = public.get_user_organization(auth.uid())
  )
);

-- Fix 2: Update increment_documents_used function to only allow service role access
CREATE OR REPLACE FUNCTION public.increment_documents_used(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow calls from service role (Edge Functions)
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: function can only be called by service role';
  END IF;
  
  UPDATE public.subscriptions
  SET documents_used = documents_used + 1
  WHERE organization_id = org_id;
END;
$$;