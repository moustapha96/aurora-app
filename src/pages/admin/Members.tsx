import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  Eye,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminLayout from "@/components/AdminLayout";

interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string | null;
  avatar_url: string | null;
  mobile_phone: string;
  created_at: string;
  email_confirmed_at: string | null;
  role: 'admin' | 'member';
  is_founder: boolean | null;
  is_patron: boolean | null;
}

const AdminMembers = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    mobile_phone: "",
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles (now admins can see all thanks to RLS policies)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      // Get all roles (now admins can see all thanks to RLS policies)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (rolesError) throw rolesError;

      // Try to get auth info via Edge Function or use profiles data
      let authUsersMap = new Map<string, { email: string; created_at: string; email_confirmed_at: string | null }>();
      
      try {
        // Try to get auth info via RPC function (if it exists)
        const { data: authUsers } = await supabase.rpc('get_all_users_auth_info' as any);
        if (authUsers && Array.isArray(authUsers)) {
          authUsers.forEach((user: any) => {
            authUsersMap.set(user.id, {
              email: user.email || '',
              created_at: user.created_at,
              email_confirmed_at: user.email_confirmed_at
            });
          });
        }
      } catch (rpcError) {
        console.warn('Could not fetch auth info via RPC, using profiles only:', rpcError);
      }

      // Combine data from profiles and roles
      const membersData: Member[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const authInfo = authUsersMap.get(profile.id);
        
        return {
          id: profile.id,
          email: authInfo?.email || '', // Will be empty if we can't access auth
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          username: profile.username || null,
          avatar_url: profile.avatar_url || null,
          mobile_phone: profile.mobile_phone || '',
          created_at: authInfo?.created_at || profile.created_at || new Date().toISOString(),
          email_confirmed_at: authInfo?.email_confirmed_at || null,
          role: (userRole?.role as 'admin' | 'member') || 'member',
          is_founder: profile.is_founder || null,
          is_patron: profile.is_patron || null,
        };
      });

      setMembers(membersData);
    } catch (error: any) {
      console.error('Error loading members:', error);
      toast.error(t('errorLoadingMembers'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      username: member.username || '',
      mobile_phone: member.mobile_phone,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          username: editForm.username || null,
          mobile_phone: editForm.mobile_phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast.success(t('memberUpdated'));
      setEditDialogOpen(false);
      loadMembers();
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error(t('error'));
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    try {
      // Delete user via Edge Function (requires service role)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('error') || 'No session');
        return;
      }

      const { error: functionError } = await supabase.functions.invoke('delete-user', {
        body: { user_id: selectedMember.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        // Fallback: try to delete user data only (profiles, roles)
        // This won't delete the auth user, but will remove all app data
        try {
          await supabase.rpc('delete_user_data' as any, {
            _user_id: selectedMember.id
          });
          toast.warning(t('memberDeleted') + ' (Note: Auth user may still exist)');
        } catch (fallbackError) {
          throw functionError;
        }
      } else {
        toast.success(t('memberDeleted'));
      }

      setDeleteDialogOpen(false);
      loadMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast.error(error.message || t('error'));
    }
  };

  const filteredMembers = members.filter(member =>
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ru' ? 'ru-RU' : language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <h1 className="text-3xl font-serif text-gold mb-2">{t('memberManagement')}</h1>
            <p className="text-gold/60">{t('membersList')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={loadMembers}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('refresh')}
            </Button>
            <Button
              onClick={() => navigate("/create-admin")}
              variant="outline"
              className="border-gold hover:bg-gold hover:text-black text-gold"
            >
              <Shield className="w-4 h-4 mr-2" />
              {t('createAdminButton')}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold/60 w-4 h-4" />
              <Input
                placeholder={t('searchMember')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black border-gold/30 text-gold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold">
              {filteredMembers.length} {filteredMembers.length > 1 ? t('membersShownPlural') : t('membersShown')}
            </CardTitle>
            <CardDescription className="text-gold/60">
              {t('membersList')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gold/60">
                {t('noMembersFound')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/20">
                    <TableHead className="text-gold">{t('member')}</TableHead>
                    <TableHead className="text-gold">{t('email')}</TableHead>
                    <TableHead className="text-gold">{t('role')}</TableHead>
                    <TableHead className="text-gold">{t('status')}</TableHead>
                    <TableHead className="text-gold">{t('registrationDate')}</TableHead>
                    <TableHead className="text-gold">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="border-gold/10">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10 border border-gold/30">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="bg-gold/20 text-gold">
                              {member.first_name[0]}{member.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-gold font-medium">
                              {member.first_name} {member.last_name}
                            </div>
                            {member.username && (
                              <div className="text-gold/60 text-xs">@{member.username}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gold/80">{member.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            member.role === 'admin'
                              ? 'bg-gold/10 text-gold border-gold/30'
                              : 'bg-blue-900/20 text-blue-400 border-blue-500/30'
                          }
                        >
                          {member.role === 'admin' ? t('admin') : t('member')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.email_confirmed_at ? (
                          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500/30">
                            {t('verified')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-500/30">
                            {t('unverified')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gold/60 text-sm">
                        {formatDate(member.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/profile/${member.id}`)}
                            className="text-gold hover:bg-gold/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(member)}
                            className="text-gold hover:bg-gold/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMember(member);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
              <DialogTitle>{t('editMember')}</DialogTitle>
              <DialogDescription className="text-gold/60">
                {t('editMemberInfo')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-gold/80 text-sm">{t('firstName')}</label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gold/80 text-sm">{t('lastName')}</label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gold/80 text-sm">{t('username')}</label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-gold/80 text-sm">{t('phone')}</label>
                <Input
                  value={editForm.mobile_phone}
                  onChange={(e) => setEditForm({ ...editForm, mobile_phone: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                />
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

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-black border-gold/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400">{t('deleteMember')}</AlertDialogTitle>
              <AlertDialogDescription className="text-gold/60">
                {t('confirmDeleteMember')} {selectedMember?.first_name} {selectedMember?.last_name} ? {t('deleteMemberWarning')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-gold border-gold/30">
                {t('cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMembers;

