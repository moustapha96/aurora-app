import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Link2, Copy, Check, Trash2, Loader2, Users, Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface LinkedAccount {
  id: string;
  linked_user_id: string;
  relation_type: string;
  created_at: string;
  linked_profile?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface FamilyLinkInviteProps {
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyLinkInvite = ({ isEditable = false, onUpdate }: FamilyLinkInviteProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [familyLinks, setFamilyLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkName, setLinkName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [step, setStep] = useState<'create' | 'share'>('create');

  useEffect(() => {
    if (isEditable) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isEditable]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load linked accounts
      const { data: accounts } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('sponsor_id', user.id);

      if (accounts && accounts.length > 0) {
        // Load profiles for linked accounts
        const linkedUserIds = accounts.map(a => a.linked_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', linkedUserIds);

        const accountsWithProfiles = accounts.map(account => ({
          ...account,
          linked_profile: profiles?.find(p => p.id === account.linked_user_id)
        }));

        setLinkedAccounts(accountsWithProfiles);
      } else {
        setLinkedAccounts([]);
      }

      // Load family referral links
      const { data: links } = await supabase
        .from('referral_links')
        .select('*')
        .eq('sponsor_id', user.id)
        .eq('is_family_link', true)
        .order('created_at', { ascending: false });

      setFamilyLinks(links || []);
    } catch (error) {
      console.error('Error loading linked accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    setStep('create');
    setLinkName("");
    setRecipientEmail("");
    setNewLinkUrl("");
  };

  const createFamilyLink = async () => {
    if (!linkName.trim()) {
      toast.error(t("pleaseGiveLinkName"));
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      // Get user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (!profile?.referral_code) {
        toast.error(t("referralCodeNotFound"));
        return;
      }

      // Generate link code
      const generateLinkCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "AURORA-LINK-";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      const linkCode = generateLinkCode();

      // Create family referral link
      const { data, error } = await supabase
        .from('referral_links')
        .insert({
          sponsor_id: user.id,
          referral_code: profile.referral_code,
          link_code: linkCode,
          link_name: linkName.trim(),
          is_family_link: true,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const baseUrl = window.location.origin;
      const linkUrl = `${baseUrl}/register?link=${data.link_code}&family=true`;
      setNewLinkUrl(linkUrl);
      setStep('share');
      
      toast.success(t("familyLinkCreatedSuccessfully"));
      loadData();
    } catch (error: any) {
      console.error('Error creating family link:', error);
      toast.error(t("errorCreatingLink"));
    } finally {
      setIsCreating(false);
    }
  };

  const sendInviteEmail = async () => {
    if (!recipientEmail.trim()) {
      toast.error(t("pleaseEnterEmailAddress"));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error(t("invalidEmailAddress"));
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const senderName = profile ? `${profile.first_name} ${profile.last_name}` : t('anAuroraMember');

      // Send email via edge function
      const { error } = await supabase.functions.invoke('send-family-invite', {
        body: {
          recipientEmail: recipientEmail.trim(),
          senderName,
          inviteLink: newLinkUrl,
          linkName: linkName
        }
      });

      if (error) throw error;

      toast.success(`${t("invitationSentTo")} ${recipientEmail}`);
      setRecipientEmail("");
    } catch (error: any) {
      console.error('Error sending invite email:', error);
      toast.error(t("errorSendingEmailCopyManually"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error(t("errorCopying"));
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm(t("deleteThisInvitationLink"))) return;

    try {
      const { error } = await supabase
        .from('referral_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      toast.success(t("linkDeleted"));
      loadData();
    } catch {
      toast.error(t("errorDeleting"));
    }
  };

  const deleteLinkedAccount = async (accountId: string) => {
    if (!confirm(t("removeAccessConfirm"))) return;

    try {
      const { error } = await supabase
        .from('linked_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      toast.success(t("accessRemoved"));
      loadData();
      onUpdate?.();
    } catch {
      toast.error(t("errorDeleting"));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = navigator.language || 'fr-FR';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const generateLinkUrl = (linkCode: string) => {
    return `${window.location.origin}/register?link=${linkCode}&family=true`;
  };

  if (!isEditable) return null;

  return (
    <div className="space-y-4">
      {/* Button to create invite */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleOpenDialog}
          disabled={isLoading}
          className="bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4 sm:mr-2" />
          )}
          {t("inviteClose")}
        </Button>
      </div>

      {/* Display linked accounts */}
      {linkedAccounts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gold/80 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t("associatedAccounts")} ({linkedAccounts.length})
          </h4>
          <div className="grid gap-2">
            {linkedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-gold/5 rounded-lg border border-gold/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-medium">
                    {account.linked_profile?.first_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {account.linked_profile 
                        ? `${account.linked_profile.first_name} ${account.linked_profile.last_name}`
                        : t('user')
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {`${t("associatedOn")} ${formatDate(account.created_at)}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteLinkedAccount(account.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display active family links */}
      {familyLinks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gold/80 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            {t("activeInvitationLinks")}
          </h4>
          <div className="grid gap-2">
            {familyLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-gold/5 rounded-lg border border-gold/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{link.link_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{`${link.registration_count || 0} ${t("registrations")}`}</span>
                    <span>•</span>
                    <span>{`${t("createdOn")} ${formatDate(link.created_at)}`}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generateLinkUrl(link.link_code))}
                    className="text-gold hover:text-gold hover:bg-gold/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLink(link.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && linkedAccounts.length === 0 && familyLinks.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          {t("inviteCloseToViewProfile")}
        </p>
      )}

      {/* Dialog to create invite */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setLinkName("");
          setRecipientEmail("");
          setNewLinkUrl("");
          setStep('create');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gold" />
              {t("inviteClose")}
            </DialogTitle>
            <DialogDescription>
              {step === 'create' 
                ? t("createInvitationLinkForFamily")
                : t("shareLinkByEmailOrCopy")
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-amber-200">
                {t("accessLimited")}
              </p>
            </div>

            {step === 'create' ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="linkName">{t("linkNameExample")}</Label>
                  <Input
                    id="linkName"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder={t("giveNameThisLink")}
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Copy link section */}
                <div>
                  <Label>{t("invitationLinkCreated")}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newLinkUrl}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newLinkUrl)}
                      className="border-gold/30 text-gold hover:bg-gold/10 flex-shrink-0"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Email section */}
                <div className="border-t border-border pt-4">
                  <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t("sendByEmail")}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder={t("emailExample")}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendInviteEmail}
                      disabled={isSendingEmail || !recipientEmail.trim()}
                      className="bg-gold text-black hover:bg-gold/90 flex-shrink-0"
                    >
                      {isSendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t("invitedPersonIdentityVerification")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {step === 'create' ? (
              <>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  onClick={createFamilyLink}
                  disabled={isCreating || !linkName.trim()}
                  className="bg-gold text-black hover:bg-gold/90"
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("createLink")}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsOpen(false)} className="bg-gold text-black hover:bg-gold/90">
                {t("done")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
