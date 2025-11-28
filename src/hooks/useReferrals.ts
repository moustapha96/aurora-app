import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string;
  referred_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string | null;
    avatar_url: string | null;
  };
  referrer_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface ReferralStats {
  total_referrals: number;
  direct_referrals: number;
  referrals_this_month: number;
  referrals_this_year: number;
}

export interface ReferralValidationResult {
  success: boolean;
  error?: string;
  referrer_id?: string;
  referrer_name?: string;
  code?: string;
}

export const useReferrals = (userId?: string) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        await loadReferrals(userId);
        await loadStats(userId);
        await loadReferralCode(userId);
      } else {
        const fetchCurrentUser = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await loadReferrals(user.id);
            await loadStats(user.id);
            await loadReferralCode(user.id);
          } else {
            setLoading(false);
          }
        };
        fetchCurrentUser();
      }
    };
    fetchUser();
  }, [userId]);

  const loadReferrals = async (uid: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get referrals where user is the referrer (their referrals)
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', uid)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Get profiles for referred users
      if (referralsData && referralsData.length > 0) {
        const referredIds = referralsData.map(r => r.referred_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, avatar_url')
          .in('id', referredIds);

        if (profilesError) throw profilesError;

        const referralsWithProfiles = referralsData.map(referral => ({
          ...referral,
          referred_profile: profilesData?.find(p => p.id === referral.referred_id)
        }));

        setReferrals(referralsWithProfiles as Referral[]);
      } else {
        setReferrals([]);
      }
    } catch (err: any) {
      console.error('Error loading referrals:', err);
      setError(err.message);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (uid: string) => {
    try {
      const { data, error: statsError } = await supabase.rpc('get_referral_stats', {
        user_id: uid
      });

      if (statsError) throw statsError;
      setStats(data as ReferralStats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setStats({
        total_referrals: 0,
        direct_referrals: 0,
        referrals_this_month: 0,
        referrals_this_year: 0
      });
    }
  };

  const loadReferralCode = async (uid: string) => {
    try {
      const { data, error: codeError } = await supabase.rpc('get_user_referral_code', {
        user_id: uid
      });

      if (codeError) throw codeError;
      setReferralCode(data || '');
    } catch (err: any) {
      console.error('Error loading referral code:', err);
      setReferralCode('');
    }
  };

  const validateReferralCode = async (code: string): Promise<ReferralValidationResult> => {
    try {
      if (!code || code.trim() === '') {
        return {
          success: false,
          error: 'Code de parrainage requis'
        };
      }

      // Use SQL function to validate code (bypasses RLS)
      const { data, error: validationError } = await (supabase.rpc as any)('validate_referral_code', {
        p_referral_code: code.toUpperCase().trim()
      });

      if (validationError) {
        console.error('Validation error:', validationError);
        return {
          success: false,
          error: validationError.message || 'Erreur lors de la validation du code',
          code: code
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Code de parrainage invalide',
          code: code
        };
      }

      return {
        success: true,
        referrer_id: data.referrer_id,
        referrer_name: data.referrer_name
      };
    } catch (err: any) {
      console.error('Error validating referral code:', err);
      return {
        success: false,
        error: err.message || 'Erreur lors de la validation du code'
      };
    }
  };

  const createReferral = async (code: string, newUserId: string): Promise<ReferralValidationResult> => {
    try {
      const { data, error: createError } = await supabase.rpc('validate_and_create_referral', {
        p_referral_code: code.toUpperCase().trim(),
        p_new_user_id: newUserId
      });

      if (createError) throw createError;

      return data as ReferralValidationResult;
    } catch (err: any) {
      console.error('Error creating referral:', err);
      return {
        success: false,
        error: err.message || 'Erreur lors de la création du parrainage'
      };
    }
  };

  const getReferrer = async (userId: string) => {
    try {
      // First, get the referral relationship
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userId)
        .eq('status', 'completed')
        .single();

      if (referralError) {
        if (referralError.code === 'PGRST116') {
          // No rows returned - user has no referrer
          return null;
        }
        throw referralError;
      }

      if (!referralData || !referralData.referrer_id) {
        return null;
      }

      // Then, get the referrer's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username, avatar_url')
        .eq('id', referralData.referrer_id)
        .single();

      if (profileError) {
        console.error('Error getting referrer profile:', profileError);
        return {
          ...referralData,
          referrer_profile: null
        };
      }

      return {
        ...referralData,
        referrer_profile: profileData
      };
    } catch (err: any) {
      console.error('Error getting referrer:', err);
      return null;
    }
  };

  return {
    referrals,
    stats,
    referralCode,
    loading,
    error,
    validateReferralCode,
    createReferral,
    getReferrer,
    refresh: () => {
      const refreshData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await loadReferrals(user.id);
          await loadStats(user.id);
          await loadReferralCode(user.id);
        }
      };
      refreshData();
    }
  };
};

