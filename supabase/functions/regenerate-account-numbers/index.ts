import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, starting account number regeneration...');

    // Get all profiles ordered by created_at with is_linked_account info
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, created_at, is_linked_account')
      .order('created_at', { ascending: true });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No profiles found', updated: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profiles.length} profiles to update`);

    // Group profiles by month/year for sequential numbering
    const profilesByMonthYear: Record<string, Array<{ id: string; created_at: string; is_linked_account: boolean }>> = {};
    
    for (const profile of profiles) {
      const date = new Date(profile.created_at);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear() % 100).padStart(2, '0');
      const key = `${month}${year}`;
      
      if (!profilesByMonthYear[key]) {
        profilesByMonthYear[key] = [];
      }
      profilesByMonthYear[key].push({
        ...profile,
        is_linked_account: profile.is_linked_account || false
      });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Update each profile with its new account number
    for (const [monthYear, monthProfiles] of Object.entries(profilesByMonthYear)) {
      // Sort by created_at within the month
      monthProfiles.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      for (let i = 0; i < monthProfiles.length; i++) {
        const profile = monthProfiles[i];
        const sequentialNumber = String(i + 1).padStart(3, '0');
        // Use AI prefix for linked accounts, AU for regular members
        const prefix = profile.is_linked_account ? 'AI' : 'AU';
        const accountNumber = `${prefix}${sequentialNumber}${monthYear}`;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ account_number: accountNumber })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Error updating profile ${profile.id}:`, updateError);
          errors.push(`Profile ${profile.id}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`Updated profile ${profile.id} with account number ${accountNumber}`);
        }
      }
    }

    console.log(`Regeneration complete. Updated: ${updatedCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Account numbers regenerated successfully`,
        updated: updatedCount,
        total: profiles.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
