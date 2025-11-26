import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'member' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Get user role from user_roles table
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no role found, default to member
        if (error.code === 'PGRST116') {
          setRole('member');
        } else {
          console.error('Error checking user role:', error);
          setRole('member'); // Default to member on error
        }
      } else {
        setRole(roleData.role as 'admin' | 'member');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setRole('member'); // Default to member on error
    } finally {
      setLoading(false);
    }
  };

  return { role, loading, refetch: checkUserRole };
};

