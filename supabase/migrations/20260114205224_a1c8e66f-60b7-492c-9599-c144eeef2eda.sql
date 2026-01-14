-- Create marketplace_payments table for Stripe integration
CREATE TABLE IF NOT EXISTS public.marketplace_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_marketplace_payments_item_id ON public.marketplace_payments(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_payments_buyer_id ON public.marketplace_payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_payments_seller_id ON public.marketplace_payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_payments_status ON public.marketplace_payments(status);

-- Enable RLS
ALTER TABLE public.marketplace_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments (as buyer or seller)
CREATE POLICY "Users can view their own payments"
  ON public.marketplace_payments
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Allow insert from edge functions (service role)
CREATE POLICY "Service role can insert payments"
  ON public.marketplace_payments
  FOR INSERT
  WITH CHECK (true);

-- Allow update from edge functions (service role)
CREATE POLICY "Service role can update payments"
  ON public.marketplace_payments
  FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_payments_updated_at
  BEFORE UPDATE ON public.marketplace_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();