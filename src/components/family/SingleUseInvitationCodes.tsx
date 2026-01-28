import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Gift, Plus, Copy, Check, Trash2, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface UsedByProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface SingleUseCode {
  id: string;
  invitation_code: string;
  code_name: string | null;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  is_active: boolean;
  created_at: string;
  used_by_profile?: UsedByProfile | null;
}

interface SingleUseInvitationCodesProps {
  isEditable?: boolean;
  userId?: string;
  onUpdate?: () => void;
  /** Si true, le membre a un code d'invitation initial (non supprimable). On compte 1 + N codes, et on peut supprimer des codes à usage unique tant qu'il reste au moins un code. */
  hasInitialCode?: boolean;
  /** Si true, le code initial a déjà été utilisé (au moins une inscription avec ce code). Compté dans les "utilisés". */
  initialCodeUsed?: boolean;
}

export const SingleUseInvitationCodes = ({ isEditable = false, userId, onUpdate, hasInitialCode = false, initialCodeUsed = false }: SingleUseInvitationCodesProps) => {
  const { t } = useLanguage();
  const [codes, setCodes] = useState<SingleUseCode[]>([]);
  const [maxCodes, setMaxCodes] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCodeName, setNewCodeName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileId = userId || user.id;

      // Charger la limite depuis les paramètres admin
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'max_invitation_codes_per_user')
        .maybeSingle();

      if (settingsData?.setting_value) {
        setMaxCodes(parseInt(settingsData.setting_value, 10) || 2);
      }

      // Charger les codes d'invitation
      const { data: codesData, error } = await (supabase as any)
        .from('single_use_invitation_codes')
        .select('*')
        .eq('user_id', profileId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading invitation codes:", error);
        setCodes([]);
      } else {
        // Récupérer les profils des utilisateurs qui ont utilisé les codes
        const usedCodes = (codesData || []).filter((c: SingleUseCode) => c.used_by);
        const usedByIds = usedCodes.map((c: SingleUseCode) => c.used_by);
        
        let profilesMap: Record<string, UsedByProfile> = {};
        
        if (usedByIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', usedByIds);
          
          if (profiles) {
            profilesMap = profiles.reduce((acc: Record<string, UsedByProfile>, p: UsedByProfile) => {
              acc[p.id] = p;
              return acc;
            }, {});
          }
        }
        
        // Enrichir les codes avec les profils
        const enrichedCodes = (codesData || []).map((code: SingleUseCode) => ({
          ...code,
          used_by_profile: code.used_by ? profilesMap[code.used_by] || null : null
        }));
        
        setCodes(enrichedCodes);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "AURORA-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createInvitationCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('youMustBeConnected'));
      return;
    }

    const profileId = userId || user.id;

    // Vérifier la limite
    if (codes.length >= maxCodes) {
      toast.error(t('invitationCodeLimitReached') || `Vous avez atteint la limite de ${maxCodes} codes d'invitation`);
      return;
    }

    setCreating(true);
    try {
      // Générer un code unique
      let newCode: string = "";
      let codeExists = true;
      let attempts = 0;

      while (codeExists && attempts < 10) {
        newCode = generateCode();
        // Vérifier l'unicité
        const { data: existingCode } = await (supabase as any)
          .from('single_use_invitation_codes')
          .select('id')
          .eq('invitation_code', newCode)
          .maybeSingle();

        if (!existingCode) {
          codeExists = false;
        }
        attempts++;
      }

      if (codeExists) {
        toast.error(t('errorGeneratingUniqueCode') || 'Erreur lors de la génération d\'un code unique');
        return;
      }

      // Créer le code
      const { error } = await (supabase as any)
        .from('single_use_invitation_codes')
        .insert({
          user_id: profileId,
          invitation_code: newCode,
          code_name: newCodeName.trim() || null,
          is_active: true,
          is_used: false
        });

      if (error) throw error;

      toast.success(t('invitationCodeCreated') || 'Code d\'invitation créé avec succès');
      setCreateDialogOpen(false);
      setNewCodeName("");
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error creating invitation code:", error);
      toast.error(error.message || t('errorCreatingInvitationCode') || 'Erreur lors de la création du code');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(codeId);
      toast.success(t('codeCopiedClipboard'));
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (error) {
      toast.error(t('cannotCopyCode'));
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!canDeleteSingleUseCodes) {
      toast.error(t('mustKeepOneCode') || 'Il doit vous rester au moins un code d\'invitation.');
      return;
    }
    try {
      const { error } = await (supabase as any)
        .from('single_use_invitation_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      toast.success(t('invitationCodeDeleted') || 'Code d\'invitation supprimé');
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error deleting code:", error);
      toast.error(error.message || t('errorDeletingCode'));
    }
  };

  const singleUseUsedCount = codes.filter(c => c.is_used).length;
  const usedCodesCount = (hasInitialCode && initialCodeUsed ? 1 : 0) + singleUseUsedCount;
  const totalCodesCount = codes.length;
  const totalCodesWithInitial = (hasInitialCode ? 1 : 0) + totalCodesCount;
  const maxTotalCodes = (hasInitialCode ? 1 : 0) + maxCodes;
  const canCreateMore = codes.length < maxCodes;
  /** Ne pas permettre de supprimer un code à usage unique si cela laisserait 0 code au total (il doit rester au moins un code). */
  const canDeleteSingleUseCodes = hasInitialCode || codes.length > 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec compteur (code initial + codes à usage unique) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">
            {t('singleUseInvitationCodes') || 'Codes d\'invitation'}
          </h3>
          <span className="text-xs text-muted-foreground">
            ({usedCodesCount}/{totalCodesWithInitial} {t('used') || 'utilisés'} • max {maxTotalCodes})
          </span>
        </div>
        {isEditable && canCreateMore && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            variant="outline"
            size="sm"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('createCode') || 'Créer'}
          </Button>
        )}
      </div>

      {/* Message si limite atteinte */}
      {!canCreateMore && isEditable && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            {t('invitationCodeLimitReached') || `Vous avez atteint la limite de ${maxTotalCodes} codes d'invitation.`}
          </p>
        </div>
      )}

      {/* Liste des codes */}
      {codes.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium text-foreground mb-2">
                {t('noInvitationCodes') || 'Aucun code d\'invitation à usage unique'}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('createInvitationCodeHint') || 'Créez des codes d\'invitation à usage unique pour parrainer de nouveaux membres.'}
              </p>
              {isEditable && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createFirstInvitationCode') || 'Créer votre premier code'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => (
            <Card
              key={code.id}
              className={`bg-gradient-to-br ${code.is_used ? 'from-muted/20 to-transparent border-muted/40 opacity-70' : 'from-gold/5 to-transparent border-gold/20'}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {code.code_name && (
                      <p className="text-sm font-medium text-foreground mb-1 truncate">{code.code_name}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className={`text-base font-mono font-bold ${code.is_used ? 'text-muted-foreground line-through' : 'text-gold'}`}>
                        {code.invitation_code}
                      </p>
                      {code.is_used ? (
                        <Badge variant="secondary" className="text-xs">
                          {t('used') || 'Utilisé'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
                          {t('available') || 'Disponible'}
                        </Badge>
                      )}
                    </div>
                    {code.is_used && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-muted/30">
                        {code.used_by_profile ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={code.used_by_profile.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-gold/20 text-gold">
                                {code.used_by_profile.first_name?.[0]}{code.used_by_profile.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">
                                {t('codeUsedBy') || 'Utilisé par'}: {code.used_by_profile.first_name} {code.used_by_profile.last_name}
                              </p>
                              {code.used_at && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(code.used_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {t('codeUsedBy') || 'Utilisé par'}: {t('unknownMember') || 'Membre inconnu'}
                            </p>
                            {code.used_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(code.used_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!code.is_used && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(code.invitation_code, code.id)}
                        className="h-8 w-8 p-0 text-gold hover:bg-gold/10"
                      >
                        {copiedCodeId === code.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {isEditable && !code.is_used && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCode(code.id)}
                        disabled={!canDeleteSingleUseCodes}
                        title={!canDeleteSingleUseCodes ? (t('mustKeepOneCode') || 'Il doit rester au moins un code') : undefined}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createInvitationCode') || 'Créer un code d\'invitation'}</DialogTitle>
            <DialogDescription>
              {t('createInvitationCodeDesc') || 'Ce code ne pourra être utilisé qu\'une seule fois pour parrainer un nouveau membre.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codeName">{t('codeName') || 'Nom du code'} ({t('optional') || 'optionnel'})</Label>
              <Input
                id="codeName"
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value)}
                placeholder={t('codeNamePlaceholder') || 'Ex: Pour Jean-Pierre'}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={createInvitationCode}
              disabled={creating}
              className="bg-gold hover:bg-gold/90 text-primary-foreground"
            >
              {creating ? t('creating') || 'Création...' : t('create') || 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
