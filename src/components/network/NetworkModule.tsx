import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Plus, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface NetworkModuleProps {
  title: string;
  icon: LucideIcon;
  moduleType: string;
  content?: string;
  children?: React.ReactNode;
  isEditable?: boolean;
  onEdit?: () => void;
  onContentUpdate?: (content: string) => void;
  showTextEditor?: boolean;
}

export const NetworkModule = ({
  title,
  icon: Icon,
  moduleType,
  content,
  children,
  isEditable = false,
  onEdit,
  onContentUpdate,
  showTextEditor = false
}: NetworkModuleProps) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = () => {
    setEditContent(content || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (onContentUpdate) {
      setIsSaving(true);
      try {
        await onContentUpdate(editContent);
        setIsEditing(false);
        toast.success(t('networkModuleContentUpdated'));
      } catch (error) {
        toast.error(t('networkModuleSaveError'));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType, context: editContent }
      });

      if (error) throw error;
      if (data?.suggestion) {
        setEditContent(data.suggestion);
        toast.success(t('networkModuleSuggestionGenerated'));
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
      toast.error(t('networkModuleSuggestionError'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="module-card rounded-xl h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <Icon className="w-5 h-5 text-gold" />
            </div>
            <CardTitle className="text-lg font-serif text-gold">{title}</CardTitle>
          </div>
          {isEditable && showTextEditor && (
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    {title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder={t('networkModuleDescribe').replace('{title}', title.toLowerCase())}
                    className="min-h-[200px]"
                  />
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={handleAISuggest}
                      disabled={isGenerating}
                      size="sm"
                      className="gap-2 w-full sm:w-auto text-sm"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {t('networkModuleAISuggestButton')}
                    </Button>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        size="sm"
                        className="w-full sm:w-auto text-sm"
                      >
                        {t('cancel')}
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="w-full sm:w-auto text-sm"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children || (
          <p className="text-muted-foreground text-sm">
            {content || t('networkModuleNoContent')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
