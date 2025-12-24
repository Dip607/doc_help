-- Create announcements table for org-wide messages
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcement replies table
CREATE TABLE public.announcement_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_replies ENABLE ROW LEVEL SECURITY;

-- Announcements policies
-- All approved org members can view
CREATE POLICY "Org members can view announcements"
ON public.announcements FOR SELECT
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND is_approved(auth.uid())
);

-- Only admins can create announcements
CREATE POLICY "Admins can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND created_by = auth.uid()
);

-- Only admins can update their own announcements
CREATE POLICY "Admins can update their announcements"
ON public.announcements FOR UPDATE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND created_by = auth.uid()
);

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
ON public.announcements FOR DELETE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Replies policies
-- All approved org members can view replies
CREATE POLICY "Org members can view replies"
ON public.announcement_replies FOR SELECT
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND is_approved(auth.uid())
);

-- All approved org members can reply
CREATE POLICY "Org members can create replies"
ON public.announcement_replies FOR INSERT
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) 
  AND is_approved(auth.uid())
  AND user_id = auth.uid()
);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
ON public.announcement_replies FOR DELETE
USING (
  user_id = auth.uid() 
  AND is_approved(auth.uid())
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_replies;

-- Add updated_at trigger for announcements
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();