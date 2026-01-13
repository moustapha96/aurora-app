-- Update generate_account_number function to handle linked accounts (AI prefix)
CREATE OR REPLACE FUNCTION public.generate_account_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_month TEXT;
  v_year TEXT;
  v_sequential_number INTEGER;
  v_account_number TEXT;
  v_prefix TEXT := 'AU';
BEGIN
  -- Get current month (2 digits) and year (2 last digits)
  v_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  v_year := LPAD((EXTRACT(YEAR FROM NOW()) % 100)::TEXT, 2, '0');
  
  -- Count how many users were created in the same month/year (including the current one being inserted)
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO v_sequential_number
  FROM public.profiles
  WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Generate account number: AU + sequential_number (3 digits) + month (2 digits) + year (2 digits)
  v_account_number := v_prefix || LPAD(v_sequential_number::TEXT, 3, '0') || v_month || v_year;
  
  RETURN v_account_number;
END;
$function$;

-- Create function to generate account number with prefix parameter
CREATE OR REPLACE FUNCTION public.generate_account_number_with_prefix(p_is_linked_account boolean)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_month TEXT;
  v_year TEXT;
  v_sequential_number INTEGER;
  v_account_number TEXT;
  v_prefix TEXT;
BEGIN
  -- Set prefix based on account type
  IF p_is_linked_account = true THEN
    v_prefix := 'AI';
  ELSE
    v_prefix := 'AU';
  END IF;

  -- Get current month (2 digits) and year (2 last digits)
  v_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  v_year := LPAD((EXTRACT(YEAR FROM NOW()) % 100)::TEXT, 2, '0');
  
  -- Count how many users were created in the same month/year (including the current one being inserted)
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO v_sequential_number
  FROM public.profiles
  WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Generate account number: prefix + sequential_number (3 digits) + month (2 digits) + year (2 digits)
  v_account_number := v_prefix || LPAD(v_sequential_number::TEXT, 3, '0') || v_month || v_year;
  
  RETURN v_account_number;
END;
$function$;

-- Update trigger to use the new function with prefix
CREATE OR REPLACE FUNCTION public.set_account_number_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only set if account_number is not already provided
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := public.generate_account_number_with_prefix(COALESCE(NEW.is_linked_account, false));
  END IF;
  RETURN NEW;
END;
$function$;

-- Add access permissions columns to linked_accounts table
ALTER TABLE public.linked_accounts 
ADD COLUMN IF NOT EXISTS business_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS family_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS personal_access boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS network_access boolean DEFAULT true;