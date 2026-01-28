-- Create subscription tiers configuration table
CREATE TABLE public.subscription_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_key TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  name_de TEXT NOT NULL,
  name_it TEXT NOT NULL,
  name_pt TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  icon_type TEXT NOT NULL DEFAULT 'star',
  color_class TEXT NOT NULL DEFAULT 'text-blue-500',
  bg_color_class TEXT NOT NULL DEFAULT 'bg-blue-500/10',
  border_color_class TEXT NOT NULL DEFAULT 'border-blue-500/30',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can read active tiers
CREATE POLICY "Anyone can view active subscription tiers"
ON public.subscription_tiers
FOR SELECT
USING (is_active = true);

-- Only admins can manage tiers (via service role or RPC)
CREATE POLICY "Admins can manage subscription tiers"
ON public.subscription_tiers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default tiers
INSERT INTO public.subscription_tiers (tier_key, name_fr, name_en, name_es, name_de, name_it, name_pt, name_ar, name_zh, name_ja, name_ru, price, stripe_product_id, stripe_price_id, icon_type, color_class, bg_color_class, border_color_class, display_order)
VALUES 
  ('basic', 'Aurora Basic', 'Aurora Basic', 'Aurora Basic', 'Aurora Basic', 'Aurora Basic', 'Aurora Basic', 'أورورا الأساسي', 'Aurora 基础版', 'Aurora ベーシック', 'Aurora Базовый', 99, 'prod_Ts5GvhKDeIF8EY', 'price_1SuL6E6KBRCqF9l4gO1lbEsR', 'star', 'text-blue-500', 'bg-blue-500/10', 'border-blue-500/30', 1),
  ('premium', 'Aurora Premium', 'Aurora Premium', 'Aurora Premium', 'Aurora Premium', 'Aurora Premium', 'Aurora Premium', 'أورورا المميز', 'Aurora 高级版', 'Aurora プレミアム', 'Aurora Премиум', 199, 'prod_Ts5HvJfkT6hdmB', 'price_1SuL6Z6KBRCqF9l4Yu2vKnLq', 'crown', 'text-gold', 'bg-gold/10', 'border-gold/30', 2),
  ('elite', 'Aurora Elite', 'Aurora Elite', 'Aurora Elite', 'Aurora Elite', 'Aurora Elite', 'Aurora Elite', 'أورورا النخبة', 'Aurora 精英版', 'Aurora エリート', 'Aurora Элитный', 499, 'prod_Ts5HWuRnDhdJ78', 'price_1SuL6vRvR6I3NtPxGX6p9Awp', 'sparkles', 'text-purple-500', 'bg-purple-500/10', 'border-purple-500/30', 3);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_tiers_updated_at
BEFORE UPDATE ON public.subscription_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();