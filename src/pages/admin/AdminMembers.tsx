import { useState, useEffect } from 'react';
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
import { Search, MoreVertical, Eye, Edit, Shield, Trash2, UserX, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
}

const AdminMembers = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, members]);

  const loadMembers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const membersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        is_admin: adminIds.has(profile.id),
      }));

      setMembers(membersWithRoles);
      setFilteredMembers(membersWithRoles);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Erreur lors du chargement des membres');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMembers = () => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => 
      member.first_name?.toLowerCase().includes(query) ||
      member.last_name?.toLowerCase().includes(query) ||
      member.job_function?.toLowerCase().includes(query) ||
      member.country?.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
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
        toast.success(`Rôle admin retiré à ${member.first_name}`);
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: member.id, role: 'admin' });

        if (error) throw error;
        toast.success(`Rôle admin attribué à ${member.first_name}`);
      }

      loadMembers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast.error('Erreur lors de la modification du rôle');
    }
  };

  const confirmDelete = (member: Member) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const deleteMember = async () => {
    if (!selectedMember) return;

    try {
      // Delete all related data
      await supabase.from('messages').delete().eq('sender_id', selectedMember.id);
      await supabase.from('conversation_members').delete().eq('user_id', selectedMember.id);
      await supabase.from('friendships').delete().or(`user_id.eq.${selectedMember.id},friend_id.eq.${selectedMember.id}`);
      await supabase.from('connection_requests').delete().or(`requester_id.eq.${selectedMember.id},recipient_id.eq.${selectedMember.id}`);
      await supabase.from('business_content').delete().eq('user_id', selectedMember.id);
      await supabase.from('family_content').delete().eq('user_id', selectedMember.id);
      await supabase.from('sports_hobbies').delete().eq('user_id', selectedMember.id);
      await supabase.from('artwork_collection').delete().eq('user_id', selectedMember.id);
      await supabase.from('destinations').delete().eq('user_id', selectedMember.id);
      await supabase.from('social_influence').delete().eq('user_id', selectedMember.id);
      await supabase.from('user_roles').delete().eq('user_id', selectedMember.id);
      await supabase.from('profiles').delete().eq('id', selectedMember.id);

      toast.success(`Membre ${selectedMember.first_name} supprimé`);
      setDeleteDialogOpen(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gestion des Membres</h1>
          <p className="text-muted-foreground">Gérez tous les membres de la plateforme</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Liste des Membres ({filteredMembers.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
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
                                <Badge variant="outline" className="text-xs">Fondateur</Badge>
                              )}
                              {member.is_patron && (
                                <Badge variant="outline" className="text-xs">Mécène</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.job_function || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.country || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.created_at || '').toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {member.is_admin ? (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Membre</Badge>
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
                              Voir le profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/edit-profile?id=${member.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleAdminRole(member)}>
                              <Shield className="h-4 w-4 mr-2" />
                              {member.is_admin ? 'Retirer admin' : 'Attribuer admin'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmDelete(member)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes les données de {selectedMember?.first_name} {selectedMember?.last_name} seront définitivement supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={deleteMember} className="bg-destructive text-destructive-foreground">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMembers;
