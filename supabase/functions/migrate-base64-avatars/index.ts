import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all profiles with base64 avatars
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, avatar_url, first_name, last_name')
      .not('avatar_url', 'is', null)
      .like('avatar_url', 'data:image%');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${profiles?.length || 0} profiles with base64 avatars`);

    const results = [];
    
    for (const profile of profiles || []) {
      try {
        // Extract base64 data
        const base64Data = profile.avatar_url.split(',')[1];
        const mimeType = profile.avatar_url.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
        const extension = mimeType.split('/')[1];

        // Convert base64 to blob
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Upload to storage
        const filePath = `${profile.id}/avatar.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, binaryData, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for user ${profile.id}:`, uploadError);
          results.push({ id: profile.id, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update profile with new URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Update error for user ${profile.id}:`, updateError);
          results.push({ id: profile.id, success: false, error: updateError.message });
          continue;
        }

        console.log(`Successfully migrated avatar for user ${profile.id}`);
        results.push({ id: profile.id, success: true, newUrl: publicUrl });
      } catch (error: unknown) {
        console.error(`Error processing profile ${profile.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ id: profile.id, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: 'Migration completed',
        total: results.length,
        success: successCount,
        failed: failCount,
        details: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: unknown) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
