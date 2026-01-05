-- Create a secure RPC function to get public wealth data for member badges
-- This function returns only wealth information needed for badge display
-- It does NOT expose sensitive data, only what's needed to calculate the badge circle

CREATE OR REPLACE FUNCTION get_members_wealth_for_badges(member_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  wealth_billions text,
  wealth_amount text,
  wealth_unit text,
  wealth_currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return wealth data if the user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  -- Return wealth data for the requested member IDs
  -- This allows authenticated users to see wealth badges on member cards
  RETURN QUERY
  SELECT 
    pp.user_id,
    pp.wealth_billions,
    pp.wealth_amount,
    pp.wealth_unit,
    pp.wealth_currency
  FROM profiles_private pp
  WHERE pp.user_id = ANY(member_ids)
    AND pp.wealth_billions IS NOT NULL;
END;
$$;