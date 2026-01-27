-- Fix RLS policies for marketplace_payments to allow edge function inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can insert payments" ON public.marketplace_payments;
DROP POLICY IF EXISTS "Service role can update payments" ON public.marketplace_payments;

-- Allow authenticated users to insert their own payments (as buyer)
CREATE POLICY "Buyers can insert their own payments"
  ON public.marketplace_payments
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Allow service role to insert (bypasses RLS when using service role key)
CREATE POLICY "Service role can insert payments"
  ON public.marketplace_payments
  FOR INSERT
  WITH CHECK (true);

-- Allow service role to update (for webhook)
CREATE POLICY "Service role can update payments"
  ON public.marketplace_payments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Also allow users to view payments where they are buyer or seller
DROP POLICY IF EXISTS "Users can view their own payments" ON public.marketplace_payments;
CREATE POLICY "Users can view their own payments"
  ON public.marketplace_payments
  FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);