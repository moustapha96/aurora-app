-- Add unique constraint on user_id for network_content table to support upsert operations
ALTER TABLE public.network_content ADD CONSTRAINT network_content_user_id_key UNIQUE (user_id);