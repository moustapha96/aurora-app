-- =============================================
-- FAMILY SECTION REFACTORING - NEW TABLES
-- =============================================

-- Table: family_lineage (Lignée & Origines)
CREATE TABLE public.family_lineage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generation TEXT NOT NULL, -- ex: "Grand-parents paternels", "Parents", "Moi"
  member_name TEXT NOT NULL,
  title TEXT, -- ex: "Comte de...", "Industriel"
  origin_location TEXT, -- ex: "Bordeaux, France"
  birth_year TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_lineage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lineage" ON public.family_lineage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lineage" ON public.family_lineage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lineage" ON public.family_lineage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lineage" ON public.family_lineage FOR DELETE USING (auth.uid() = user_id);

-- Table: family_close (Famille proche)
CREATE TABLE public.family_close (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  relation_type TEXT NOT NULL, -- ex: "Épouse", "Fils", "Fille"
  member_name TEXT NOT NULL,
  birth_year TEXT,
  occupation TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_close ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own close family" ON public.family_close FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own close family" ON public.family_close FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own close family" ON public.family_close FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own close family" ON public.family_close FOR DELETE USING (auth.uid() = user_id);

-- Table: family_influential (Personnes marquantes)
CREATE TABLE public.family_influential (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  relationship TEXT, -- ex: "Mentor", "Ami proche", "Parrain"
  context TEXT, -- ex: "Art", "Business", "Politique"
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_influential ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own influential people" ON public.family_influential FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own influential people" ON public.family_influential FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own influential people" ON public.family_influential FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own influential people" ON public.family_influential FOR DELETE USING (auth.uid() = user_id);

-- Table: family_board (Réseau clé / Board personnel)
CREATE TABLE public.family_board (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  role TEXT NOT NULL, -- ex: "Conseiller financier", "Avocat", "Directeur artistique"
  organization TEXT,
  expertise TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_board ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own board" ON public.family_board FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own board" ON public.family_board FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own board" ON public.family_board FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own board" ON public.family_board FOR DELETE USING (auth.uid() = user_id);

-- Table: family_commitments (Engagements familiaux)
CREATE TABLE public.family_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT, -- ex: "Philanthropie", "Éducation", "Patrimoine"
  description TEXT,
  organization TEXT,
  start_year TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commitments" ON public.family_commitments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own commitments" ON public.family_commitments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own commitments" ON public.family_commitments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own commitments" ON public.family_commitments FOR DELETE USING (auth.uid() = user_id);

-- Table: family_heritage (Héritage & Transmission)
CREATE TABLE public.family_heritage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  motto TEXT, -- Devise familiale
  values_text TEXT, -- Valeurs transmises
  legacy_vision TEXT, -- Vision de transmission
  heritage_description TEXT,
  banner_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_heritage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own heritage" ON public.family_heritage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own heritage" ON public.family_heritage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own heritage" ON public.family_heritage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own heritage" ON public.family_heritage FOR DELETE USING (auth.uid() = user_id);

-- Add onboarding fields to family_content
ALTER TABLE public.family_content 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_mode TEXT;