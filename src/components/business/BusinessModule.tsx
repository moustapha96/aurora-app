import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  const [editValue, setEditValue] = useState(content || "");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync editValue with content prop changes
  useEffect(() => {
    setEditValue(content || "");
  }, [content]);

  const handleChange = (value: string) => {
    setEditValue(value);
    onEdit?.(value);
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
      onEdit?.(data.suggestion);
      toast({
        title: t("suggestionGenerated"),
        description: t("textAppliedAutomatically"),
      });
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({
        title: t("error"),
        description: t("cannotGenerateSuggestion"),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={`module-card rounded-xl ${isEmpty && !editValue ? "border-dashed border-gold/10" : ""}`}>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleAISuggest}
            disabled={isGenerating}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {t("aiAurora")}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {editable ? (
          <Textarea
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t("describeYourContent")}
            className="min-h-[120px] bg-black/20 border-gold/20 text-gold placeholder:text-gold/40 text-sm resize-none focus:ring-1 focus:ring-gold/30"
          />
        ) : (
          <p className="text-gold/70 whitespace-pre-line">{content}</p>
        )}
      </CardContent>
    </Card>
  );
};
