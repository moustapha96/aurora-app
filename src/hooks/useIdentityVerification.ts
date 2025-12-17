import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VerificationStatus {
  id?: string;
  status: 'none' | 'pending' | 'initiated' | 'verified' | 'rejected' | 'review_needed';
  firstNameExtracted?: string;
  lastNameExtracted?: string;
  documentType?: string;
  documentCountry?: string;
  createdAt?: string;
}

interface ProfileVerification {
  verified: boolean;
  verifiedAt?: string;
}

export function useIdentityVerification() {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({ status: 'none' });
  const [profileVerification, setProfileVerification] = useState<ProfileVerification>({ verified: false });
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('jumio-verification', {
        body: { action: 'status' }
      });

      if (error) {
        console.error('Error fetching verification status:', error);
        return;
      }

      if (data?.verification) {
        setVerificationStatus({
          id: data.verification.id,
          status: data.verification.status || 'pending',
          firstNameExtracted: data.verification.first_name_extracted,
          lastNameExtracted: data.verification.last_name_extracted,
          documentType: data.verification.document_type,
          documentCountry: data.verification.document_country,
          createdAt: data.verification.created_at,
        });
      } else {
        setVerificationStatus({ status: 'none' });
      }

      setProfileVerification({
        verified: data?.profileVerified || false,
        verifiedAt: data?.verifiedAt,
      });
    } catch (error) {
      console.error('Error in fetchStatus:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const initiateVerification = async (): Promise<{ success: boolean; redirectUrl?: string; error?: string }> => {
    try {
      setInitiating(true);
      const { data, error } = await supabase.functions.invoke('jumio-verification', {
        body: { action: 'initiate' }
      });

      if (error) {
        console.error('Error initiating verification:', error);
        return { success: false, error: error.message };
      }

      if (data?.success && data?.redirectUrl) {
        // Update local status
        setVerificationStatus(prev => ({ ...prev, status: 'initiated' }));
        return { success: true, redirectUrl: data.redirectUrl };
      }

      return { success: false, error: data?.error || 'Erreur inconnue' };
    } catch (error: any) {
      console.error('Error in initiateVerification:', error);
      return { success: false, error: error.message };
    } finally {
      setInitiating(false);
    }
  };

  return {
    verificationStatus,
    profileVerification,
    loading,
    initiating,
    initiateVerification,
    refreshStatus: fetchStatus,
  };
}
