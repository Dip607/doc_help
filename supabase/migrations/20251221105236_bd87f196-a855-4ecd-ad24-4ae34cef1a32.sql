-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

-- Create sentiment enum
CREATE TYPE public.sentiment_type AS ENUM ('positive', 'negative', 'neutral');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  documents_used INTEGER NOT NULL DEFAULT 0,
  documents_limit INTEGER NOT NULL DEFAULT 5,
  api_calls_used INTEGER NOT NULL DEFAULT 0,
  api_calls_limit INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_analyses table
CREATE TABLE public.document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  summary TEXT,
  keywords TEXT[],
  sentiment public.sentiment_type,
  sentiment_score NUMERIC(3,2),
  word_count INTEGER,
  reading_time_minutes INTEGER,
  key_topics TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  calls_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS
CREATE POLICY "Users can view their org subscription"
ON public.subscriptions FOR SELECT
USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can update subscription"
ON public.subscriptions FOR UPDATE
USING (
  organization_id = public.get_user_organization(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Documents RLS - all org members can view
CREATE POLICY "Org members can view documents"
ON public.documents FOR SELECT
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.is_approved(auth.uid())
);

-- Editors and Admins can upload documents
CREATE POLICY "Editors can upload documents"
ON public.documents FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization(auth.uid())
  AND public.is_approved(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role))
);

-- Editors and Admins can delete documents
CREATE POLICY "Editors can delete documents"
ON public.documents FOR DELETE
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.is_approved(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role))
);

-- Document analyses RLS
CREATE POLICY "Org members can view analyses"
ON public.document_analyses FOR SELECT
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.is_approved(auth.uid())
);

CREATE POLICY "System can insert analyses"
ON public.document_analyses FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization(auth.uid())
  AND public.is_approved(auth.uid())
);

-- API Keys RLS - Only admins can manage
CREATE POLICY "Admins can view API keys"
ON public.api_keys FOR SELECT
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can create API keys"
ON public.api_keys FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update API keys"
ON public.api_keys FOR UPDATE
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete API keys"
ON public.api_keys FOR DELETE
USING (
  organization_id = public.get_user_organization(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to auto-create subscription when org is created
CREATE OR REPLACE FUNCTION public.create_org_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, documents_limit, api_calls_limit)
  VALUES (NEW.id, 'free'::subscription_plan, 5, 0);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create subscription
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_org_subscription();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Org members can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND public.is_approved(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Org members can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND public.is_approved(auth.uid())
);

CREATE POLICY "Org members can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND public.is_approved(auth.uid())
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role))
);

-- Update timestamps triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();