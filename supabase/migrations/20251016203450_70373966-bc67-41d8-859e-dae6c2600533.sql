-- Ensure the id column has a proper default value for auto-generation
ALTER TABLE public.sports_hobbies 
ALTER COLUMN id SET DEFAULT gen_random_uuid();