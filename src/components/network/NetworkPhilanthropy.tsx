import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { Heart, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface PhilanthropyItem {
  id: string;
  title: string;
  organization?: string;
  role?: string;
  cause?: string;
  description?: string;
}

interface NetworkPhilanthropyProps {
  data: PhilanthropyItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

export const NetworkPhilanthropy = ({ data, isEditable, onUpdate }: NetworkPhilanthropyProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PhilanthropyItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    role: "",
    cause: "",
    description: ""
  });

  const resetForm = () => {
    setFormData({ title: "", organization: "", role: "", cause: "", description: "" });
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'philanthropy', context: formData.title }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        toast.success(t('networkModuleSuggestionGenerated'));
      }
    } catch (error) {
      toast.error(t('networkModuleSuggestionError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(t('networkPhilanthropyTitleRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      if (editingItem) {
        const { error } = await supabase
          .from('network_philanthropy')
          .update({
            title: formData.title,
            organization: formData.organization,
            role: formData.role,
            cause: formData.cause,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success(t('networkPhilanthropyUpdated'));
      } else {
        const { error } = await supabase
          .from('network_philanthropy')
          .insert({
            user_id: user.id,
            title: formData.title,
            organization: formData.organization,
            role: formData.role,
            cause: formData.cause,
            description: formData.description
          });
        if (error) throw error;
        toast.success(t('networkPhilanthropyAdded'));
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving philanthropy:', error);
      toast.error(t('networkPhilanthropySaveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_philanthropy').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('networkPhilanthropyDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('networkPhilanthropyDeleteError'));
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("network_philanthropy")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(t('networkPhilanthropySaveError'));
    }
  };

  return (
    <NetworkModule title={t('philanthropy')} icon={Heart} moduleType="philanthropy" isEditable={isEditable}>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="p-3 bg-muted/30 rounded-lg group">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <InlineEditableField
                  value={item.title}
                  onSave={(value) => handleInlineUpdate(item.id, "title", value)}
                  placeholder={t('title')}
                  disabled={!isEditable}
                  className="font-medium text-foreground"
                />
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {item.organization && <span>{item.organization}</span>}
                  {item.role && <span>• {item.role}</span>}
                  {item.cause && <span className="text-primary">• {item.cause}</span>}
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
            {t('networkPhilanthropyNone')}
          </p>
        )}

        {isEditable && (
          <Button variant="outline" className="w-full mt-3 text-sm" size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {t('add')}
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingItem ? t('networkPhilanthropyDialogEditTitle') : t('networkPhilanthropyDialogAddTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">{t('title')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('networkPhilanthropyTitlePlaceholder') || "Ex: Fondation pour l'Éducation"}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{t('networkPhilanthropyOrganizationLabel')}</Label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder={t('networkPhilanthropyOrganizationPlaceholder') || "Ex: UNICEF"}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">{t('networkPhilanthropyRoleLabel')}</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder={t('networkPhilanthropyRolePlaceholder') || "Ex: Mécène, Fondateur"}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">{t('networkPhilanthropyCauseLabel')}</Label>
              <Input
                value={formData.cause}
                onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                placeholder={t('networkPhilanthropyCausePlaceholder') || t('philanthropyEducationEnvironment')}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">{t('description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('networkPhilanthropyDescriptionPlaceholder') || "Description de votre engagement..."}
                rows={3}
                className="text-sm min-h-[80px]"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleAISuggest}
                disabled={isGenerating}
                size="sm"
                className="gap-2 w-full sm:w-auto text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {t('networkModuleAISuggestButton')}
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 justify-end w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                >
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
