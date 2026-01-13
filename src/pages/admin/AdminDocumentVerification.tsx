import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play,
  Loader2,
  Eye,
  User,
  Filter,
  RefreshCw,
  Bell,
  Fingerprint,
  Clock,
  Trash2,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { format, type Locale } from 'date-fns';
import { fr, enUS, es, de, it, ptBR, ar, zhCN, ja, ru } from 'date-fns/locale';

interface DocumentToVerify {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
  verification_status: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface VerificationRecord {
  id: string;
  user_id: string;
  document_type: string;
  document_id: string;
  file_name: string;
  status: string;
  rejection_reason?: string;
  verified_at?: string;
  notification_sent: boolean;
  created_at: string;
}

interface IdentityVerificationRecord {
  id: string;
  user_id: string;
  status: string;
  document_type: string | null;
  document_country: string | null;
  document_url: string | null;
  first_name_extracted: string | null;
  last_name_extracted: string | null;
  verification_result: any;
  verification_type: string | null;
  
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface AIVerificationResult {
  documentId: string;
  fileName: string;
  userId: string;
  userName: string;
  status: 'valid' | 'invalid' | 'suspicious' | 'error';
  reason: string;
  details?: string;
  confidence?: number;
}

const AdminDocumentVerification = () => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  const localeMap: Record<string, Locale> = {
    'fr': fr,
    'en': enUS,
    'es': es,
    'de': de,
    'it': it,
    'pt': ptBR,
    'ar': ar,
    'zh': zhCN,
    'ja': ja,
    'ru': ru
  };
  
  const [documents, setDocuments] = useState<DocumentToVerify[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [identityVerifications, setIdentityVerifications] = useState<IdentityVerificationRecord[]>([]);
  const [identityStats, setIdentityStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0, initiated: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingAI, setIsVerifyingAI] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [identityStatusFilter, setIdentityStatusFilter] = useState<string>('all');
  const [identitySearchTerm, setIdentitySearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentToVerify | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [docToReject, setDocToReject] = useState<string | null>(null);
  const [selectedIdentityDoc, setSelectedIdentityDoc] = useState<IdentityVerificationRecord | null>(null);
  const [aiResults, setAiResults] = useState<AIVerificationResult[]>([]);
  const [showAIResultsDialog, setShowAIResultsDialog] = useState(false);

  // Pagination states
  const [veriffPage, setVeriffPage] = useState(1);
  const [veriffPageSize, setVeriffPageSize] = useState(10);
  const [docsPage, setDocsPage] = useState(1);
  const [docsPageSize, setDocsPageSize] = useState(10);

  useEffect(() => {
    loadDocuments();
    loadVerifications();
    loadIdentityStats();
    loadIdentityVerifications();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-documents-batch', {
        body: { action: 'get-pending' }
      });

      if (error) throw error;
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('document_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    }
  };

  const loadIdentityStats = async () => {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('status');

      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        verified: data?.filter(d => d.status === 'verified').length || 0,
        pending: data?.filter(d => d.status === 'pending').length || 0,
        rejected: data?.filter(d => d.status === 'rejected').length || 0,
        initiated: data?.filter(d => d.status === 'initiated').length || 0,
      };
      setIdentityStats(stats);
    } catch (error) {
      console.error('Error loading identity stats:', error);
    }
  };

  const loadIdentityVerifications = async () => {
    try {
      // First load all identity verifications
      const { data: verifs, error: verifsError } = await supabase
        .from('identity_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (verifsError) throw verifsError;

      // Then load user profiles for each verification
      const userIds = [...new Set(verifs?.map(v => v.user_id) || [])];
      
      let profilesMap: Record<string, { first_name: string; last_name: string; avatar_url?: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url || undefined };
            return acc;
          }, {} as Record<string, { first_name: string; last_name: string; avatar_url?: string }>);
        }
      }

      // Combine verifications with user data
      const enrichedVerifs = (verifs || []).map(v => ({
        ...v,
        user: profilesMap[v.user_id]
      }));

      setIdentityVerifications(enrichedVerifs);
    } catch (error) {
      console.error('Error loading identity verifications:', error);
    }
  };

  const handleStartBatch = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-documents-batch', {
        body: { action: 'start-batch' }
      });

      if (error) throw error;

      toast({
        title: t('adminBatchCreated'),
        description: data.message
      });

      loadDocuments();
      loadVerifications();
    } catch (error) {
      console.error('Error starting batch:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le batch",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Refresh all pending Veriff sessions
  const handleRefreshVeriff = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('veriff-verification', {
        body: { action: 'admin-refresh-all' }
      });

      if (error) throw error;

      toast({
        title: t('adminVeriffVerificationCompleted'),
        description: data.message
      });

      loadIdentityVerifications();
      loadIdentityStats();
    } catch (error) {
      console.error('Error refreshing Veriff:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir les sessions Veriff",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify all family documents with AI
  const handleVerifyFamilyDocsAI = async () => {
    setIsVerifyingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-family-documents-ai', {
        body: { action: 'verify-all' }
      });

      if (error) throw error;

      setAiResults(data.results || []);
      setShowAIResultsDialog(true);
      
      toast({
        title: t('adminAIVerificationCompleted'),
        description: data.message
      });

      loadDocuments();
      loadVerifications();
    } catch (error) {
      console.error('Error verifying with AI:', error);
      toast({
        title: "Erreur",
        description: "Impossible de lancer la vérification IA",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingAI(false);
    }
  };

  // Retry AI verification for single document
  const handleRetryAIVerification = async (documentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-family-documents-ai', {
        body: { action: 'retry-verification', documentId }
      });

      if (error) throw error;

      toast({
        title: t('adminVerificationCompleted'),
        description: data.result?.reason || t('adminDocumentAnalyzed')
      });

      loadDocuments();
      loadVerifications();
    } catch (error) {
      console.error('Error retrying verification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de relancer la vérification",
        variant: "destructive"
      });
    }
  };

  // Delete a family document
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm(t('adminAreYouSureDeleteDocument'))) return;

    try {
      const { error } = await supabase.functions.invoke('verify-family-documents-ai', {
        body: { action: 'delete-document', documentId }
      });

      if (error) throw error;

      toast({
        title: t('adminDocumentDeleted'),
        description: t('adminDocumentDeletedSuccessfully')
      });

      loadDocuments();
      loadVerifications();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  const handleVerifyDocument = async (verificationId: string, status: 'verified' | 'rejected' | 'review_needed') => {
    try {
      const { error } = await supabase.functions.invoke('verify-documents-batch', {
        body: { 
          action: 'update-status',
          documentVerificationId: verificationId,
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined
        }
      });

      if (error) throw error;

      toast({
        title: t('adminStatusUpdated'),
        description: status === 'verified' ? t('adminDocumentVerified') : status === 'rejected' ? t('adminDocumentRejected') : t('adminDocumentInReview')
      });

      setShowRejectDialog(false);
      setRejectionReason('');
      setDocToReject(null);
      loadVerifications();
      loadDocuments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  // Handle manual identity verification (Veriff)
  const handleManualIdentityVerification = async (verif: IdentityVerificationRecord, newStatus: 'verified' | 'rejected') => {
    try {
      setIsProcessing(true);
      
      // Update the identity_verifications record
      const { error: verifError } = await supabase
        .from('identity_verifications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          verification_result: {
            ...(verif.verification_result || {}),
            manual_override: true,
            manual_override_at: new Date().toISOString(),
            manual_status: newStatus
          }
        })
        .eq('id', verif.id);

      if (verifError) throw verifError;

      // Update the profile's identity_verified status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          identity_verified: newStatus === 'verified',
          identity_verified_at: newStatus === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', verif.user_id);

      if (profileError) throw profileError;

      toast({
        title: newStatus === 'verified' ? t('adminIdentityVerified') : t('adminIdentityRejected'),
        description: t('adminVerificationStatusUpdated').replace('{name}', `${verif.user?.first_name} ${verif.user?.last_name}`)
      });

      // Refresh data
      loadIdentityVerifications();
      loadIdentityStats();
    } catch (error) {
      console.error('Error updating identity verification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de vérification",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewDocument = async (doc: DocumentToVerify) => {
    try {
      setSelectedDoc(doc);
      
      if (doc.document_type === 'family_document') {
        const { data, error } = await supabase.storage
          .from('family-documents')
          .createSignedUrl(doc.file_path, 3600);

        if (error) throw error;
        setPreviewUrl(data.signedUrl);
      } else if (doc.document_type === 'identity_document' && doc.file_path) {
        setPreviewUrl(doc.file_path);
      }
    } catch (error) {
      console.error('Error getting preview:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'afficher le document",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t('adminVerified')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500"><XCircle className="w-3 h-3 mr-1" />{t('adminRejected')}</Badge>;
      case 'review_needed':
        return <Badge className="bg-orange-500/20 text-orange-500"><AlertCircle className="w-3 h-3 mr-1" />{t('adminReviewNeeded')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500"><Loader2 className="w-3 h-3 mr-1" />{t('adminPending')}</Badge>;
      case 'initiated':
        return <Badge className="bg-blue-500/20 text-blue-500"><Clock className="w-3 h-3 mr-1" />{t('adminInitiated')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />{t('adminInProgress')}</Badge>;
      default:
        return <Badge variant="outline">{t('adminNonVerifiedStatus')}</Badge>;
    }
  };

  // Format Veriff decision code
  const getVeriffCodeLabel = (code: number | undefined) => {
    if (!code) return null;
    const codes: Record<number, { label: string; color: string }> = {
      9001: { label: t('adminApprovedLabel'), color: 'text-green-500' },
      9102: { label: t('adminRefusedLabel'), color: 'text-red-500' },
      9103: { label: t('adminResubmissionRequired'), color: 'text-orange-500' },
      9104: { label: t('adminExpired'), color: 'text-gray-500' },
      9121: { label: t('adminAbandoned'), color: 'text-gray-500' },
    };
    return codes[code] || { label: `${t('adminCode')} ${code}`, color: 'text-muted-foreground' };
  };

  // Extract Veriff session details
  const getVeriffSessionInfo = (verif: IdentityVerificationRecord) => {
    const result = verif.verification_result;
    if (!result) return null;
    
    return {
      sessionId: result.veriff_session_id,
      sessionUrl: result.veriff_session_url,
      decision: result.veriff_decision || result.veriff_webhook_decision,
      status: result.veriff_status,
      code: result.veriff_code,
      reason: result.veriff_reason,
      decisionTime: result.veriff_decision_time,
      submittedAt: result.submitted_at,
    };
  };

  // Filter and paginate identity verifications
  const filteredIdentityVerifications = identityVerifications.filter(v => {
    const matchesSearch = !identitySearchTerm || 
      v.user?.first_name?.toLowerCase().includes(identitySearchTerm.toLowerCase()) ||
      v.user?.last_name?.toLowerCase().includes(identitySearchTerm.toLowerCase()) ||
      v.first_name_extracted?.toLowerCase().includes(identitySearchTerm.toLowerCase()) ||
      v.last_name_extracted?.toLowerCase().includes(identitySearchTerm.toLowerCase());
    const matchesStatus = identityStatusFilter === 'all' || v.status === identityStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const veriffTotalPages = Math.ceil(filteredIdentityVerifications.length / veriffPageSize);
  const veriffStartIndex = filteredIdentityVerifications.length > 0 ? (veriffPage - 1) * veriffPageSize + 1 : 0;
  const veriffEndIndex = Math.min(veriffPage * veriffPageSize, filteredIdentityVerifications.length);
  const paginatedIdentityVerifications = filteredIdentityVerifications.slice(
    (veriffPage - 1) * veriffPageSize,
    veriffPage * veriffPageSize
  );

  // Filter and paginate documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const docsTotalPages = Math.ceil(filteredDocuments.length / docsPageSize);
  const docsStartIndex = filteredDocuments.length > 0 ? (docsPage - 1) * docsPageSize + 1 : 0;
  const docsEndIndex = Math.min(docsPage * docsPageSize, filteredDocuments.length);
  const paginatedDocuments = filteredDocuments.slice(
    (docsPage - 1) * docsPageSize,
    docsPage * docsPageSize
  );

  const stats = {
    total: documents.length,
    verified: documents.filter(d => d.verification_status === 'verified').length,
    rejected: documents.filter(d => d.verification_status === 'rejected').length,
    pending: documents.filter(d => d.verification_status === 'pending' || d.verification_status === 'not_verified').length,
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('adminDocumentVerification')}</h1>
            <p className="text-muted-foreground">{t('adminDocumentVerificationDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => { loadDocuments(); loadVerifications(); loadIdentityStats(); loadIdentityVerifications(); }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('adminRefresh')}
            </Button>
            <Button 
              onClick={handleRefreshVeriff}
              disabled={isProcessing}
              className="bg-primary"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4 mr-2" />
              )}
              {t('adminVerifyVeriff')}
            </Button>
            <Button 
              onClick={handleVerifyFamilyDocsAI}
              disabled={isVerifyingAI}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isVerifyingAI ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {t('adminVerifyAIDocs')}
            </Button>
            <Button 
              variant="outline"
              onClick={handleStartBatch}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {t('adminBatchDocuments')}
            </Button>
          </div>
        </div>

        {/* Identity Verification Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              {t('adminIdentityVerificationsVeriff')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{identityStats.total}</p>
                <p className="text-xs text-muted-foreground">{t('adminTotal')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-500">{identityStats.verified}</p>
                <p className="text-xs text-muted-foreground">{t('adminVerified')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-500">{identityStats.pending}</p>
                <p className="text-xs text-muted-foreground">{t('adminPending')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-500">{identityStats.initiated}</p>
                <p className="text-xs text-muted-foreground">{t('adminInitiated')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-500">{identityStats.rejected}</p>
                <p className="text-xs text-muted-foreground">{t('adminRejected')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="veriff-history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="veriff-history" className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              {t('adminVeriffHistory')}
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('adminFamilyDocuments')}
            </TabsTrigger>
          </TabsList>

          {/* Veriff History Tab */}
          <TabsContent value="veriff-history" className="space-y-4">
            {/* Filters for Veriff */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('adminSearchByUsername')}
                      value={identitySearchTerm}
                      onChange={(e) => setIdentitySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={identityStatusFilter} onValueChange={setIdentityStatusFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('adminAllStatuses')}</SelectItem>
                      <SelectItem value="initiated">{t('adminInitiated')}</SelectItem>
                      <SelectItem value="pending">{t('adminPending')}</SelectItem>
                      <SelectItem value="verified">{t('adminVerified')}</SelectItem>
                      <SelectItem value="rejected">{t('adminRejected')}</SelectItem>
                      <SelectItem value="review_needed">{t('adminReviewNeeded')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Veriff History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-primary" />
                  {t('adminVeriffVerificationsHistory')}
                </CardTitle>
                <CardDescription>
                  {identityVerifications.filter(v => {
                    const matchesSearch = !identitySearchTerm || 
                      v.user?.first_name?.toLowerCase().includes(identitySearchTerm.toLowerCase()) ||
                      v.user?.last_name?.toLowerCase().includes(identitySearchTerm.toLowerCase());
                    const matchesStatus = identityStatusFilter === 'all' || v.status === identityStatusFilter;
                    return matchesSearch && matchesStatus;
                  }).length} {t('adminVerificationsFound')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : identityVerifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('adminNoVeriffVerificationFound')}
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('adminUser')}</TableHead>
                          <TableHead>{t('adminExtractedName')}</TableHead>
                          <TableHead>{t('adminDocumentType')}</TableHead>
                          <TableHead>{t('adminCountry')}</TableHead>
                          <TableHead>{t('adminCreationDate')}</TableHead>
                          <TableHead>{t('adminLastUpdate')}</TableHead>
                          <TableHead>{t('adminStatus')}</TableHead>
                          <TableHead>{t('adminActions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedIdentityVerifications.map((verif) => (
                          <TableRow key={verif.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  {verif.user?.avatar_url ? (
                                    <AvatarImage src={verif.user.avatar_url} alt="" />
                                  ) : null}
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {verif.user?.first_name?.[0]}{verif.user?.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {verif.user?.first_name} {verif.user?.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {verif.user_id.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {verif.first_name_extracted || verif.last_name_extracted ? (
                                <span className="text-sm">
                                  {verif.first_name_extracted} {verif.last_name_extracted}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">{t('adminNotExtracted')}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {verif.document_type || t('adminNA')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{verif.document_country || t('adminNA')}</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(verif.created_at), 'dd/MM/yyyy', { locale: localeMap[language] })}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(verif.created_at), 'HH:mm', { locale: localeMap[language] })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(verif.updated_at), 'dd/MM/yyyy', { locale: localeMap[language] })}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(verif.updated_at), 'HH:mm', { locale: localeMap[language] })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(verif.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {verif.document_url && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedIdentityDoc(verif)}
                                    title={t('adminViewDocument')}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                {verif.verification_result && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      console.log('Verification result:', verif.verification_result);
                                      toast({
                                        title: t('adminVeriffResult'),
                                        description: JSON.stringify(verif.verification_result, null, 2).slice(0, 200) + '...'
                                      });
                                    }}
                                    title={t('adminViewResult')}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleManualIdentityVerification(verif, 'verified')}
                                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                  title={t('adminApproveManually')}
                                  disabled={isProcessing || verif.status === 'verified'}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleManualIdentityVerification(verif, 'rejected')}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  title={t('adminRejectManually')}
                                  disabled={isProcessing || verif.status === 'rejected'}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredIdentityVerifications.length > 0 && (
                      <AdminPagination
                        currentPage={veriffPage}
                        totalPages={veriffTotalPages}
                        totalItems={filteredIdentityVerifications.length}
                        pageSize={veriffPageSize}
                        onPageChange={setVeriffPage}
                        onPageSizeChange={(size) => { setVeriffPageSize(size); setVeriffPage(1); }}
                        startIndex={veriffStartIndex}
                        endIndex={veriffEndIndex}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {/* Document Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">{t('adminTotalDocuments')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.verified}</p>
                      <p className="text-xs text-muted-foreground">{t('adminVerified')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-red-500/10">
                      <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.rejected}</p>
                      <p className="text-xs text-muted-foreground">{t('adminRejected')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-yellow-500/10">
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.pending}</p>
                      <p className="text-xs text-muted-foreground">{t('adminPending')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('adminSearchByFileNameOrUser')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder={t('adminFilterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('adminAllStatuses')}</SelectItem>
                      <SelectItem value="not_verified">{t('adminNonVerified')}</SelectItem>
                      <SelectItem value="pending">{t('adminPending')}</SelectItem>
                      <SelectItem value="verified">{t('adminVerified')}</SelectItem>
                      <SelectItem value="rejected">{t('adminRejected')}</SelectItem>
                      <SelectItem value="review_needed">{t('adminReviewNeeded')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Documents Table */}
            <Card>
              <CardHeader>
                <CardTitle>{t('adminDocumentsToVerify')}</CardTitle>
                <CardDescription>
                  {filteredDocuments.length} {t('adminDocumentsFound')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('adminNoDocumentFound')}
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('adminUser')}</TableHead>
                          <TableHead>{t('adminDocument')}</TableHead>
                          <TableHead>{t('adminType')}</TableHead>
                          <TableHead>{t('adminDate')}</TableHead>
                          <TableHead>{t('adminStatus')}</TableHead>
                          <TableHead>{t('adminActions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedDocuments.map((doc) => {
                          const verification = verifications.find(v => v.document_id === doc.id);
                          return (
                            <TableRow key={doc.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    {doc.user?.avatar_url ? (
                                      <img src={doc.user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-primary" />
                                    )}
                                  </div>
                                  <span className="font-medium">
                                    {doc.user?.first_name} {doc.user?.last_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {doc.file_name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {doc.document_type === 'family_document' ? t('adminFamilyDocument') : t('adminIdentity')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: localeMap[language] })}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(verification?.status || doc.verification_status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePreviewDocument(doc)}
                                    title={t('adminPreview')}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {doc.document_type === 'family_document' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRetryAIVerification(doc.id)}
                                        className="text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                                        title={t('adminRetryAIVerification')}
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        title={t('adminDeleteDocument')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  {verification && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleVerifyDocument(verification.id, 'verified')}
                                        className="text-green-500 hover:text-green-600"
                                        title={t('adminValidate')}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setDocToReject(verification.id);
                                          setShowRejectDialog(true);
                                        }}
                                        className="text-red-500 hover:text-red-600"
                                        title={t('adminReject')}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleVerifyDocument(verification.id, 'review_needed')}
                                        className="text-orange-500 hover:text-orange-600"
                                        title={t('adminReviewNeeded')}
                                      >
                                        <AlertCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {filteredDocuments.length > 0 && (
                      <AdminPagination
                        currentPage={docsPage}
                        totalPages={docsTotalPages}
                        totalItems={filteredDocuments.length}
                        pageSize={docsPageSize}
                        onPageChange={setDocsPage}
                        onPageSizeChange={(size) => { setDocsPageSize(size); setDocsPage(1); }}
                        startIndex={docsStartIndex}
                        endIndex={docsEndIndex}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Identity Document Preview Dialog */}
        <Dialog open={!!selectedIdentityDoc} onOpenChange={() => setSelectedIdentityDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                {t('adminIdentityDocument')} - {selectedIdentityDoc?.user?.first_name} {selectedIdentityDoc?.user?.last_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="w-12 h-12">
                  {selectedIdentityDoc?.user?.avatar_url ? (
                    <AvatarImage src={selectedIdentityDoc.user.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedIdentityDoc?.user?.first_name?.[0]}{selectedIdentityDoc?.user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedIdentityDoc?.user?.first_name} {selectedIdentityDoc?.user?.last_name}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedIdentityDoc?.user_id}</p>
                </div>
                <div className="ml-auto">
                  {selectedIdentityDoc && getStatusBadge(selectedIdentityDoc.status)}
                </div>
              </div>

              {/* Extracted info */}
              {(selectedIdentityDoc?.first_name_extracted || selectedIdentityDoc?.last_name_extracted) && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="font-medium text-green-500 mb-2">{t('adminExtractedInfo')}</p>
                  <p className="text-sm">
                    {t('adminName')}: {selectedIdentityDoc.first_name_extracted} {selectedIdentityDoc.last_name_extracted}
                  </p>
                  {selectedIdentityDoc.document_type && (
                    <p className="text-sm text-muted-foreground">
                      {t('adminType')}: {selectedIdentityDoc.document_type} 
                      {selectedIdentityDoc.document_country && ` (${selectedIdentityDoc.document_country})`}
                    </p>
                  )}
                </div>
              )}

        {/* Veriff Session Info */}
        {selectedIdentityDoc && (() => {
          const veriffInfo = getVeriffSessionInfo(selectedIdentityDoc);
          if (!veriffInfo) return null;
          
          return (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="font-medium mb-3 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" />
                {t('adminVeriffSessionInfo')}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {veriffInfo.sessionId && (
                  <>
                    <span className="text-muted-foreground">{t('adminSessionId')}:</span>
                    <span className="font-mono text-xs break-all">{veriffInfo.sessionId}</span>
                  </>
                )}
                {veriffInfo.status && (
                  <>
                    <span className="text-muted-foreground">{t('adminVeriffStatus')}:</span>
                    <span className="capitalize">{veriffInfo.status}</span>
                  </>
                )}
                {veriffInfo.code && (
                  <>
                    <span className="text-muted-foreground">{t('adminDecisionCode')}:</span>
                    <span className={getVeriffCodeLabel(veriffInfo.code)?.color}>
                      {veriffInfo.code} - {getVeriffCodeLabel(veriffInfo.code)?.label}
                    </span>
                  </>
                )}
                {veriffInfo.reason && (
                  <>
                    <span className="text-muted-foreground">{t('adminReason')}:</span>
                    <span className="text-orange-500">{veriffInfo.reason}</span>
                  </>
                )}
                {veriffInfo.decisionTime && (
                  <>
                    <span className="text-muted-foreground">{t('adminDecision')}:</span>
                    <span>{format(new Date(veriffInfo.decisionTime), 'dd/MM/yyyy HH:mm', { locale: localeMap[language] })}</span>
                  </>
                )}
                {veriffInfo.submittedAt && (
                  <>
                    <span className="text-muted-foreground">{t('adminSubmitted')}:</span>
                    <span>{format(new Date(veriffInfo.submittedAt), 'dd/MM/yyyy HH:mm', { locale: localeMap[language] })}</span>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Document image */}
        {selectedIdentityDoc?.document_url && (
          <div className="flex-1 overflow-auto border rounded-lg">
            <img 
              src={selectedIdentityDoc.document_url} 
              alt={t('adminIdentityDocumentAlt')}
              className="max-w-full h-auto mx-auto"
            />
          </div>
        )}

        {/* Person data from Veriff */}
        {selectedIdentityDoc?.verification_result?.veriff_decision?.verification?.person && (
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
            <p className="font-medium mb-2 text-green-500">{t('adminVeriffExtractedData')}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(selectedIdentityDoc.verification_result.veriff_decision.verification.person).map(([key, value]) => (
                <React.Fragment key={key}>
                  <span className="text-muted-foreground capitalize">{key}:</span>
                  <span>{String(value)}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Document data from Veriff */}
        {selectedIdentityDoc?.verification_result?.veriff_decision?.verification?.document && (
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="font-medium mb-2 text-blue-500">{t('adminDocumentData')}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(selectedIdentityDoc.verification_result.veriff_decision.verification.document).map(([key, value]) => (
                <React.Fragment key={key}>
                  <span className="text-muted-foreground capitalize">{key}:</span>
                  <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Raw verification result (collapsible) */}
        {selectedIdentityDoc?.verification_result && (
          <details className="p-4 rounded-lg bg-muted/50">
            <summary className="font-medium cursor-pointer mb-2">{t('adminRawVeriffData')}</summary>
            <pre className="text-xs overflow-auto max-h-60 p-2 bg-background rounded">
              {JSON.stringify(selectedIdentityDoc.verification_result, null, 2)}
            </pre>
          </details>
        )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!selectedDoc && !!previewUrl} onOpenChange={() => { setSelectedDoc(null); setPreviewUrl(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedDoc?.file_name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {selectedDoc?.file_type?.startsWith('image') ? (
                <img 
                  src={previewUrl || ''} 
                  alt={selectedDoc?.file_name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : selectedDoc?.file_type === 'application/pdf' ? (
                <iframe
                  src={previewUrl || ''}
                  className="w-full h-[70vh]"
                  title={selectedDoc?.file_name}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p>{t('adminPreviewNotAvailable')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.open(previewUrl || '', '_blank')}
                  >
                    {t('adminDownload')}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('adminRejectDocument')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('adminRejectReason')}
              </p>
              <Textarea
                placeholder={t('adminRejectReasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                {t('adminCancel')}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => docToReject && handleVerifyDocument(docToReject, 'rejected')}
                disabled={!rejectionReason.trim()}
              >
                {t('adminConfirmReject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Results Dialog */}
        <Dialog open={showAIResultsDialog} onOpenChange={setShowAIResultsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                {t('adminAIVerificationResults')}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh]">
              {aiResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('adminNoResultToDisplay')}
                </p>
              ) : (
                <div className="space-y-3">
                  {aiResults.map((result) => (
                    <div 
                      key={result.documentId}
                      className={`p-4 rounded-lg border ${
                        result.status === 'valid' ? 'bg-green-500/5 border-green-500/20' :
                        result.status === 'invalid' ? 'bg-red-500/5 border-red-500/20' :
                        result.status === 'suspicious' ? 'bg-orange-500/5 border-orange-500/20' :
                        'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{result.fileName}</span>
                            <Badge className={
                              result.status === 'valid' ? 'bg-green-500/20 text-green-500' :
                              result.status === 'invalid' ? 'bg-red-500/20 text-red-500' :
                              result.status === 'suspicious' ? 'bg-orange-500/20 text-orange-500' :
                              'bg-muted text-muted-foreground'
                            }>
                              {result.status === 'valid' ? t('adminValid') :
                               result.status === 'invalid' ? t('adminInvalid') :
                               result.status === 'suspicious' ? t('adminSuspicious') : t('adminError')}
                            </Badge>
                            {result.confidence && (
                              <span className="text-xs text-muted-foreground">
                                ({result.confidence}% {t('adminConfidence')})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{result.userName}</p>
                          <p className="text-sm mt-2">{result.reason}</p>
                          {result.details && (
                            <p className="text-xs text-muted-foreground mt-1">{result.details}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRetryAIVerification(result.documentId)}
                            className="text-purple-500 hover:text-purple-600"
                            title={t('adminRetry')}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          {result.status === 'invalid' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDocument(result.documentId)}
                              className="text-red-500 hover:text-red-600"
                              title={t('adminDelete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIResultsDialog(false)}>
                {t('adminClose')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDocumentVerification;
