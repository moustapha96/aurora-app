-- Add main_image_url to business_content for the main business image
ALTER TABLE public.business_content
ADD COLUMN IF NOT EXISTS main_image_url TEXT;

-- Add images array to business_projects for project photos (max 10)
ALTER TABLE public.business_projects
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN public.business_content.main_image_url IS 'Main business profile image (max 2MB)';
COMMENT ON COLUMN public.business_projects.images IS 'Array of project images (max 10 images, each max 2MB)';