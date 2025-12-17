-- Add unique constraint on user_id for personal_content table
ALTER TABLE public.personal_content ADD CONSTRAINT personal_content_user_id_key UNIQUE (user_id);