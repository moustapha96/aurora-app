import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Sparkles, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BusinessModuleProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  content?: string;
  isEmpty?: boolean;
  editable?: boolean;
  moduleType: "bio" | "achievements" | "vision" | "timeline" | "press" | "projects";
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  aiContext?: any;
}

export const BusinessModule: React.FC<BusinessModuleProps> = ({
  icon: Icon,
  title,
  subtitle,
  content,
  isEmpty = false,
  editable = true,
  moduleType,
  onEdit,
  onDelete,
  aiContext,
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content || "");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOpenEdit = () => {
    setEditValue(content || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(content || "");
    setIsEditing(false);
  };

  const handleSave = () => {
    onEdit?.(editValue);
    setIsEditing(false);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("business-ai-suggest", {
        body: {
          type: moduleType,
          context: aiContext || {},
        },
      });

      if (error) throw error;
      setEditValue(data.suggestion);
      toast({
        title: "Suggestion générée",
        description: "Vous pouvez modifier le texte avant de l'enregistrer.",
      });
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer une suggestion.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card className={`module-card rounded-xl ${isEmpty ? "border-dashed border-gold/10" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <Icon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif text-gold">{title}</CardTitle>
              {subtitle && <p className="text-sm text-gold/60">{subtitle}</p>}
            </div>
          </div>

          {editable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gold/60 hover:text-gold hover:bg-gold/10">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-gold/20">
                <DropdownMenuItem
                  onClick={handleOpenEdit}
                  className="text-gold hover:bg-gold/10 cursor-pointer"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <CardContent>
          {isEmpty ? (
            <div className="py-8 text-center">
              <p className="text-gold/50 mb-4">{subtitle || "Cliquez pour compléter ce module."}</p>
              {editable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  Remplir
                </Button>
              )}
            </div>
          ) : (
            <p className="text-gold/70 whitespace-pre-line">{content}</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-black border-gold/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gold font-serif">{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Ajoutez votre ${title.toLowerCase()}...`}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[200px]"
            />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleAISuggest}
                disabled={isGenerating}
                className="border-gold/30 text-gold hover:bg-gold/10"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Proposition Aurora
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  Annuler
                </Button>
                <Button onClick={handleSave} className="bg-gold text-black hover:bg-gold/90">
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
