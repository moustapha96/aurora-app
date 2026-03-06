import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MEMBER_PAGE_KEYS } from "@/lib/memberPagePermissions";

export function useMemberPagePermissions() {
  const [allowedKeys, setAllowedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPermissions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setAllowedKeys([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("member_page_permissions")
          .select("page_key")
          .eq("user_id", user.id);

        if (!mounted) return;
        if (error) {
          console.error("[useMemberPagePermissions]", error);
          setAllowedKeys([]);
        } else {
          setAllowedKeys((data ?? []).map((r) => r.page_key));
        }
      } catch (e) {
        if (mounted) setAllowedKeys([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPermissions();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchPermissions();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const allowedSet = useMemo(
    () => new Set(allowedKeys),
    [allowedKeys]
  );

  const hasAccess = (pageKey: string) => allowedSet.has(pageKey);

  /** Pour le menu / member-card : si pas encore chargé, on considère tout autorisé pour éviter un flash. */
  const isAllowed = (pageKey: string) =>
    loading ? true : allowedSet.has(pageKey);

  return {
    allowedPages: allowedSet,
    allowedKeys,
    loading,
    hasAccess,
    isAllowed,
    /** Liste des clés de pages (pour l’admin). */
    allPageKeys: MEMBER_PAGE_KEYS,
  };
}
