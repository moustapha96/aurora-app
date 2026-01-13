import React from "react";
import { Crown, Quote, Sparkles } from "lucide-react";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeritageData {
  id?: string;
  motto?: string;
  values_text?: string;
  legacy_vision?: string;
  heritage_description?: string;
  banner_image_url?: string;
}

interface FamilyHeritageProps {
  heritage: HeritageData | null;
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyHeritage = ({ heritage, isEditable = false, onUpdate }: FamilyHeritageProps) => {
  const { t } = useLanguage();
  const hasContent = heritage && (heritage.motto || heritage.values_text || heritage.legacy_vision || heritage.heritage_description);

  const handleFieldUpdate = async (field: keyof HeritageData, value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (heritage?.id) {
        const { error } = await supabase
          .from("family_heritage")
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq("id", heritage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("family_heritage")
          .insert({ user_id: user.id, [field]: value });
        if (error) throw error;
      }
      
      toast.success(t('saved'));
      onUpdate?.();
    } catch (error) {
      console.error("Error updating heritage:", error);
      toast.error(t('saveError'));
    }
  };

  // Show structure for editing even if no content yet
  if (isEditable) {
    return (
      <div className="space-y-6">
        {/* Motto - Full Width */}
        <div className="relative overflow-hidden rounded-lg border border-gold/30 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 p-4 sm:p-6 text-center">
          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-gold mx-auto mb-2 sm:mb-3" />
          <p className="text-lg sm:text-xl font-serif text-gold italic">
            « <InlineEditableField
              value={heritage?.motto || ""}
              onSave={(value) => handleFieldUpdate("motto", value)}
              placeholder={t('familyMotto')}
              className="text-lg sm:text-xl font-serif text-gold"
            /> »
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Values */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />{t('transmittedValues')}
            </h4>
            <div className="pl-6">
              <InlineEditableField
                value={heritage?.values_text || ""}
                onSave={(value) => handleFieldUpdate("values_text", value)}
                placeholder={t('describeTransmittedValues')}
                multiline
                className="text-muted-foreground"
              />
            </div>
          </div>

          {/* Vision */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gold flex items-center gap-2">
              <Quote className="w-4 h-4" />{t('transmissionVision')}
            </h4>
            <div className="pl-6">
              <InlineEditableField
                value={heritage?.legacy_vision || ""}
                onSave={(value) => handleFieldUpdate("legacy_vision", value)}
                placeholder={t('yourVisionForFutureGenerations')}
                multiline
                className="text-muted-foreground italic"
              />
            </div>
          </div>
        </div>

        {/* Description - Full Width */}
        <div className="p-4 sm:p-6 bg-gold/5 rounded-lg border border-gold/10">
          <InlineEditableField
            value={heritage?.heritage_description || ""}
            onSave={(value) => handleFieldUpdate("heritage_description", value)}
            placeholder={t('generalHeritageDescription')}
            multiline
            className="text-muted-foreground"
          />
        </div>
      </div>
    );
  }

  // Read-only view
  return (
    <div className="space-y-6">
      {!hasContent ? (
        <p className="text-muted-foreground text-sm italic">{t('noHeritageContent')}</p>
      ) : (
        <>
          {heritage?.motto && (
            <div className="relative overflow-hidden rounded-lg border border-gold/30 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 p-4 sm:p-6 text-center">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-gold mx-auto mb-2 sm:mb-3" />
              <p className="text-lg sm:text-xl font-serif text-gold italic">« {heritage.motto} »</p>
            </div>
          )}
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {heritage?.values_text && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gold flex items-center gap-2"><Sparkles className="w-4 h-4" />{t('transmittedValues')}</h4>
                <p className="text-muted-foreground whitespace-pre-line pl-6">{heritage.values_text}</p>
              </div>
            )}
            {heritage?.legacy_vision && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gold flex items-center gap-2"><Quote className="w-4 h-4" />{t('transmissionVision')}</h4>
                <p className="text-muted-foreground whitespace-pre-line pl-6 italic">{heritage.legacy_vision}</p>
              </div>
            )}
          </div>
          
          {heritage?.heritage_description && (
            <div className="p-4 sm:p-6 bg-gold/5 rounded-lg border border-gold/10">
              <p className="text-muted-foreground whitespace-pre-line">{heritage.heritage_description}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
