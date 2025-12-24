-- Create document_comments table
CREATE TABLE public.document_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.document_comments(id) ON DELETE CASCADE,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_document_comments_document_id ON public.document_comments(document_id);
CREATE INDEX idx_document_comments_parent_id ON public.document_comments(parent_id);
CREATE INDEX idx_document_comments_user_id ON public.document_comments(user_id);

-- Enable Row Level Security
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Org members can view comments"
ON public.document_comments
FOR SELECT
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND is_approved(auth.uid())
);

CREATE POLICY "Org members can create comments"
ON public.document_comments
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) 
  AND is_approved(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own comments"
ON public.document_comments
FOR UPDATE
USING (
  user_id = auth.uid() 
  AND is_approved(auth.uid())
);

CREATE POLICY "Editors can resolve comments"
ON public.document_comments
FOR UPDATE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND is_approved(auth.uid())
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Users can delete their own comments"
ON public.document_comments
FOR DELETE
USING (
  user_id = auth.uid() 
  AND is_approved(auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_document_comments_updated_at
BEFORE UPDATE ON public.document_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_comments;