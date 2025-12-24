-- Fix infinite recursion between documents and document_shares RLS policies

-- Helper: check if a user is the owner/uploader of a document
CREATE OR REPLACE FUNCTION public.is_document_owner(_doc_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = _doc_id
      AND d.uploaded_by = _user_id
  )
$$;

-- Helper: check if a user can view a document (same org OR explicitly shared)
CREATE OR REPLACE FUNCTION public.can_view_document(_doc_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = _doc_id
        AND d.organization_id = public.get_user_organization(_user_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.document_shares s
      WHERE s.document_id = _doc_id
        AND s.shared_with_user_id = _user_id
    )
$$;

GRANT EXECUTE ON FUNCTION public.is_document_owner(uuid, uuid) TO public;
GRANT EXECUTE ON FUNCTION public.can_view_document(uuid, uuid) TO public;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Users can view org documents or shared documents" ON public.documents;
DROP POLICY IF EXISTS "Editors can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Editors can delete documents" ON public.documents;

DROP POLICY IF EXISTS "Users can view document shares" ON public.document_shares;
DROP POLICY IF EXISTS "Editors can share their documents" ON public.document_shares;
DROP POLICY IF EXISTS "Owners can update shares" ON public.document_shares;
DROP POLICY IF EXISTS "Owners can delete shares" ON public.document_shares;

-- Recreate non-recursive documents policies
CREATE POLICY "Users can view documents"
ON public.documents
FOR SELECT
TO public
USING (
  is_approved(auth.uid())
  AND public.can_view_document(id, auth.uid())
);

CREATE POLICY "Editors can upload documents"
ON public.documents
FOR INSERT
TO public
WITH CHECK (
  (organization_id = public.get_user_organization(auth.uid()))
  AND is_approved(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  )
);

CREATE POLICY "Editors can delete documents"
ON public.documents
FOR DELETE
TO public
USING (
  (organization_id = public.get_user_organization(auth.uid()))
  AND is_approved(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  )
);

-- Recreate non-recursive document_shares policies
CREATE POLICY "Users can view document shares"
ON public.document_shares
FOR SELECT
TO public
USING (
  (organization_id = public.get_user_organization(auth.uid()))
  AND is_approved(auth.uid())
  AND (
    shared_with_user_id = auth.uid()
    OR shared_by_user_id = auth.uid()
    OR public.is_document_owner(document_id, auth.uid())
  )
);

CREATE POLICY "Editors can share their documents"
ON public.document_shares
FOR INSERT
TO public
WITH CHECK (
  (organization_id = public.get_user_organization(auth.uid()))
  AND is_approved(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  )
  AND shared_by_user_id = auth.uid()
  AND public.is_document_owner(document_id, auth.uid())
);

CREATE POLICY "Owners can update shares"
ON public.document_shares
FOR UPDATE
TO public
USING (
  (organization_id = public.get_user_organization(auth.uid()))
  AND public.is_document_owner(document_id, auth.uid())
)
WITH CHECK (
  (organization_id = public.get_user_organization(auth.uid()))
  AND public.is_document_owner(document_id, auth.uid())
);

CREATE POLICY "Owners can delete shares"
ON public.document_shares
FOR DELETE
TO public
USING (
  (organization_id = public.get_user_organization(auth.uid()))
  AND (
    shared_by_user_id = auth.uid()
    OR public.is_document_owner(document_id, auth.uid())
  )
);
