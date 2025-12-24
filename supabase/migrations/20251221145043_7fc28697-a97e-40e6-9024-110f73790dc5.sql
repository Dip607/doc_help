-- Remove document sharing feature from backend

-- 1) Update can_view_document to no longer reference document_shares
CREATE OR REPLACE FUNCTION public.can_view_document(_doc_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = _doc_id
      AND d.organization_id = public.get_user_organization(_user_id)
  )
$function$;

-- 2) Simplify documents policies to org-based access (no sharing)
DROP POLICY IF EXISTS "Users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Editors can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Editors can delete documents" ON public.documents;

CREATE POLICY "Org members can view documents"
ON public.documents
FOR SELECT
USING (
  public.is_approved(auth.uid())
  AND organization_id = public.get_user_organization(auth.uid())
);

CREATE POLICY "Editors can upload documents"
ON public.documents
FOR INSERT
WITH CHECK (
  public.is_approved(auth.uid())
  AND organization_id = public.get_user_organization(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role))
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Editors can delete documents"
ON public.documents
FOR DELETE
USING (
  public.is_approved(auth.uid())
  AND organization_id = public.get_user_organization(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role))
);

-- 3) Drop document_shares table (feature not used)
DROP TABLE IF EXISTS public.document_shares;