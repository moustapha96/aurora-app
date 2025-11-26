-- First delete duplicates, keeping only the most recent one for each user
DELETE FROM business_content
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM business_content
  ORDER BY user_id, updated_at DESC
);

-- Then add unique constraint on user_id to prevent future duplicates
ALTER TABLE business_content ADD CONSTRAINT business_content_user_id_key UNIQUE (user_id);