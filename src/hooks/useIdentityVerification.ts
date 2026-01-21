import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VerificationStatus {
  id?: string;
  status: 'none' | 'pending' | 'initiated' | 'verified' | 'rejected' | 'review_needed';
  firstNameExtracted?: string;
  lastNameExtracted?: string;
  documentType?: string;
  documentCountry?: string;
  documentUrl?: string;
  createdAt?: string;
  sessionId?: string;
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
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(false);

  // Fetch test mode status
  const fetchTestMode = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'test_mode_enabled')
        .maybeSingle();

      if (!error && data?.setting_value) {
        setTestModeEnabled(data.setting_value === 'true');
      }
    } catch (error) {
      console.error('Error fetching test mode:', error);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('veriff-verification', {
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
          documentUrl: data.verification.document_url,
          createdAt: data.verification.created_at,
          sessionId: data.verification.verification_result?.veriff_session_id,
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
    fetchTestMode();
  }, [fetchStatus, fetchTestMode]);

  const analyzeDocument = async (imageBase64: string): Promise<{ firstName: string; lastName: string } | null> => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-id-card', {
        body: { imageBase64 },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadDocument = async (file: File): Promise<{ success: boolean; url?: string; error?: string; extractedName?: { firstName: string; lastName: string } }> => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/cni_${Date.now()}.${fileExt}`;
      
      // Ensure proper MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf'
      };
      const contentType = mimeTypes[fileExt] || file.type || 'image/jpeg';
      const properFile = new File([file], file.name, { type: contentType, lastModified: Date.now() });

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, properFile, {
          cacheControl: '3600',
          upsert: true,
          contentType
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: 'Erreur lors du téléchargement' };
      }

      // Get signed URL (private bucket)
      const { data: urlData } = await supabase.storage
        .from('identity-documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      const documentUrl = urlData?.signedUrl || fileName;

      // Analyze document if it's an image
      let extractedFirstName: string | null = null;
      let extractedLastName: string | null = null;

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const imageBase64 = await base64Promise;
        
        const analysisResult = await analyzeDocument(imageBase64);
        if (analysisResult) {
          extractedFirstName = analysisResult.firstName || null;
          extractedLastName = analysisResult.lastName || null;
        }
      }

      // Prepare update data
      const updateData: any = { 
        document_url: documentUrl,
        first_name_extracted: extractedFirstName,
        last_name_extracted: extractedLastName,
      };

      // Check if verification record exists
      if (verificationStatus.id) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('identity_verifications')
          .update(updateData)
          .eq('id', verificationStatus.id);

        if (updateError) {
          console.error('Update error:', updateError);
          return { success: false, error: 'Erreur lors de la mise à jour' };
        }
      } else {
        // Create new verification record with document
        const { error: insertError } = await supabase
          .from('identity_verifications')
          .insert({
            user_id: user.id,
            status: 'pending',
            verification_type: 'id_document',
            ...updateData
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          return { success: false, error: 'Erreur lors de l\'enregistrement' };
        }
      }

      // Refresh status
      await fetchStatus();

      return { 
        success: true, 
        url: documentUrl,
        extractedName: extractedFirstName || extractedLastName 
          ? { firstName: extractedFirstName || '', lastName: extractedLastName || '' }
          : undefined
      };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  };

  const initiateVerification = async (): Promise<{ success: boolean; redirectUrl?: string; error?: string }> => {
    try {
      setInitiating(true);
      const { data, error } = await supabase.functions.invoke('veriff-verification', {
        body: { action: 'create-session' }
      });

      if (error) {
        console.error('Error initiating verification:', error);
        return { success: false, error: error.message };
      }

      if (data?.success && data?.redirectUrl) {
        // Update local status
        setVerificationStatus(prev => ({ ...prev, status: 'initiated', sessionId: data.sessionId }));
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

  // Get decision for a specific session (useful for polling)
  const getSessionDecision = async (sessionId: string): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('veriff-verification', {
        body: { action: 'get-decision', sessionId }
      });

      if (error) throw error;
      return data?.decision;
    } catch (error) {
      console.error('Error getting session decision:', error);
    return null;
    }
  };

  // Refresh status by calling Veriff API to get latest decision
  const refreshAndUpdateStatus = async (): Promise<{ success: boolean; status?: string; error?: string }> => {
    try {
      setRefreshing(true);
      
      // Call status which already checks Veriff for updates
      const { data, error } = await supabase.functions.invoke('veriff-verification', {
        body: { action: 'status' }
      });

      if (error) {
        console.error('Error refreshing verification status:', error);
        return { success: false, error: error.message };
      }

      if (data?.verification) {
        setVerificationStatus({
          id: data.verification.id,
          status: data.verification.status || 'pending',
          firstNameExtracted: data.verification.first_name_extracted,
          lastNameExtracted: data.verification.last_name_extracted,
          documentType: data.verification.document_type,
          documentCountry: data.verification.document_country,
          documentUrl: data.verification.document_url,
          createdAt: data.verification.created_at,
          sessionId: data.verification.verification_result?.veriff_session_id,
        });
      }

      setProfileVerification({
        verified: data?.profileVerified || false,
        verifiedAt: data?.verifiedAt,
      });

      return { 
        success: true, 
        status: data?.verification?.status || 'none'
      };
    } catch (error: any) {
      console.error('Error in refreshAndUpdateStatus:', error);
      return { success: false, error: error.message };
    } finally {
      setRefreshing(false);
    }
  };

  // Delete document and reset verification for retry
  // In test mode, also reset profile verification without logout
  const deleteDocumentAndReset = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      // If we have a verification record, delete it
      if (verificationStatus.id) {
        // First, try to delete the file from storage if we have the URL
        if (verificationStatus.documentUrl) {
          try {
            // Extract file path from URL
            const urlParts = verificationStatus.documentUrl.split('/');
            const fileName = urlParts[urlParts.length - 1]?.split('?')[0];
            if (fileName) {
              const filePath = `${user.id}/${fileName}`;
              await supabase.storage
                .from('identity-documents')
                .remove([filePath]);
            }
          } catch (storageError) {
            console.warn('Could not delete file from storage:', storageError);
            // Continue anyway - file might not exist
          }
        }

        // Delete the verification record
        const { error: deleteError } = await supabase
          .from('identity_verifications')
          .delete()
          .eq('id', verificationStatus.id);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return { success: false, error: 'Erreur lors de la suppression' };
        }
      }

      // In test mode, also reset profile verification flags
      if (testModeEnabled && profileVerification.verified) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            identity_verified: false, 
            identity_verified_at: null 
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // Don't fail the whole operation for this
        }
      }

      // Reset local state
      setVerificationStatus({ status: 'none' });
      setProfileVerification({ verified: false });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  };

  return {
    verificationStatus,
    profileVerification,
    loading,
    initiating,
    uploading,
    analyzing,
    refreshing,
    testModeEnabled,
    initiateVerification,
    uploadDocument,
    refreshStatus: fetchStatus,
    refreshAndUpdateStatus,
    getSessionDecision,
    deleteDocumentAndReset,
  };
}
