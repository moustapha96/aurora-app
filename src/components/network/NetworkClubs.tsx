import { useState, useEffect } from "react";
import { NetworkModule } from "./NetworkModule";
import { Users, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClubItem {
  id: string;
  title: string;
  club_type?: string;
  role?: string;
  since_year?: string;
  description?: string;
}

interface NetworkClubsProps {
  data: ClubItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

export const NetworkClubs = ({ data, isEditable, onUpdate }: NetworkClubsProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClubItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    club_type: "",
    role: "",
    since_year: "",
    description: ""
  });

  const resetForm = () => {
    setFormData({ title: "", club_type: "", role: "", since_year: "", description: "" });
    setEditingItem(null);
  };

  const handleOpenAdd = (type?: string) => {
    resetForm();
    if (type) {
      setFormData(prev => ({ ...prev, club_type: type }));
    }
    setIsDialogOpen(true);
  };

  // Listen for custom events from NetworkInfluence
  useEffect(() => {
    const handleAddClub = () => handleOpenAdd("Club");
    const handleAddAssociation = () => handleOpenAdd("Association");

    window.addEventListener('open-add-club', handleAddClub);
    window.addEventListener('open-add-association', handleAddAssociation);

    return () => {
      window.removeEventListener('open-add-club', handleAddClub);
      window.removeEventListener('open-add-association', handleAddAssociation);
    };
  }, []);

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'clubs', context: formData.title }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        toast.success(t('suggestionGenerated'));
      }
    } catch (error) {
      toast.error(t('generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(t('titleRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      if (editingItem) {
        const { error } = await supabase
          .from('network_clubs')
          .update({
            title: formData.title,
            club_type: formData.club_type,
            role: formData.role,
            since_year: formData.since_year,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success(t('clubUpdated'));
      } else {
        const { error } = await supabase
          .from('network_clubs')
          .insert({
            user_id: user.id,
            title: formData.title,
            club_type: formData.club_type,
            role: formData.role,
            since_year: formData.since_year,
            description: formData.description
          });
        if (error) throw error;
        toast.success(t('clubAdded'));
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving club:', error);
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_clubs').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('clubDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('clubDeleteError'));
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("network_clubs")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(t('saveError'));
    }
  };

  return (
    <NetworkModule title={t('clubsAssociations')} icon={Users} moduleType="clubs" isEditable={isEditable}>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="p-3 bg-muted/30 rounded-lg group">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <InlineEditableField
                  value={item.title}
                  onSave={(value) => handleInlineUpdate(item.id, "title", value)}
                  placeholder={t('clubName')}
                  disabled={!isEditable}
                  className="font-medium text-foreground"
                />
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {item.club_type && <span className="text-primary">{item.club_type}</span>}
                  {item.role && <span>• {item.role}</span>}
                  {item.since_year && <span>• {t('since')} {item.since_year}</span>}
                </div>
                {isEditable ? (
                  <InlineEditableField
                    value={item.description || ""}
                    onSave={(value) => handleInlineUpdate(item.id, "description", value)}
                    placeholder={t('description')}
                    multiline
                    className="text-sm text-muted-foreground mt-1"
                  />
                ) : item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
              {isEditable && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            {t('noClubAssociationAdded')}
          </p>
        )}

        {isEditable && (
          <Button variant="outline" className="w-full mt-3" onClick={() => handleOpenAdd()}>
            <Plus className="w-4 h-4 mr-2" />
            {t('add')}
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? t('edit') : t('add')} {t('aClub')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('clubName')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('clubNamePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('type')}</Label>
                <Input
                  value={formData.club_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, club_type: e.target.value }))}
                  placeholder={t('clubTypePlaceholder')}
                />
              </div>
              <div>
                <Label>{t('memberSince')}</Label>
                <Input
                  value={formData.since_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, since_year: e.target.value }))}
                  placeholder={t('yearPlaceholder')}
                />
              </div>
            </div>
            <div>
              <Label>{t('role')}</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder={t('rolePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('clubDescriptionPlaceholder')}
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleAISuggest} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {t('auroraSuggestion')}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
