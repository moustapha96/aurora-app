-- 1. Add document_url column to family_commitments for engagement files
ALTER TABLE public.family_commitments
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- 2. Create family_audio table for audio files (max 5MB)
CREATE TABLE IF NOT EXISTS public.family_audio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  duration_seconds INTEGER,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on family_audio
ALTER TABLE public.family_audio ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_audio
CREATE POLICY "Users can view their own audio files"
ON public.family_audio FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audio files"
ON public.family_audio FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio files"
ON public.family_audio FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio files"
ON public.family_audio FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger for family_audio
CREATE TRIGGER update_family_audio_updated_at
BEFORE UPDATE ON public.family_audio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();