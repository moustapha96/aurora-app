-- Create marketplace_items table
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  main_image_url TEXT,
  additional_images TEXT[] DEFAULT '{}',
  offer_end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active marketplace items"
ON public.marketplace_items
FOR SELECT
USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create items"
ON public.marketplace_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
ON public.marketplace_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
ON public.marketplace_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_marketplace_items_updated_at
BEFORE UPDATE ON public.marketplace_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view marketplace images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-images');

CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marketplace-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their marketplace images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'marketplace-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their marketplace images"
ON storage.objects FOR DELETE
USING (bucket_id = 'marketplace-images' AND auth.role() = 'authenticated');

-- Enable realtime for marketplace
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_items;