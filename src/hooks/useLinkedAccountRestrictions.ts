import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LinkedAccountInfo {
  isLinkedAccount: boolean;
  sponsorId: string | null;
  loading: boolean;
}

/**
 * Hook to check if the current user is a linked (family) account
 * Linked accounts have restricted access:
 * - Read-only access to sponsor's Business, Family, Personal, Network sections
 * - No access to Concierge, Marketplace
 * - No access to other members
 * - No wealth level
 */
export const useLinkedAccountRestrictions = (): LinkedAccountInfo => {
  const [isLinkedAccount, setIsLinkedAccount] = useState(false);
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLinkedAccountStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('is_linked_account, linked_by_user_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setIsLinkedAccount(profile.is_linked_account || false);
          setSponsorId(profile.linked_by_user_id || null);
        }
      } catch (error) {
        console.error('Error checking linked account status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLinkedAccountStatus();
  }, []);

  return { isLinkedAccount, sponsorId, loading };
};

/**
 * Check if a linked account can access a specific section
 */
export const canLinkedAccountAccess = (section: string): boolean => {
  const allowedSections = ['business', 'family', 'personal', 'network'];
  return allowedSections.includes(section.toLowerCase());
};

/**
 * Check if a linked account can edit content (always false - read-only)
 */
export const canLinkedAccountEdit = (): boolean => {
  return false;
};
