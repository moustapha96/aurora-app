-- Add account_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_account_number ON public.profiles(account_number);

-- Function to generate account number: AU + sequential_number + month + year
-- Format: AU1202024 = AU + 1 (first user of the month) + 12 (December) + 2024
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month TEXT;
  v_year TEXT;
  v_sequential_number INTEGER;
  v_account_number TEXT;
BEGIN
  -- Get current month and year
  v_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Count how many users were created in the same month/year (including the current one being inserted)
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO v_sequential_number
  FROM public.profiles
  WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Generate account number: AU + sequential_number + month + year
  v_account_number := 'AU' || v_sequential_number::TEXT || v_month || v_year;
  
  RETURN v_account_number;
END;
$$;

-- Trigger function to automatically set account_number on insert
CREATE OR REPLACE FUNCTION public.set_account_number_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set if account_number is not already provided
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := public.generate_account_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate account_number on insert
DROP TRIGGER IF EXISTS trigger_set_account_number ON public.profiles;
CREATE TRIGGER trigger_set_account_number
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_account_number_on_insert();

-- Backfill existing profiles with account numbers based on their created_at
DO $$
DECLARE
  profile_record RECORD;
  v_month TEXT;
  v_year TEXT;
  v_sequential_number INTEGER;
  v_account_number TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, created_at 
    FROM public.profiles 
    WHERE account_number IS NULL OR account_number = ''
    ORDER BY created_at ASC
  LOOP
    -- Get month and year from created_at
    v_month := LPAD(EXTRACT(MONTH FROM profile_record.created_at)::TEXT, 2, '0');
    v_year := EXTRACT(YEAR FROM profile_record.created_at)::TEXT;
    
    -- Count how many users were created before this one in the same month/year
    SELECT COALESCE(COUNT(*), 0) + 1
    INTO v_sequential_number
    FROM public.profiles
    WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM profile_record.created_at)
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM profile_record.created_at)
      AND created_at <= profile_record.created_at
      AND (account_number IS NOT NULL OR id = profile_record.id);
    
    -- Generate account number
    v_account_number := 'AU' || v_sequential_number::TEXT || v_month || v_year;
    
    -- Update the profile
    UPDATE public.profiles
    SET account_number = v_account_number
    WHERE id = profile_record.id;
  END LOOP;
END $$;