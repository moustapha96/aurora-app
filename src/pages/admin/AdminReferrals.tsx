import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPagination } from "@/components/ui/admin-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Link2, 
  Users, 
  MousePointer, 
  UserPlus, 
  Search, 
  Loader2, 
  ExternalLink,
  Copy,
  Check,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ReferralLink {
  id: string;
  sponsor_id: string;
  link_code: string;
  link_name: string;
  referral_code: string;
  is_family_link: boolean;
  is_active: boolean;
  click_count: number;
  registration_count: number;
  created_at: string;
  expires_at: string | null;
  sponsor?: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

interface LinkedAccount {
  id: string;
  sponsor_id: string;
  linked_user_id: string;
  relation_type: string;
  created_at: string;
  sponsor?: {
    first_name: string;
    last_name: string;
    username: string;
  };
  linked_user?: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

interface Referral {
  id: string;
  sponsor_id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  sponsor_approved: boolean | null;
  sponsor_approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  sponsor?: {
    first_name: string;
    last_name: string;
    username: string;
  };
  referred?: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

const AdminReferrals = () => {
  const { t, language } = useLanguage();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Rejection dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [referralToReject, setReferralToReject] = useState<Referral | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Pagination states
  const [linksPage, setLinksPage] = useState(1);
  const [linkedPage, setLinkedPage] = useState(1);
  const [referralsPage, setReferralsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const pageSize = 10;

  // Stats
  const [stats, setStats] = useState({
    totalLinks: 0,
    familyLinks: 0,
    totalClicks: 0,
    totalRegistrations: 0,
    linkedAccounts: 0,
    pendingReferrals: 0,
    confirmedReferrals: 0,
    pendingApproval: 0,
    rejectedReferrals: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load referral links with sponsor info
      const { data: linksData, error: linksError } = await supabase
        .from('referral_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      // Get sponsor profiles for links
      if (linksData && linksData.length > 0) {
        const sponsorIds = [...new Set(linksData.map(l => l.sponsor_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username')
          .in('id', sponsorIds);

        const linksWithSponsors = linksData.map(link => ({
          ...link,
          sponsor: profiles?.find(p => p.id === link.sponsor_id)
        }));
        setLinks(linksWithSponsors);

        // Calculate stats
        const totalClicks = linksData.reduce((sum, l) => sum + (l.click_count || 0), 0);
        const totalRegistrations = linksData.reduce((sum, l) => sum + (l.registration_count || 0), 0);
        const familyLinks = linksData.filter(l => l.is_family_link).length;

        setStats(prev => ({
          ...prev,
          totalLinks: linksData.length,
          familyLinks,
          totalClicks,
          totalRegistrations
        }));
      }

      // Load linked accounts
      const { data: linkedData } = await supabase
        .from('linked_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (linkedData && linkedData.length > 0) {
        const allUserIds = [...new Set([
          ...linkedData.map(l => l.sponsor_id),
          ...linkedData.map(l => l.linked_user_id)
        ])];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username')
          .in('id', allUserIds);

        const linkedWithProfiles = linkedData.map(account => ({
          ...account,
          sponsor: profiles?.find(p => p.id === account.sponsor_id),
          linked_user: profiles?.find(p => p.id === account.linked_user_id)
        }));
        setLinkedAccounts(linkedWithProfiles);
        setStats(prev => ({ ...prev, linkedAccounts: linkedData.length }));
      }

      // Load referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (referralsData && referralsData.length > 0) {
        const allUserIds = [...new Set([
          ...referralsData.map(r => r.sponsor_id),
          ...referralsData.map(r => r.referred_id)
        ])];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username')
          .in('id', allUserIds);

        const referralsWithProfiles = referralsData.map(referral => ({
          ...referral,
          sponsor: profiles?.find(p => p.id === referral.sponsor_id),
          referred: profiles?.find(p => p.id === referral.referred_id)
        }));
        setReferrals(referralsWithProfiles);

        const pending = referralsData.filter(r => r.status === 'pending').length;
        const confirmed = referralsData.filter(r => r.status === 'confirmed').length;
        const pendingApproval = referralsData.filter(r => r.sponsor_approved === null || r.sponsor_approved === false).length;
        const rejected = referralsData.filter(r => r.sponsor_approved === false && r.rejection_reason).length;
        setStats(prev => ({ 
          ...prev, 
          pendingReferrals: pending, 
          confirmedReferrals: confirmed,
          pendingApproval,
          rejectedReferrals: rejected
        }));
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error(t('adminReferralsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  // Approve a referral (as admin)
  const handleApproveReferral = async (referral: Referral) => {
    setProcessingId(referral.id);
    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          sponsor_approved: true,
          sponsor_approved_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      if (error) throw error;

      toast.success(t('adminReferralApproved'));
      loadData();
    } catch (error) {
      console.error('Error approving referral:', error);
      toast.error(t('adminReferralApproveError'));
    } finally {
      setProcessingId(null);
    }
  };

  // Reject a referral (as admin)
  const handleRejectReferral = async () => {
    if (!referralToReject) return;
    
    setProcessingId(referralToReject.id);
    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          sponsor_approved: false,
          sponsor_approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || t('adminReferralRejectedByAdmin'),
          updated_at: new Date().toISOString()
        })
        .eq('id', referralToReject.id);

      if (error) throw error;

      toast.success(t('adminReferralRejected'));
      setShowRejectDialog(false);
      setReferralToReject(null);
      setRejectionReason("");
      loadData();
    } catch (error) {
      console.error('Error rejecting referral:', error);
      toast.error(t('adminReferralRejectError'));
    } finally {
      setProcessingId(null);
    }
  };

  // Open rejection dialog
  const openRejectDialog = (referral: Referral) => {
    setReferralToReject(referral);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  // Reset a rejected referral to pending
  const handleResetReferral = async (referral: Referral) => {
    setProcessingId(referral.id);
    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          sponsor_approved: null,
          sponsor_approved_at: null,
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      if (error) throw error;

      toast.success(t('adminReferralReset'));
      loadData();
    } catch (error) {
      console.error('Error resetting referral:', error);
      toast.error(t('adminReferralResetError'));
    } finally {
      setProcessingId(null);
    }
  };

  const copyLink = async (linkCode: string, linkId: string) => {
    const url = `${window.location.origin}/register?link=${linkCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    toast.success(t('adminReferralsLinkCopied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm(t('adminReferralsDeleteLinkConfirm'))) return;
    
    try {
      const { error } = await supabase
        .from('referral_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      toast.success(t('adminLinkDeleted'));
      loadData();
    } catch {
      toast.error(t('adminReferralsDeleteLinkError'));
    }
  };

  const formatDate = (dateString: string) => {
    const localeMap: Record<string, string> = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ar': 'ar-SA',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ru': 'ru-RU'
    };
    const locale = localeMap[language] || 'fr-FR';
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter functions
  const filteredLinks = links.filter(link => 
    link.link_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.link_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.sponsor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.sponsor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinked = linkedAccounts.filter(account =>
    account.sponsor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.sponsor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.linked_user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.linked_user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReferrals = referrals.filter(referral =>
    referral.sponsor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.sponsor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referred?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referred?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pending approval referrals (sponsor_approved is null or false with no rejection)
  const pendingApprovalReferrals = referrals.filter(r => 
    r.sponsor_approved === null || (r.sponsor_approved === false && !r.rejection_reason)
  );

  const filteredPendingApproval = pendingApprovalReferrals.filter(referral =>
    referral.sponsor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.sponsor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referred?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referred?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const paginatedLinks = filteredLinks.slice((linksPage - 1) * pageSize, linksPage * pageSize);
  const paginatedLinked = filteredLinked.slice((linkedPage - 1) * pageSize, linkedPage * pageSize);
  const paginatedReferrals = filteredReferrals.slice((referralsPage - 1) * pageSize, referralsPage * pageSize);
  const paginatedPendingApproval = filteredPendingApproval.slice((pendingPage - 1) * pageSize, pendingPage * pageSize);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('adminReferralsTitle')}</h1>
          <p className="text-muted-foreground">{t('adminReferralsDescription')}</p>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalLinks}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsLinksCreated')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-bold">{stats.familyLinks}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsFamilyLinks')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.totalClicks}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsTotalClicks')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.totalRegistrations}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsRegistrations')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-bold">{stats.linkedAccounts}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsLinkedAccounts')}</p>
          </CardContent>
        </Card>
        <Card className={stats.pendingApproval > 0 ? "border-amber-500 bg-amber-500/5" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-bold">{stats.pendingApproval}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsPendingApproval')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.confirmedReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsConfirmed')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold">{stats.rejectedReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('adminReferralsRejected')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('adminReferralsSearchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pending" className="gap-2">
            {filteredPendingApproval.length > 0 && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filteredPendingApproval.length}
              </span>
            )}
            {t('adminReferralsTabPending')}
          </TabsTrigger>
          <TabsTrigger value="links">{t('adminReferralsTabLinks')} ({filteredLinks.length})</TabsTrigger>
          <TabsTrigger value="linked">{t('adminReferralsTabLinked')} ({filteredLinked.length})</TabsTrigger>
          <TabsTrigger value="referrals">{t('adminReferralsTabReferrals')} ({filteredReferrals.length})</TabsTrigger>
        </TabsList>

        {/* Pending Approval Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                {t('adminReferralsPendingApprovalTitle')}
              </CardTitle>
              <CardDescription>{t('adminReferralsPendingApprovalDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPendingApproval.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">{t('adminReferralsNoPending')}</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('adminReferralsTableCandidate')}</TableHead>
                        <TableHead>{t('adminReferralsTableSponsor')}</TableHead>
                        <TableHead>{t('adminReferralsReferralsTableCodeUsed')}</TableHead>
                        <TableHead>{t('adminReferralsTableStatus')}</TableHead>
                        <TableHead>{t('adminReferralsReferralsTableDate')}</TableHead>
                        <TableHead className="text-right">{t('adminReferralsTableActions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPendingApproval.map((referral) => (
                        <TableRow key={referral.id} className="bg-amber-500/5">
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {referral.referred ? `${referral.referred.first_name} ${referral.referred.last_name}` : '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">@{referral.referred?.username}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {referral.sponsor ? `${referral.sponsor.first_name} ${referral.sponsor.last_name}` : '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">@{referral.sponsor?.username}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {referral.referral_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-500/20 text-amber-600">
                              <Clock className="w-3 h-3 mr-1" />
                              {t('adminReferralAwaitingApproval')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(referral.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveReferral(referral)}
                                disabled={processingId === referral.id}
                              >
                                {processingId === referral.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {t('adminReferralApprove')}
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openRejectDialog(referral)}
                                disabled={processingId === referral.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                {t('adminReferralReject')}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredPendingApproval.length > pageSize && (
                    <AdminPagination
                      currentPage={pendingPage}
                      totalPages={Math.ceil(filteredPendingApproval.length / pageSize)}
                      totalItems={filteredPendingApproval.length}
                      pageSize={pageSize}
                      onPageChange={setPendingPage}
                      onPageSizeChange={() => {}}
                      startIndex={(pendingPage - 1) * pageSize + 1}
                      endIndex={Math.min(pendingPage * pageSize, filteredPendingApproval.length)}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminReferralsLinksTitle')}</CardTitle>
              <CardDescription>{t('adminReferralsLinksDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('adminReferralsLinksTableName')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableSponsor')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableCode')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableType')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableClicks')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableRegistrations')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableStatus')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableCreated')}</TableHead>
                    <TableHead>{t('adminReferralsLinksTableActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.link_name || '-'}</TableCell>
                      <TableCell>
                        {link.sponsor ? `${link.sponsor.first_name} ${link.sponsor.last_name}` : '-'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {link.link_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {link.is_family_link ? (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">{t('adminReferralsLinksTypeFamily')}</Badge>
                        ) : (
                          <Badge variant="outline">{t('adminReferralsLinksTypeStandard')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{link.click_count || 0}</TableCell>
                      <TableCell>{link.registration_count || 0}</TableCell>
                      <TableCell>
                        {link.is_active ? (
                          <Badge className="bg-green-500/20 text-green-500">{t('adminReferralsLinksStatusActive')}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('adminReferralsLinksStatusInactive')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(link.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(link.link_code, link.id)}
                          >
                            {copiedId === link.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLink(link.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLinks.length > pageSize && (
                <AdminPagination
                  currentPage={linksPage}
                  totalPages={Math.ceil(filteredLinks.length / pageSize)}
                  totalItems={filteredLinks.length}
                  pageSize={pageSize}
                  onPageChange={setLinksPage}
                  onPageSizeChange={() => {}}
                  startIndex={(linksPage - 1) * pageSize + 1}
                  endIndex={Math.min(linksPage * pageSize, filteredLinks.length)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Linked Accounts Tab */}
        <TabsContent value="linked">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminReferralsLinkedTitle')}</CardTitle>
              <CardDescription>{t('adminReferralsLinkedDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLinked.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('adminReferralsLinkedEmpty')}</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('adminReferralsLinkedTableSponsor')}</TableHead>
                        <TableHead>{t('adminReferralsLinkedTableLinkedAccount')}</TableHead>
                        <TableHead>{t('adminReferralsLinkedTableRelationType')}</TableHead>
                        <TableHead>{t('adminReferralsLinkedTableCreated')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLinked.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            {account.sponsor ? `${account.sponsor.first_name} ${account.sponsor.last_name}` : '-'}
                          </TableCell>
                          <TableCell>
                            {account.linked_user ? `${account.linked_user.first_name} ${account.linked_user.last_name}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{account.relation_type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(account.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredLinked.length > pageSize && (
                    <AdminPagination
                      currentPage={linkedPage}
                      totalPages={Math.ceil(filteredLinked.length / pageSize)}
                      totalItems={filteredLinked.length}
                      pageSize={pageSize}
                      onPageChange={setLinkedPage}
                      onPageSizeChange={() => {}}
                      startIndex={(linkedPage - 1) * pageSize + 1}
                      endIndex={Math.min(linkedPage * pageSize, filteredLinked.length)}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminReferralsReferralsTitle')}</CardTitle>
              <CardDescription>{t('adminReferralsReferralsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('adminReferralsReferralsTableSponsor')}</TableHead>
                    <TableHead>{t('adminReferralsReferralsTableReferred')}</TableHead>
                    <TableHead>{t('adminReferralsReferralsTableCodeUsed')}</TableHead>
                    <TableHead>{t('adminReferralsTableApprovalStatus')}</TableHead>
                    <TableHead>{t('adminReferralsReferralsTableStatus')}</TableHead>
                    <TableHead>{t('adminReferralsReferralsTableDate')}</TableHead>
                    <TableHead>{t('adminReferralsTableActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {referral.sponsor ? `${referral.sponsor.first_name} ${referral.sponsor.last_name}` : '-'}
                      </TableCell>
                      <TableCell>
                        {referral.referred ? `${referral.referred.first_name} ${referral.referred.last_name}` : '-'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {referral.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {referral.sponsor_approved === true ? (
                          <Badge className="bg-green-500/20 text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('adminReferralApprovedStatus')}
                          </Badge>
                        ) : referral.sponsor_approved === false && referral.rejection_reason ? (
                          <Badge className="bg-red-500/20 text-red-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('adminReferralRejectedStatus')}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {t('adminReferralAwaitingApproval')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {referral.status === 'confirmed' ? (
                          <Badge className="bg-green-500/20 text-green-500">{t('adminReferralsReferralsStatusConfirmed')}</Badge>
                        ) : referral.status === 'pending' ? (
                          <Badge className="bg-yellow-500/20 text-yellow-500">{t('adminReferralsReferralsStatusPending')}</Badge>
                        ) : (
                          <Badge variant="secondary">{referral.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(referral.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {referral.sponsor_approved !== true && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveReferral(referral)}
                              disabled={processingId === referral.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              {processingId === referral.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          {referral.sponsor_approved !== false && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRejectDialog(referral)}
                              disabled={processingId === referral.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {referral.sponsor_approved === false && referral.rejection_reason && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetReferral(referral)}
                              disabled={processingId === referral.id}
                              className="text-amber-600 hover:text-amber-700"
                              title={t('adminReferralResetTooltip')}
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredReferrals.length > pageSize && (
                <AdminPagination
                  currentPage={referralsPage}
                  totalPages={Math.ceil(filteredReferrals.length / pageSize)}
                  totalItems={filteredReferrals.length}
                  pageSize={pageSize}
                  onPageChange={setReferralsPage}
                  onPageSizeChange={() => {}}
                  startIndex={(referralsPage - 1) * pageSize + 1}
                  endIndex={Math.min(referralsPage * pageSize, filteredReferrals.length)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminReferralRejectTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('adminReferralRejectDescription')}
              {referralToReject && (
                <span className="font-medium text-foreground">
                  {' '}{referralToReject.referred?.first_name} {referralToReject.referred?.last_name}
                </span>
              )}
            </p>
            <Textarea
              placeholder={t('adminReferralRejectReasonPlaceholder')}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectReferral}
              disabled={processingId === referralToReject?.id}
            >
              {processingId === referralToReject?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              {t('adminReferralConfirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
