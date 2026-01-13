import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Shield, ShieldOff, Loader2, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserWithRole {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  job_function: string | null;
  is_admin: boolean;
}

const AdminRoles = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admins' | 'members'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter]);

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, job_function')
        .order('first_name');

      if (profilesError) throw profilesError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        is_admin: adminIds.has(profile.id),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('adminLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by role
    if (filter === 'admins') {
      result = result.filter(u => u.is_admin);
    } else if (filter === 'members') {
      result = result.filter(u => !u.is_admin);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [users, searchQuery, filter]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = filteredUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredUsers.length);

  const toggleAdminRole = async (user: UserWithRole) => {
    try {
      if (user.is_admin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success(t('adminRoleRemoved'));
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });

        if (error) throw error;
        toast.success(t('adminRoleAssigned').replace('{name}', `${user.first_name} ${user.last_name}`));
      }

      loadUsers();
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error(t('adminModificationError'));
    }
  };

  const adminCount = users.filter(u => u.is_admin).length;
  const memberCount = users.filter(u => !u.is_admin).length;

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
          <h1 className="text-3xl font-bold text-foreground">{t('adminRolesManagement')}</h1>
          <p className="text-muted-foreground">{t('adminRolesDescription')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">{t('adminTotalUsers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filter === 'admins' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('admins')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <ShieldCheck className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{adminCount}</p>
                  <p className="text-sm text-muted-foreground">{t('adminAdministrators')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${filter === 'members' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('members')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{memberCount}</p>
                  <p className="text-sm text-muted-foreground">{t('adminStandardMembers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('adminUsers')}</CardTitle>
                <CardDescription>
                  {filter === 'all' && t('adminAllUsers')}
                  {filter === 'admins' && t('adminAdminsOnly')}
                  {filter === 'members' && t('adminMembersOnly')}
                </CardDescription>
              </div>
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
                <div className="space-y-3">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.job_function || t('adminNoFunction')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {user.is_admin ? (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                            <Shield className="h-3 w-3 mr-1" />
                            {t('adminRoleLabel')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t('member')}</Badge>
                        )}

                        <Button
                          variant={user.is_admin ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleAdminRole(user)}
                        >
                          {user.is_admin ? (
                            <>
                              <ShieldOff className="h-4 w-4 mr-2" />
                              {t('adminRemoveAdmin')}
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              {t('adminAssignAdmin')}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {paginatedUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('adminNoUserFound')}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filteredUsers.length > 0 && (
                  <AdminPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredUsers.length}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    startIndex={startIndex}
                    endIndex={endIndex}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
