import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { AccessPermissionsDialog } from "./AccessPermissionsDialog";

interface ConnectionRequest {
  id: string;
  requester_id: string;
  status: string;
  created_at: string;
  requester_profile?: {
    first_name: string;
    last_name: string;
    job_function: string | null;
  } | null;
}

export const ConnectionRequests = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{
    id: string;
    requesterId: string;
    requesterName: string;
  } | null>(null);

  useEffect(() => {
    loadRequests();
    subscribeToRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('ConnectionRequests: No user found');
        return;
      }

      console.log('ConnectionRequests: Loading requests for user:', user.id);

      const { data, error } = await supabase
        .from('connection_requests')
        .select('id, requester_id, status, created_at')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('ConnectionRequests: Error loading requests:', error);
        throw error;
      }

      console.log('ConnectionRequests: Found requests:', data);

      // Fetch profiles separately
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, job_function')
            .eq('id', request.requester_id)
            .single();
          
          if (profileError) {
            console.error('ConnectionRequests: Error loading profile:', profileError);
          }
          
          return {
            ...request,
            requester_profile: profile ? {
              first_name: profile.first_name,
              last_name: profile.last_name,
              job_function: profile.job_function
            } : null
          };
        })
      );

      console.log('ConnectionRequests: Requests with profiles:', requestsWithProfiles);
      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error loading connection requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('connection_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests'
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcceptClick = (requestId: string, requesterId: string, requesterName: string) => {
    setSelectedRequest({ id: requestId, requesterId, requesterName });
    setPermissionsDialogOpen(true);
  };

  const handleAccept = async (permissions: {
    business_access: boolean;
    family_access: boolean;
    personal_access: boolean;
    influence_access: boolean;
  }) => {
    if (!selectedRequest) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update request status
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Create friendship (both directions) with permissions
      const { error: friendshipError } = await supabase
        .from('friendships')
        .upsert([
          { 
            user_id: user.id, 
            friend_id: selectedRequest.requesterId,
            ...permissions
          },
          { 
            user_id: selectedRequest.requesterId, 
            friend_id: user.id,
            ...permissions
          }
        ], { 
          onConflict: 'user_id,friend_id',
          ignoreDuplicates: false 
        });

      if (friendshipError) throw friendshipError;

      toast.success(t('connectionRequestAccepted'));
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(t('errorAcceptingRequest') || t('error'));
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(t('connectionRequestRejected'));
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t('errorRejectingRequest') || t('error'));
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/30 border-gold/20 p-6">
        <p className="text-gold/60 text-center">{t('loading')}</p>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="bg-black/30 border-gold/20 p-6">
        <div className="text-center">
          <UserPlus className="w-12 h-12 text-gold/40 mx-auto mb-3" />
          <p className="text-gold/60">{t('noPendingConnectionRequests')}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-black/30 border-gold/20 p-6">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-5 h-5 text-gold" />
          <h3 className="text-xl font-serif text-gold">{t('connectionRequestsLabel')}</h3>
          <Badge className="bg-gold/20 text-gold border-gold/30">
            {requests.length}
          </Badge>
        </div>

        <div className="space-y-4">
          {requests.map((request) => {
            const profile = Array.isArray(request.requester_profile) 
              ? request.requester_profile[0] 
              : request.requester_profile;

            const requesterName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-black/20 border border-gold/10 rounded-lg hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-gold/30 bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                    <span className="text-lg font-serif text-gold">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-gold font-medium">
                      {requesterName}
                    </p>
                    {profile?.job_function && (
                      <p className="text-gold/60 text-sm">{profile.job_function}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptClick(request.id, request.requester_id, requesterName)}
                    className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t('acceptRequest')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    className="border-gold/30 text-gold/70 hover:bg-gold/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('rejectRequest')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {selectedRequest && (
        <AccessPermissionsDialog
          open={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          requesterName={selectedRequest.requesterName}
          onConfirm={handleAccept}
        />
      )}
    </>
  );
};
