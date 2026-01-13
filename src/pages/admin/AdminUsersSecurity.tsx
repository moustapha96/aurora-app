import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, Shield, Fingerprint, Smartphone, Monitor, CheckCircle, XCircle, Clock, Mail, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, type Locale } from 'date-fns';
import { fr, enUS, es, de, it, ptBR, ar, zhCN, ja, ru } from 'date-fns/locale';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { useLanguage } from '@/contexts/LanguageContext';

// Map language codes to date-fns locales
const localeMap: Record<string, Locale> = {
  fr, en: enUS, es, de, it, pt: ptBR, ar, zh: zhCN, ja, ru
};

interface UserSecurity {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  biometric_enabled: boolean;
  webauthn_enabled: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  webauthn_devices_count: number;
  last_activity: string | null;
}

const AdminUsersSecurity = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserSecurity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [disabling2FA, setDisabling2FA] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, biometric_enabled, webauthn_enabled, two_factor_enabled, created_at, updated_at');

      if (profilesError) throw profilesError;

      // Get WebAuthn credentials count for each user
      const { data: credentials, error: credentialsError } = await supabase
        .from('webauthn_credentials')
        .select('user_id');

      if (credentialsError) throw credentialsError;

      // Get last activity from activity_logs
      const { data: activityLogs } = await supabase
        .from('activity_logs')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      // Count credentials per user
      const credentialCounts: Record<string, number> = {};
      credentials?.forEach(cred => {
        credentialCounts[cred.user_id] = (credentialCounts[cred.user_id] || 0) + 1;
      });

      // Get last activity per user
      const lastActivity: Record<string, string> = {};
      activityLogs?.forEach(log => {
        if (log.user_id && !lastActivity[log.user_id]) {
          lastActivity[log.user_id] = log.created_at;
        }
      });

      const usersWithSecurity: UserSecurity[] = (profiles || []).map(profile => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        biometric_enabled: profile.biometric_enabled || false,
        webauthn_enabled: profile.webauthn_enabled || false,
        two_factor_enabled: profile.two_factor_enabled || false,
        created_at: profile.created_at || '',
        updated_at: profile.updated_at || '',
        webauthn_devices_count: credentialCounts[profile.id] || 0,
        last_activity: lastActivity[profile.id] || null
      }));

      setUsers(usersWithSecurity);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(user =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = filteredUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredUsers.length);

  const getSecurityLevel = (user: UserSecurity) => {
    const hasWebAuthn = user.webauthn_enabled && user.webauthn_devices_count > 0;
    const hasBiometric = user.biometric_enabled;
    const has2FA = user.two_factor_enabled;
    
    if ((hasWebAuthn && hasBiometric) || (hasWebAuthn && has2FA) || (hasBiometric && has2FA)) return { level: 'high', label: t('adminUsersSecurityLevelHigh'), color: 'bg-green-500' };
    if (hasWebAuthn || hasBiometric || has2FA) return { level: 'medium', label: t('adminUsersSecurityLevelMedium'), color: 'bg-yellow-500' };
    return { level: 'low', label: t('adminUsersSecurityLevelBasic'), color: 'bg-red-500' };
  };

  const handleDisable2FA = async (userId: string, userName: string) => {
    setDisabling2FA(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: false })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, two_factor_enabled: false } : u
      ));

      toast({
        title: t('admin2FADisabledTitle'),
        description: t('admin2FADisabledDesc').replace('{name}', userName),
      });
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: t('errorTitle'),
        description: t('admin2FADisableError'),
        variant: "destructive",
      });
    } finally {
      setDisabling2FA(null);
    }
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return t('adminUsersSecurityNever');
    const activityDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) return t('adminOnline');
    if (diffMins < 60) return t('adminMinutesAgo').replace('{minutes}', diffMins.toString());
    if (diffMins < 1440) return t('adminHoursAgo').replace('{hours}', Math.floor(diffMins / 60).toString());
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
    const locale = localeMap[language] || fr;
    return format(activityDate, 'dd MMM yyyy', { locale });
  };

  const getActivityStatus = (date: string | null) => {
    if (!date) return 'offline';
    const diffMs = new Date().getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 5) return 'online';
    if (diffMins < 30) return 'away';
    return 'offline';
  };

  const stats = {
    total: users.length,
    withWebAuthn: users.filter(u => u.webauthn_enabled).length,
    withBiometric: users.filter(u => u.biometric_enabled).length,
    with2FA: users.filter(u => u.two_factor_enabled).length,
    highSecurity: users.filter(u => getSecurityLevel(u).level === 'high').length
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('adminUsersSecurityTitle')}</h1>
          <p className="text-muted-foreground">{t('adminUsersSecurityDescription')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">{t('adminUsersSecurityUsers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Monitor className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withWebAuthn}</p>
                  <p className="text-sm text-muted-foreground">{t('adminUsersSecurityWebAuthnEnabled')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withBiometric}</p>
                  <p className="text-sm text-muted-foreground">{t('adminUsersSecurityBiometricMobile')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Fingerprint className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highSecurity}</p>
                  <p className="text-sm text-muted-foreground">{t('adminUsersSecurityHighSecurity')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('adminUsersSecurityUsersList')}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('adminUsersSecuritySearchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{t('adminUsersSecurityLoading')}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('adminUsersSecurityTableUser')}</TableHead>
                      <TableHead>{t('adminUsersSecurityTableStatus')}</TableHead>
                      <TableHead>{t('adminUsersSecurityTable2FA')}</TableHead>
                      <TableHead>{t('adminUsersSecurityTableWebAuthn')}</TableHead>
                      <TableHead>{t('adminUsersSecurityTableBiometricMobile')}</TableHead>
                      <TableHead>{t('adminUsersSecurityTableDevices')}</TableHead>
                      <TableHead>{t('adminUsersSecurityTableSecurityLevel')}</TableHead>
                      <TableHead>{t('adminUsersSecurityTableActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => {
                      const securityLevel = getSecurityLevel(user);
                      const activityStatus = getActivityStatus(user.last_activity);
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={user.avatar_url || ''} />
                                  <AvatarFallback className="bg-gold/20 text-gold">
                                    {user.first_name[0]}{user.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                                  activityStatus === 'online' ? 'bg-green-500' :
                                  activityStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t('adminUsersSecurityRegisteredOn')} {format(new Date(user.created_at), 'dd MMM yyyy', { locale: localeMap[language] || fr })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={activityStatus === 'online' ? 'default' : 'secondary'} className={
                              activityStatus === 'online' ? 'bg-green-500' :
                              activityStatus === 'away' ? 'bg-yellow-500' : ''
                            }>
                              {activityStatus === 'online' ? t('adminOnline') :
                               activityStatus === 'away' ? t('adminAway') : t('adminOffline')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.two_factor_enabled ? (
                              <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">{t('adminUsersSecurityEnabled')}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm">{t('adminUsersSecurityDisabled')}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.webauthn_enabled ? (
                              <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">{t('adminUsersSecurityEnabled')}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm">{t('adminUsersSecurityDisabled')}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.biometric_enabled ? (
                              <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">{t('adminUsersSecurityEnabled')}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm">{t('adminUsersSecurityDisabled')}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.webauthn_devices_count} {user.webauthn_devices_count !== 1 ? t('adminUsersSecurityDevices') : t('adminUsersSecurityDevice')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${securityLevel.color} text-white`}>
                              {securityLevel.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.two_factor_enabled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisable2FA(user.id, `${user.first_name} ${user.last_name}`)}
                                disabled={disabling2FA === user.id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <ShieldOff className="h-4 w-4 mr-1" />
                                {t('admin2FADisable')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

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

export default AdminUsersSecurity;
