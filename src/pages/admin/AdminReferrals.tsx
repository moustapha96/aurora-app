import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPagination } from "@/components/ui/admin-pagination";
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
  Trash2
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
  created_at: string;
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
  const { t } = useLanguage();
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Pagination states
  const [linksPage, setLinksPage] = useState(1);
  const [linkedPage, setLinkedPage] = useState(1);
  const [referralsPage, setReferralsPage] = useState(1);
  const pageSize = 10;

  // Stats
  const [stats, setStats] = useState({
    totalLinks: 0,
    familyLinks: 0,
    totalClicks: 0,
    totalRegistrations: 0,
    linkedAccounts: 0,
    pendingReferrals: 0,
    confirmedReferrals: 0
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
        setStats(prev => ({ ...prev, pendingReferrals: pending, confirmedReferrals: confirmed }));
      }

    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (linkCode: string, linkId: string) => {
    const url = `${window.location.origin}/register?link=${linkCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    toast.success("Lien copié !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm("Supprimer ce lien ?")) return;
    
    try {
      const { error } = await supabase
        .from('referral_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      toast.success(t('adminLinkDeleted'));
      loadData();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
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

  // Pagination
  const paginatedLinks = filteredLinks.slice((linksPage - 1) * pageSize, linksPage * pageSize);
  const paginatedLinked = filteredLinked.slice((linkedPage - 1) * pageSize, linkedPage * pageSize);
  const paginatedReferrals = filteredReferrals.slice((referralsPage - 1) * pageSize, referralsPage * pageSize);

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
          <h1 className="text-2xl font-bold">Parrainages & Liens</h1>
          <p className="text-muted-foreground">Gérez les liens de parrainage, comptes liés et invitations</p>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalLinks}</span>
            </div>
            <p className="text-xs text-muted-foreground">Liens créés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-2xl font-bold">{stats.familyLinks}</span>
            </div>
            <p className="text-xs text-muted-foreground">Liens famille</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.totalClicks}</span>
            </div>
            <p className="text-xs text-muted-foreground">Clics totaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.totalRegistrations}</span>
            </div>
            <p className="text-xs text-muted-foreground">Inscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-bold">{stats.linkedAccounts}</span>
            </div>
            <p className="text-xs text-muted-foreground">Comptes liés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-yellow-500 border-yellow-500">En attente</Badge>
              <span className="text-2xl font-bold">{stats.pendingReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground">Parrainages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500">Confirmés</Badge>
              <span className="text-2xl font-bold">{stats.confirmedReferrals}</span>
            </div>
            <p className="text-xs text-muted-foreground">Parrainages</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList>
          <TabsTrigger value="links">Liens ({filteredLinks.length})</TabsTrigger>
          <TabsTrigger value="linked">Comptes liés ({filteredLinked.length})</TabsTrigger>
          <TabsTrigger value="referrals">Parrainages ({filteredReferrals.length})</TabsTrigger>
        </TabsList>

        {/* Links Tab */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Liens de parrainage</CardTitle>
              <CardDescription>Tous les liens créés par les membres</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Clics</TableHead>
                    <TableHead>Inscriptions</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Actions</TableHead>
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
                          <Badge variant="outline" className="text-amber-500 border-amber-500">Famille</Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>{link.click_count || 0}</TableCell>
                      <TableCell>{link.registration_count || 0}</TableCell>
                      <TableCell>
                        {link.is_active ? (
                          <Badge className="bg-green-500/20 text-green-500">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
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
              <CardTitle>Comptes liés</CardTitle>
              <CardDescription>Membres associés à d'autres membres (famille)</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLinked.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun compte lié pour le moment</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sponsor</TableHead>
                        <TableHead>Compte lié</TableHead>
                        <TableHead>Type de relation</TableHead>
                        <TableHead>Créé le</TableHead>
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
              <CardTitle>Parrainages</CardTitle>
              <CardDescription>Historique des parrainages entre membres</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parrain</TableHead>
                    <TableHead>Filleul</TableHead>
                    <TableHead>Code utilisé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
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
                        {referral.status === 'confirmed' ? (
                          <Badge className="bg-green-500/20 text-green-500">Confirmé</Badge>
                        ) : referral.status === 'pending' ? (
                          <Badge className="bg-yellow-500/20 text-yellow-500">En attente</Badge>
                        ) : (
                          <Badge variant="secondary">{referral.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(referral.created_at)}</TableCell>
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
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
