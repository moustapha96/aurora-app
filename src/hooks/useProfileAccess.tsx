import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to determine if the current user can edit a profile
 * @param profileUserId - The user ID of the profile being viewed
 * @returns true if the current user can edit this profile, false otherwise
 */
export const useProfileAccess = (profileUserId?: string) => {
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCanEdit(false);
        setIsLoading(false);
        return;
      }

      // If no profileUserId is provided, assume we're viewing our own profile
      if (!profileUserId) {
        setCanEdit(true);
        setIsLoading(false);
        return;
      }

      // User can edit if they're viewing their own profile
      setCanEdit(user.id === profileUserId);
      setIsLoading(false);
    };

    checkAccess();
  }, [profileUserId]);

  return { canEdit, isLoading };
};
