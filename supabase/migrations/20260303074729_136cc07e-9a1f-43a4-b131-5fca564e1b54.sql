
-- Add profile_image_base64 column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_image_base64 text;

-- Use a validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_profile_image_base64_size()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_image_base64 IS NOT NULL AND char_length(NEW.profile_image_base64) >= 2000000 THEN
    RAISE EXCEPTION 'profile_image_base64 exceeds maximum size of 2MB';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_profile_image_base64_size
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_image_base64_size();
