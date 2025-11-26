import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Users,
  Search,
  Edit,
  RefreshCw,
  UserPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  email: string;
  first_name: string;
  last_name: string;
  username: string | null;
  avatar_url: string | null;
}

const AdminRoles = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    loadRoles();
    loadAvailableUsers();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      
      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (rolesError) throw rolesError;

      // Get all users from auth
      // Get all profiles (admins can see all)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      if (profilesError) throw profilesError;

      // Try to get auth users info
      let authUsersMap = new Map<string, { email: string }>();
      try {
        const { data: authUsers } = await supabase.rpc('get_all_users_auth_info' as any);
        if (authUsers && Array.isArray(authUsers)) {
          authUsers.forEach((user: any) => {
            authUsersMap.set(user.id, { email: user.email || '' });
          });
        }
      } catch (e) {
        console.warn('Could not fetch auth users info');
      }

      // Combine data
      const rolesData: UserRole[] = roles?.map(role => {
        const authUser = authUsersMap.get(role.user_id);
        const profile = profiles?.find(p => p.id === role.user_id);
        
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as 'admin' | 'member',
          email: authUser?.email || '',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          username: profile?.username || null,
          avatar_url: profile?.avatar_url || null,
        };
      }) || [];

      setUserRoles(rolesData);
    } catch (error: any) {
      console.error('Error loading roles:', error);
      toast.error(t('errorLoadingRoles'));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // Get all profiles (users without roles)
      const { data: profiles } = await supabase.from('profiles').select('id');
      const { data: roles } = await supabase.from('user_roles').select('user_id');
      
      const usersWithRoles = new Set(roles?.map(r => r.user_id) || []);
      const profilesWithoutRoles = profiles?.filter(p => !usersWithRoles.has(p.id)) || [];
      
      // Try to get email info for these users
      const available: any[] = [];
      for (const profile of profilesWithoutRoles) {
        try {
          const { data: authInfo } = await supabase.rpc('get_user_auth_info' as any, {
            _user_id: profile.id
          });
          if (authInfo && Array.isArray(authInfo) && authInfo.length > 0) {
            available.push({
              id: profile.id,
              email: authInfo[0].email || ''
            });
          } else {
            available.push({
              id: profile.id,
              email: ''
            });
          }
        } catch (e) {
          available.push({
            id: profile.id,
            email: ''
          });
        }
      }
      
      setAvailableUsers(available);
    } catch (error: any) {
      console.error('Error loading available users:', error);
    }
  };

  const handleEdit = (userRole: UserRole) => {
    setSelectedUser(userRole);
    setNewRole(userRole.role);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      // Remove old role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newRole,
        });

      if (error) throw error;

      toast.success(t('roleUpdated'));
      setEditDialogOpen(false);
      loadRoles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUserId) {
      toast.error(t('selectUser'));
      return;
    }

    try {
      // Check if user already has a role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', selectedUserId)
        .maybeSingle();

      if (existing) {
        toast.error(t('userAlreadyHasRole'));
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserId,
          role: newRole,
        });

      if (error) throw error;

      toast.success(t('roleAdded'));
      setAddDialogOpen(false);
      setSelectedUserId("");
      loadRoles();
      loadAvailableUsers();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast.error(`Erreur lors de l'ajout: ${error.message}`);
    }
  };

  const filteredRoles = userRoles.filter(role =>
    role.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gold">{t('loading')}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('roleManagement')}</h1>
            <p className="text-gold/60">{t('roleManagementInfo')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={loadRoles}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('refresh')}
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              variant="outline"
              className="border-gold hover:bg-gold hover:text-black text-gold"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t('addRole')}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold/60 w-4 h-4" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black border-gold/30 text-gold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Roles Table */}
        <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold">
              {filteredRoles.length} {filteredRoles.length > 1 ? t('rolesAssignedPlural') : t('rolesAssigned')}
            </CardTitle>
            <CardDescription className="text-gold/60">
              {t('roleManagementInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12 text-gold/60">
                {t('noRolesAssigned')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/20">
                    <TableHead className="text-gold">{t('user')}</TableHead>
                    <TableHead className="text-gold">{t('email')}</TableHead>
                    <TableHead className="text-gold">{t('currentRole')}</TableHead>
                    <TableHead className="text-gold">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((userRole) => (
                    <TableRow key={userRole.id} className="border-gold/10">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10 border border-gold/30">
                            <AvatarImage src={userRole.avatar_url || undefined} />
                            <AvatarFallback className="bg-gold/20 text-gold">
                              {userRole.first_name[0]}{userRole.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-gold font-medium">
                              {userRole.first_name} {userRole.last_name}
                            </div>
                            {userRole.username && (
                              <div className="text-gold/60 text-xs">@{userRole.username}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gold/80">{userRole.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            userRole.role === 'admin'
                              ? 'bg-gold/10 text-gold border-gold/30'
                              : 'bg-blue-900/20 text-blue-400 border-blue-500/30'
                          }
                        >
                          {userRole.role === 'admin' ? t('admin') : t('member')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(userRole)}
                          className="text-gold hover:bg-gold/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-black border-gold/20 text-gold">
            <DialogHeader>
              <DialogTitle>{t('editRole')}</DialogTitle>
              <DialogDescription className="text-gold/60">
                {t('editRoleFor')} {selectedUser?.first_name} {selectedUser?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-gold/80 text-sm">{t('newRole')}</label>
                <Select value={newRole} onValueChange={(value: 'admin' | 'member') => setNewRole(value)}>
                  <SelectTrigger className="bg-black border-gold/30 text-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/30">
                    <SelectItem value="admin" className="text-gold">Admin</SelectItem>
                    <SelectItem value="member" className="text-gold">Membre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="text-gold border-gold/30"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="text-gold border-gold hover:bg-gold hover:text-black"
              >
                {t('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Role Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="bg-black border-gold/20 text-gold">
            <DialogHeader>
              <DialogTitle>{t('addRoleTitle')}</DialogTitle>
              <DialogDescription className="text-gold/60">
                {t('assignRoleToUser')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-gold/80 text-sm">Utilisateur</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-black border-gold/30 text-gold">
                    <SelectValue placeholder={t('selectUser')} />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/30">
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="text-gold">
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-gold/80 text-sm">Rôle</label>
                <Select value={newRole} onValueChange={(value: 'admin' | 'member') => setNewRole(value)}>
                  <SelectTrigger className="bg-black border-gold/30 text-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/30">
                    <SelectItem value="admin" className="text-gold">Admin</SelectItem>
                    <SelectItem value="member" className="text-gold">Membre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="text-gold border-gold/30"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleAddRole}
                className="text-gold border-gold hover:bg-gold hover:text-black"
              >
                {t('add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;

