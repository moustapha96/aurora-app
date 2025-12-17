import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Edit, Loader2, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PersonalModuleProps {
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

export const PersonalModule = ({
  title,
  icon: Icon,
  moduleType,
  content,
  children,
  isEditable = false,
  onEdit,
  onContentUpdate,
  showTextEditor = false
}: PersonalModuleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleOpenEdit = () => {
    setEditContent(content || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onContentUpdate) return;
    
    setIsSaving(true);
    try {
      onContentUpdate(editContent);
      setIsEditing(false);
      toast({ title: "Contenu mis à jour" });
    } catch (error) {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("personal-ai-suggest", {
        body: { module: moduleType, currentContent: editContent }
      });

      if (error) throw error;
      if (data?.suggestion) {
        setEditContent(data.suggestion);
        toast({ title: "Suggestion générée" });
      }
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({ 
        title: "Erreur lors de la génération", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className="module-card rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <Icon className="w-5 h-5 text-gold" />
            </div>
            <CardTitle className="text-lg font-serif text-gold">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {children ? (
            children
          ) : content ? (
            <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
          ) : (
            <p className="text-muted-foreground italic">
              Aucun contenu.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-gold" />
              Modifier : {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Décrivez cette section..."
              rows={6}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleAISuggest}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Suggestion IA
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gold text-black hover:bg-gold/90"
                >
                  {isSaving ? "Enregistrement..." : "Valider"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
