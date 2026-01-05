import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreVertical, Eye, Edit, Shield, Trash2, UserX, UserCheck, Loader2, FlaskConical, RotateCcw, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { VerificationBadge, VerificationStatus } from '@/components/VerificationBadge';
import { AdminPagination } from '@/components/ui/admin-pagination';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_function: string | null;
  country: string | null;
  created_at: string;
  is_founder: boolean;
  is_patron: boolean;
  is_admin?: boolean;
  identity_verified?: boolean;
  account_active?: boolean;
  identity_status?: string;
  email?: string;
  account_number?: string | null;
}

const AdminMembers = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [testModeEnabled, setTestModeEnabled] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadMembers();
    loadTestMode();
  }, []);

  const loadTestMode = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'test_mode_enabled')
        .maybeSingle();
      
      setTestModeEnabled(data?.setting_value === 'true');
    } catch (error) {
      console.error('Error loading test mode:', error);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      
      // Get all profiles - fetch in parallel for better performance
      const [profilesResult, adminRolesResult, verificationsResult, emailsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin'),
        supabase
          .from('identity_verifications')
          .select('user_id, status'),
        supabase.rpc('get_user_emails_for_admin')
      ]);

      // Handle profiles error - this is critical
      if (profilesResult.error) {
        console.error('Profiles error:', profilesResult.error);
        throw new Error(`Erreur profiles: ${profilesResult.error.message}`);
      }

      // Admin roles, verifications and emails are optional - don't fail if they error
      if (adminRolesResult.error) {
        console.warn('Admin roles error (non-critical):', adminRolesResult.error);
      }
      
      if (verificationsResult.error) {
        console.warn('Verifications error (non-critical):', verificationsResult.error);
      }

      if (emailsResult.error) {
        console.warn('Emails error (non-critical):', emailsResult.error);
      }

      const profiles = profilesResult.data || [];
      const adminRoles = adminRolesResult.data || [];
      const verifications = verificationsResult.data || [];
      const emails = emailsResult.data || [];

      const adminIds = new Set(adminRoles.map(r => r.user_id));
      const verificationMap = new Map(verifications.map(v => [v.user_id, v.status]));
      const emailMap = new Map(emails.map((e: { user_id: string; email: string }) => [e.user_id, e.email]));

      const membersWithRoles = profiles.map(profile => ({
        ...profile,
        is_admin: adminIds.has(profile.id),
        identity_status: verificationMap.get(profile.id) || 'not_verified',
        email: emailMap.get(profile.id) || '',
      }));

      setMembers(membersWithRoles);
    } catch (error: any) {
      console.error('Error loading members:', error);
      toast.error(error?.message || t('adminErrorLoadingMembers'));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    
    const query = searchQuery.toLowerCase();
    return members.filter(member => 
      member.first_name?.toLowerCase().includes(query) ||
      member.last_name?.toLowerCase().includes(query) ||
      member.job_function?.toLowerCase().includes(query) ||
      member.country?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Paginate filtered members
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const startIndex = filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredMembers.length);

  const getIdentityStatus = (member: Member): VerificationStatus => {
    if (member.identity_verified) return 'verified';
    
    switch (member.identity_status) {
      case 'approved':
      case 'verified':
        return 'verified';
      case 'pending':
        return 'pending';
      case 'initiated':
        return 'initiated';
      case 'declined':
      case 'rejected':
        return 'rejected';
      case 'review':
      case 'review_needed':
        return 'review_needed';
      default:
        return 'not_verified';
    }
  };

  const toggleAdminRole = async (member: Member) => {
    try {
      if (member.is_admin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', member.id)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success(`${t('adminRoleRemoved')} ${member.first_name}`);
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: member.id, role: 'admin' });

        if (error) throw error;
        toast.success(`${t('adminRoleGranted')} ${member.first_name}`);
      }

      loadMembers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast.error(t('adminErrorModifyingRole'));
    }
  };

  const toggleAccountStatus = async (member: Member) => {
    try {
      const newStatus = !member.account_active;

      const { error } = await supabase.functions.invoke('admin-set-account-active', {
        body: { userId: member.id, active: newStatus },
      });

      if (error) throw error;

      toast.success(
        newStatus
          ? `${t('adminAccountActivated')} ${member.first_name}`
          : `${t('adminAccountDeactivated')} ${member.first_name}`
      );

      loadMembers();
    } catch (error: any) {
      console.error('Error toggling account status:', error);
      toast.error(error?.message || t('adminErrorModifyingStatus'));
    }
  };

  const resetVerification = async (member: Member) => {
    try {
      const { error } = await supabase.functions.invoke('admin-reset-verification', {
        body: { userId: member.id },
      });

      if (error) throw error;

      toast.success(`${t('verificationResetSuccess')} ${member.first_name}`);
      loadMembers();
    } catch (error: any) {
      console.error('Error resetting verification:', error);
      toast.error(error?.message || t('verificationResetError'));
    }
  };

  const sendPasswordReset = async (member: Member) => {
    if (!member.email) {
      toast.error(t('emailNotFound'));
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-send-password-reset', {
        body: { 
          userEmail: member.email,
          redirectUrl: `${window.location.origin}/reset-password`
        },
      });

      if (error) throw error;

      toast.success(`${t('passwordResetEmailSent')} ${member.email}`);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error(error?.message || t('passwordResetEmailError'));
    }
  };

  const confirmDelete = (member: Member) => {
    if (!testModeEnabled) {
      toast.error(t('adminDeleteOnlyTestMode'));
      return;
    }

    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const deleteMember = async () => {
    if (!selectedMember) return;
    if (!testModeEnabled) {
      toast.error(t('adminDeleteOnlyTestMode'));
      return;
    }

    setIsDeleting(true);
    const memberToDelete = selectedMember;

    try {
      const { error } = await supabase.functions.invoke('admin-delete-member', {
        body: { userId: memberToDelete.id },
      });

      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      toast.success(`${t('adminMemberDeleted')} ${memberToDelete.first_name}`);
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error(t('adminErrorDeleting'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('adminMembersManagement')}</h1>
          <p className="text-muted-foreground">{t('adminManageAllMembers')}</p>
          
          {testModeEnabled && (
            <Alert className="mt-4 border-purple-500/50 bg-purple-500/10">
              <FlaskConical className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-purple-500">
                {t('adminTestModeActive')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('adminMembersList')} ({filteredMembers.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('member')}</TableHead>
                      <TableHead>{t('accountNumber')}</TableHead>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead>{t('jobFunction')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('identityCard')}</TableHead>
                      <TableHead>{t('role')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {member.first_name?.[0]}{member.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {member.first_name} {member.last_name}
                              </p>
                              <div className="flex gap-1">
                                {member.is_founder && (
                                  <Badge variant="outline" className="text-xs">{t('founderLabel')}</Badge>
                                )}
                                {member.is_patron && (
                                  <Badge variant="outline" className="text-xs">{t('patronLabel')}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {member.account_number || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {member.email || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.job_function || '-'}
                        </TableCell>
                        <TableCell>
                          {(member.account_active || member.identity_verified) ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              {t('active')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              {t('inactive')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <VerificationBadge 
                            status={getIdentityStatus(member)} 
                            type="identity" 
                            size="sm" 
                          />
                        </TableCell>
                        <TableCell>
                          {member.is_admin ? (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                              {t('admin')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t('member')}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/profile/${member.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t('viewProfile')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/edit-profile?id=${member.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleAdminRole(member)}>
                                <Shield className="h-4 w-4 mr-2" />
                                {member.is_admin ? t('adminRemoveAdmin') : t('adminGrantAdmin')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleAccountStatus(member)}>
                                {member.account_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    {t('deactivateAccount')}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                                    <span className="text-green-500">{t('activateManually')}</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              {(member.identity_verified || member.identity_status !== 'not_verified') && (
                                <DropdownMenuItem onClick={() => resetVerification(member)}>
                                  <RotateCcw className="h-4 w-4 mr-2 text-orange-500" />
                                  <span className="text-orange-500">{t('resetVerificationCNI')}</span>
                                </DropdownMenuItem>
                              )}
                              {member.email && (
                                <DropdownMenuItem onClick={() => sendPasswordReset(member)}>
                                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                                  <span className="text-blue-500">{t('sendPasswordResetEmail')}</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {testModeEnabled && (
                                <DropdownMenuItem
                                  onClick={() => confirmDelete(member)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <FlaskConical className="h-4 w-4 mr-2" />
                                  {t('deleteTestMode')}
                                </DropdownMenuItem>
                              )}
                              {!testModeEnabled && (
                              <DropdownMenuItem
                                onClick={() => confirmDelete(member)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredMembers.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('adminDeleteMemberConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {`${t('adminDeleteMemberWarning')} ${selectedMember?.first_name} ${selectedMember?.last_name}`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteMember}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground"
              >
                {isDeleting ? t('deleting') : t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMembers;
