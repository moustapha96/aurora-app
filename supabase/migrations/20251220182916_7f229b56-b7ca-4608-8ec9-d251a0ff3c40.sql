-- Table pour tracker les vérifications de documents (tous types)
CREATE TABLE public.document_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'family_document', 'identity_document', 'business_document'
  document_id UUID NOT NULL, -- ID du document dans la table source
  document_path TEXT, -- Chemin du fichier dans storage
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'review_needed', 'in_progress'
  verification_result JSONB,
  rejection_reason TEXT,
  verified_by UUID, -- Admin qui a vérifié
  verified_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les notifications utilisateurs
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'document_verified', 'document_rejected', 'document_review'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_document_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les batch de vérification admin
CREATE TABLE public.verification_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  total_documents INTEGER DEFAULT 0,
  verified_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_verifications
-- Users can view their own document verifications
CREATE POLICY "Users can view own document verifications"
ON public.document_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all document verifications
CREATE POLICY "Admins can view all document verifications"
ON public.document_verifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert document verifications
CREATE POLICY "Admins can insert document verifications"
ON public.document_verifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update document verifications
CREATE POLICY "Admins can update document verifications"
ON public.document_verifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete document verifications
CREATE POLICY "Admins can delete document verifications"
ON public.document_verifications
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_notifications
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.user_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for verification_batches
-- Admins can view all batches
CREATE POLICY "Admins can view verification batches"
ON public.verification_batches
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert batches
CREATE POLICY "Admins can insert verification batches"
ON public.verification_batches
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update batches
CREATE POLICY "Admins can update verification batches"
ON public.verification_batches
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_document_verifications_updated_at
BEFORE UPDATE ON public.document_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_document_verifications_user_id ON public.document_verifications(user_id);
CREATE INDEX idx_document_verifications_status ON public.document_verifications(status);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);