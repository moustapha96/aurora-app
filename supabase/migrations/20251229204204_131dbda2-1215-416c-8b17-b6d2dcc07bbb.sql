-- Create trigger function to handle referral registration completion
CREATE OR REPLACE FUNCTION public.handle_referral_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_link_id uuid;
  v_is_family_link boolean;
  v_sponsor_id uuid;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    
    -- Find the referral link used for this registration
    SELECT id, is_family_link, sponsor_id INTO v_link_id, v_is_family_link, v_sponsor_id
    FROM referral_links
    WHERE referral_code = NEW.referral_code
      AND is_active = true
    LIMIT 1;
    
    -- Increment registration_count on the referral link
    IF v_link_id IS NOT NULL THEN
      UPDATE referral_links
      SET registration_count = registration_count + 1,
          updated_at = now()
      WHERE id = v_link_id;
      
      -- If family link, ensure linked_account entry exists
      IF v_is_family_link = true THEN
        -- Check if profile is marked as linked account
        IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.referred_id AND is_linked_account = true) THEN
          -- Create linked_account entry if not exists
          INSERT INTO linked_accounts (sponsor_id, linked_user_id, relation_type)
          VALUES (v_sponsor_id, NEW.referred_id, 'famille')
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on referrals table
DROP TRIGGER IF EXISTS on_referral_status_change ON referrals;
CREATE TRIGGER on_referral_status_change
  AFTER INSERT OR UPDATE OF status ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_confirmed();

-- Create function to handle family link registration (on profile creation)
CREATE OR REPLACE FUNCTION public.handle_linked_account_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sponsor_id uuid;
  v_referral_code text;
BEGIN
  -- Only for new linked accounts
  IF NEW.is_linked_account = true AND (OLD IS NULL OR OLD.is_linked_account = false) THEN
    
    -- Find the sponsor from referrals table
    SELECT r.sponsor_id, r.referral_code INTO v_sponsor_id, v_referral_code
    FROM referrals r
    WHERE r.referred_id = NEW.id
    ORDER BY r.created_at DESC
    LIMIT 1;
    
    IF v_sponsor_id IS NOT NULL THEN
      -- Create linked_account entry if not exists
      INSERT INTO linked_accounts (sponsor_id, linked_user_id, relation_type)
      VALUES (v_sponsor_id, NEW.id, 'famille')
      ON CONFLICT DO NOTHING;
      
      -- Update registration_count for family links
      UPDATE referral_links
      SET registration_count = registration_count + 1,
          updated_at = now()
      WHERE referral_code = v_referral_code
        AND is_family_link = true
        AND is_active = true;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on profiles table for linked accounts
DROP TRIGGER IF EXISTS on_linked_account_created ON profiles;
CREATE TRIGGER on_linked_account_created
  AFTER INSERT OR UPDATE OF is_linked_account ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_linked_account_profile();

-- Add unique constraint to prevent duplicate linked accounts
ALTER TABLE linked_accounts 
ADD CONSTRAINT unique_linked_account 
UNIQUE (sponsor_id, linked_user_id);