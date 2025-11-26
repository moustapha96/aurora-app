import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, User } from "lucide-react";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface NewConversationDialogProps {
  onConversationCreated: () => void;
}

export const NewConversationDialog = ({ onConversationCreated }: NewConversationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadCurrentUser();
      loadMembers();
    }
  }, [open]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's friendships
      const { data: friendships, error: friendError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendError) throw friendError;

      // Extract friend IDs
      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      if (friendIds.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Load friend profiles
      let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", friendIds);

      if (searchQuery.trim()) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error("Error loading members:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les membres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (memberId: string) => {
    if (!currentUserId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verify authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erreur",
          description: "Session expirée, veuillez vous reconnecter",
          variant: "destructive",
        });
        return;
      }

      console.log("User authenticated:", session.user.id);

      // Check if conversation already exists
      const { data: existingConvs } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (existingConvs) {
        for (const conv of existingConvs) {
          const { data: members } = await supabase
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conv.conversation_id);

          if (members?.length === 2) {
            const userIds = members.map(m => m.user_id);
            if (userIds.includes(currentUserId) && userIds.includes(memberId)) {
              toast({
                title: "Information",
                description: "Une conversation existe déjà avec ce membre",
              });
              setOpen(false);
              return;
            }
          }
        }
      }

      console.log("Creating conversation...");
      
      // Use security definer function to create conversation
      const { data: conversationId, error: convError } = await supabase
        .rpc("create_private_conversation", {
          other_user_id: memberId
        });

      console.log("Conversation creation result:", { conversationId, convError });

      if (convError) throw convError;

      toast({
        title: "Succès",
        description: "Conversation créée avec succès",
      });

      setOpen(false);
      onConversationCreated();
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle conversation</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Sélectionnez un membre pour démarrer une conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                loadMembers();
              }}
              placeholder="Rechercher un membre..."
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[300px]">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Chargement...</p>
            ) : members.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Aucun membre trouvé
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => createConversation(member.id)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
