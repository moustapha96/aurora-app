-- Add image_url column to sports_hobbies table
ALTER TABLE sports_hobbies 
ADD COLUMN IF NOT EXISTS image_url text;