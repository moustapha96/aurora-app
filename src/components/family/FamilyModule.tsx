import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Sparkles, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
}

interface FamilyModuleProps {
  title: string;
  icon: React.ReactNode;
  moduleType: string;
  content: string;
  items?: Array<Record<string, string>>;
  isEditable: boolean;
  onUpdate: () => void;
  renderContent?: () => React.ReactNode;
  fields?: FieldConfig[];
}

export const FamilyModule = ({
  title,
  icon,
  moduleType,
  content,
  items = [],
  isEditable,
  onUpdate,
  renderContent,
  fields = []
}: FamilyModuleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [editedItems, setEditedItems] = useState<Array<Record<string, string>>>(items);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleOpenEdit = () => {
    setEditedContent(content);
    setEditedItems([...items]);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      if (moduleType === "heritage") {
        const { error } = await supabase.from("family_heritage").upsert({
          user_id: user.id,
          heritage_description: editedContent
        }, { onConflict: "user_id" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("family_content").upsert({
          user_id: user.id,
          [moduleType]: editedContent
        }, { onConflict: "user_id" });
        if (error) throw error;
      }

      toast({ title: t('moduleSaved') });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: t('saveError'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAISuggest = async () => {
    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("family-ai-suggest", {
        body: { module: moduleType, currentContent: editedContent }
      });

      if (error) throw error;
      
      if (data?.suggestion) {
        setEditedContent(data.suggestion);
        toast({ title: t('aiSuggestionGenerated') });
      }
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({ title: t('aiGenerationError'), variant: "destructive" });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <>
      <Card className="module-card rounded-xl group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 text-gold">
                {icon}
              </div>
              <CardTitle className="text-lg font-medium text-gold">{title}</CardTitle>
            </div>
            {isEditable && !renderContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gold/60 hover:text-gold"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderContent ? renderContent() : (
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {content || t('noContentClickToEdit')}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gold/10 text-gold flex-shrink-0">
                <div className="w-4 h-4 sm:w-5 sm:h-5">
                  {icon}
                </div>
              </div>
              <span className="break-words">{title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={isGeneratingAI}
                className="border-gold/30 text-gold hover:bg-gold/10 text-xs sm:text-sm h-8 sm:h-9"
              >
                {isGeneratingAI ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{t('aiSuggestion')}</span>
                <span className="sm:hidden">{t('ai')}</span>
              </Button>
            </div>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={6}
              placeholder={t('describeYourContent')}
              className="resize-none text-sm sm:text-base min-h-[120px] sm:min-h-[200px]"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading} 
              className="bg-gold text-gold-foreground hover:bg-gold/90 w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
