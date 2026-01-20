// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { UserPlus, Link2, Copy, Check, Trash2, Loader2, Users, Mail, Send } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { useLanguage } from "@/contexts/LanguageContext";

// interface LinkedAccount {
//   id: string;
//   linked_user_id: string;
//   relation_type: string;
//   created_at: string;
//   linked_profile?: {
//     first_name: string;
//     last_name: string;
//     avatar_url?: string;
//   };
// }

// interface FamilyLinkInviteProps {
//   isEditable?: boolean;
//   onUpdate?: () => void;
// }

// export const FamilyLinkInvite = ({ isEditable = false, onUpdate }: FamilyLinkInviteProps) => {
//   const { t, language } = useLanguage();
//   const [isOpen, setIsOpen] = useState(false);
//   const [isCreating, setIsCreating] = useState(false);
//   const [isSendingEmail, setIsSendingEmail] = useState(false);
//   const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
//   const [isNewLinkCopied, setIsNewLinkCopied] = useState(false);
//   const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
//   const [familyLinks, setFamilyLinks] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [linkName, setLinkName] = useState("");
//   const [recipientEmail, setRecipientEmail] = useState("");
//   const [newLinkUrl, setNewLinkUrl] = useState("");
//   const [step, setStep] = useState<'create' | 'share'>('create');

//   useEffect(() => {
//     if (isEditable) {
//       loadData();
//     } else {
//       setIsLoading(false);
//     }
//   }, [isEditable]);

//   const loadData = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       // Load linked accounts
//       const { data: accounts } = await supabase
//         .from('linked_accounts')
//         .select('*')
//         .eq('sponsor_id', user.id);

//       if (accounts && accounts.length > 0) {
//         // Load profiles for linked accounts
//         const linkedUserIds = accounts.map(a => a.linked_user_id);
//         const { data: profiles } = await supabase
//           .from('profiles')
//           .select('id, first_name, last_name, avatar_url')
//           .in('id', linkedUserIds);

//         const accountsWithProfiles = accounts.map(account => ({
//           ...account,
//           linked_profile: profiles?.find(p => p.id === account.linked_user_id)
//         }));

//         setLinkedAccounts(accountsWithProfiles);
//       } else {
//         setLinkedAccounts([]);
//       }

//       // Load family referral links
//       const { data: links } = await supabase
//         .from('referral_links')
//         .select('*')
//         .eq('sponsor_id', user.id)
//         .eq('is_family_link', true)
//         .order('created_at', { ascending: false });

//       setFamilyLinks(links || []);
//     } catch (error) {
//       console.error('Error loading linked accounts:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleOpenDialog = () => {
//     console.log("handleOpenDialog");
//     setIsOpen(true);
//     setStep('create');
//     setLinkName("");
//     setRecipientEmail("");
//     setNewLinkUrl("");
//   };

//   const createFamilyLink = async () => {
//     if (!linkName.trim()) {
//       toast.error(t("pleaseGiveLinkName"));
//       return;
//     }

//     setIsCreating(true);
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error(t("notAuthenticated"));

//       // Get user's referral code
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('referral_code')
//         .eq('id', user.id)
//         .single();

//       if (!profile?.referral_code) {
//         toast.error(t("referralCodeNotFound"));
//         return;
//       }

//       // Generate link code
//       const generateLinkCode = () => {
//         const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//         let code = "AURORA-LINK-";
//         for (let i = 0; i < 6; i++) {
//           code += chars.charAt(Math.floor(Math.random() * chars.length));
//         }
//         return code;
//       };
//       const linkCode = generateLinkCode();

//       // Create family referral link
//       const { data, error } = await supabase
//         .from('referral_links')
//         .insert({
//           sponsor_id: user.id,
//           referral_code: profile.referral_code,
//           link_code: linkCode,
//           link_name: linkName.trim(),
//           is_family_link: true,
//           is_active: true
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       const baseUrl = window.location.origin;
//       const linkUrl = `${baseUrl}/register?link=${data.link_code}&family=true`;
//       setNewLinkUrl(linkUrl);
//       setStep('share');
//       setCopiedLinkId(null); // Reset copied state
//       setIsNewLinkCopied(false); // Reset new link copied state
      
//       toast.success(t("familyLinkCreatedSuccessfully"));
//       loadData();
//     } catch (error: any) {
//       console.error('Error creating family link:', error);
//       toast.error(t("errorCreatingLink"));
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   const sendInviteEmail = async () => {
//     if (!recipientEmail.trim()) {
//       toast.error(t("pleaseEnterEmailAddress"));
//       return;
//     }

//     // Basic email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(recipientEmail)) {
//       toast.error(t("invalidEmailAddress"));
//       return;
//     }

//     setIsSendingEmail(true);
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error(t("notAuthenticated"));

//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('first_name, last_name')
//         .eq('id', user.id)
//         .single();

//       const senderName = profile ? `${profile.first_name} ${profile.last_name}` : t('anAuroraMember');

//       // Send email via edge function
//       const { error } = await supabase.functions.invoke('send-family-invite', {
//         body: {
//           recipientEmail: recipientEmail.trim(),
//           senderName,
//           inviteLink: newLinkUrl,
//           linkName: linkName
//         }
//       });

//       if (error) throw error;

//       toast.success(`${t("invitationSentTo")} ${recipientEmail}`);
//       setRecipientEmail("");
//     } catch (error: any) {
//       console.error('Error sending invite email:', error);
//       toast.error(t("errorSendingEmailCopyManually"));
//     } finally {
//       setIsSendingEmail(false);
//     }
//   };

//   const copyToClipboard = async (url: string, linkId?: string) => {
//     try {
//       if (navigator.clipboard && navigator.clipboard.writeText) {
//         await navigator.clipboard.writeText(url);
//       } else {
//         // Fallback pour les navigateurs plus anciens
//         const textArea = document.createElement('textarea');
//         textArea.value = url;
//         textArea.style.position = 'fixed';
//         textArea.style.left = '-999999px';
//         document.body.appendChild(textArea);
//         textArea.select();
//         document.execCommand('copy');
//         document.body.removeChild(textArea);
//       }
      
//       if (linkId) {
//         setCopiedLinkId(linkId);
//         setTimeout(() => setCopiedLinkId(null), 2000);
//       }
//       toast.success(t("linkCopied"));
//     } catch (error) {
//       console.error('Error copying to clipboard:', error);
//       toast.error(t("errorCopying"));
//     }
//   };

//   const deleteLink = async (linkId: string) => {
//     if (!confirm(t("deleteThisInvitationLink"))) return;

//     try {
//       const { error } = await supabase
//         .from('referral_links')
//         .delete()
//         .eq('id', linkId);

//       if (error) throw error;
//       toast.success(t("linkDeleted"));
//       loadData();
//     } catch {
//       toast.error(t("errorDeleting"));
//     }
//   };

//   const deleteLinkedAccount = async (accountId: string) => {
//     if (!confirm(t("removeAccessConfirm"))) return;

//     try {
//       const { error } = await supabase
//         .from('linked_accounts')
//         .delete()
//         .eq('id', accountId);

//       if (error) throw error;
//       toast.success(t("accessRemoved"));
//       loadData();
//       onUpdate?.();
//     } catch {
//       toast.error(t("errorDeleting"));
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     const localeMap: Record<string, string> = {
//       'fr': 'fr-FR', 'en': 'en-US', 'es': 'es-ES', 'de': 'de-DE', 
//       'it': 'it-IT', 'pt': 'pt-BR', 'ar': 'ar-SA', 'zh': 'zh-CN', 
//       'ja': 'ja-JP', 'ru': 'ru-RU'
//     };
//     return date.toLocaleDateString(localeMap[language] || 'fr-FR', {
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   const generateLinkUrl = (linkCode: string) => {
//     return `${window.location.origin}/register?link=${linkCode}&family=true`;
//   };

//   if (!isEditable) return null;

//   return (
//     <div className="space-y-4">
//       {/* Button to create invite */}
//       <div className="flex justify-end">
//         <Button
//           size="sm"
//           onClick={handleOpenDialog}
//           disabled={isCreating || isSendingEmail}
//           className="bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
//         >
//           {isLoading ? (
//             <>
//               <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
//               <span className="hidden sm:inline">{t("inviteClose")}</span>
//             </>
//           ) : (
//             <>
//               <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
//               <span>{t("inviteClose")}</span>
//             </>
//           )}
//         </Button>
//       </div>

//       {/* Display linked accounts */}
//       {linkedAccounts.length > 0 && (
//         <div className="space-y-3">
//           <h4 className="text-sm font-medium text-gold/80 flex items-center gap-2">
//             <Users className="w-4 h-4" />
//             {t("associatedAccounts")} ({linkedAccounts.length})
//           </h4>
//           <div className="grid gap-2">
//             {linkedAccounts.map((account) => (
//               <div
//                 key={account.id}
//                 className="flex items-center justify-between p-3 bg-gold/5 rounded-lg border border-gold/10"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-medium">
//                     {account.linked_profile?.first_name?.[0] || '?'}
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium">
//                       {account.linked_profile 
//                         ? `${account.linked_profile.first_name} ${account.linked_profile.last_name}`
//                         : t('user')
//                       }
//                     </p>
//                     <p className="text-xs text-muted-foreground">
//                       {`${t("associatedOn")} ${formatDate(account.created_at)}`}
//                     </p>
//                   </div>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => deleteLinkedAccount(account.id)}
//                   className="text-destructive hover:text-destructive hover:bg-destructive/10"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                 </Button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Display active family links */}
//       {familyLinks.length > 0 && (
//         <div className="space-y-3">
//           <h4 className="text-sm font-medium text-gold/80 flex items-center gap-2">
//             <Link2 className="w-4 h-4" />
//             {t("activeInvitationLinks")}
//           </h4>
//           <div className="grid gap-2">
//             {familyLinks.map((link) => (
//               <div
//                 key={link.id}
//                 className="flex items-center justify-between p-3 bg-gold/5 rounded-lg border border-gold/10"
//               >
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium truncate">{link.link_name}</p>
//                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                     <span>{`${link.registration_count || 0} ${t("registrations")}`}</span>
//                     <span>•</span>
//                     <span>{`${t("createdOn")} ${formatDate(link.created_at)}`}</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       const url = generateLinkUrl(link.link_code);
//                       window.open(url, '_blank', 'noopener,noreferrer');
//                     }}
//                     className="border-gold/30 text-gold hover:bg-gold/10 text-xs"
//                     title={t("openLink")}
//                   >
//                     <Link2 className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => copyToClipboard(generateLinkUrl(link.link_code), link.id)}
//                     className="border-gold/30 text-gold hover:bg-gold/10 text-xs"
//                     title={t("copyLink")}
//                   >
//                     {copiedLinkId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => deleteLink(link.id)}
//                     className="text-destructive hover:text-destructive hover:bg-destructive/10"
//                     title={t("delete")}
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Empty state */}
//       {!isLoading && linkedAccounts.length === 0 && familyLinks.length === 0 && (
//         <p className="text-sm text-muted-foreground italic text-center py-4">
//           {t("inviteCloseToViewProfile")}
//         </p>
//       )}

//       {/* Dialog to create invite */}
//       <Dialog open={isOpen} onOpenChange={(open) => {
//         setIsOpen(open);
//         if (!open) {
//           setLinkName("");
//           setRecipientEmail("");
//           setNewLinkUrl("");
//           setStep('create');
//         }
//       }}>
//         <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
//           <DialogHeader className="space-y-2 sm:space-y-3">
//             <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
//               <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
//               <span className="break-words">{t("inviteClose")}</span>
//             </DialogTitle>
//             <DialogDescription className="text-xs sm:text-sm">
//               {step === 'create' 
//                 ? t("createInvitationLinkForFamily")
//                 : t("shareLinkByEmailOrCopy")
//               }
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
//             <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 sm:p-3">
//               <p className="text-xs sm:text-sm text-amber-200">
//                 {t("accessLimited")}
//               </p>
//             </div>

//             {step === 'create' ? (
//               <div className="space-y-3">
//                 <div>
//                   <Label htmlFor="linkName" className="text-xs sm:text-sm">{t("linkNameExample")}</Label>
//                   <Input
//                     id="linkName"
//                     value={linkName}
//                     onChange={(e) => setLinkName(e.target.value)}
//                     placeholder={t("giveNameThisLink")}
//                     className="mt-1 h-9 sm:h-10 text-sm"
//                   />
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-3 sm:space-y-4">
//                 {/* Copy link section */}
//                 <div>
//                   <Label className="text-xs sm:text-sm">{t("invitationLinkCreated")}</Label>
//                   <div className="flex flex-col sm:flex-row gap-2 mt-1">
//                     <Input
//                       value={newLinkUrl}
//                       readOnly
//                       className="text-xs sm:text-sm h-9 sm:h-10 flex-1 min-w-0"
//                     />
//                     <div className="flex gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           copyToClipboard(newLinkUrl);
//                           setIsNewLinkCopied(true);
//                           setTimeout(() => setIsNewLinkCopied(false), 2000);
//                         }}
//                         className="border-gold/30 text-gold hover:bg-gold/10 flex-1 sm:flex-shrink-0"
//                         title={t("copyLink")}
//                       >
//                         {isNewLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
//                         <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:inline">{t("copyLink")}</span>
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => window.open(newLinkUrl, '_blank', 'noopener,noreferrer')}
//                         className="border-gold/30 text-gold hover:bg-gold/10 flex-1 sm:flex-shrink-0"
//                         title={t("openLink")}
//                       >
//                         <Link2 className="w-4 h-4" />
//                         <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:inline">{t("openLink")}</span>
//                       </Button>
//                     </div>
//                   </div>
//                   <p className="text-xs text-muted-foreground mt-2">
//                     {t("clickToOpenOrCopyLink")}
//                   </p>
//                 </div>

//                 {/* Email section */}
//                 <div className="border-t border-border pt-3 sm:pt-4">
//                   <Label htmlFor="recipientEmail" className="flex items-center gap-2 text-xs sm:text-sm">
//                     <Mail className="w-4 h-4 flex-shrink-0" />
//                     {t("sendByEmail")}
//                   </Label>
//                   <div className="flex flex-col sm:flex-row gap-2 mt-1">
//                     <Input
//                       id="recipientEmail"
//                       type="email"
//                       value={recipientEmail}
//                       onChange={(e) => setRecipientEmail(e.target.value)}
//                       placeholder={t("emailExample")}
//                       className="flex-1 h-9 sm:h-10 text-sm"
//                     />
//                     <Button
//                       onClick={sendInviteEmail}
//                       disabled={isSendingEmail || !recipientEmail.trim()}
//                       className="bg-gold text-black hover:bg-gold/90 flex-shrink-0 h-9 sm:h-10"
//                     >
//                       {isSendingEmail ? (
//                         <>
//                           <Loader2 className="w-4 h-4 animate-spin mr-1 sm:mr-2" />
//                           <span className="text-xs sm:text-sm">{t("sending")}</span>
//                         </>
//                       ) : (
//                         <>
//                           <Send className="w-4 h-4 mr-1 sm:mr-2" />
//                           <span className="text-xs sm:text-sm">{t("send")}</span>
//                         </>
//                       )}
//                     </Button>
//                   </div>
//                 </div>

//                 <p className="text-xs text-muted-foreground">
//                   {t("invitedPersonIdentityVerification")}
//                 </p>
//               </div>
//             )}
//           </div>

//           <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
//             {step === 'create' ? (
//               <>
//                 <Button 
//                   variant="outline" 
//                   onClick={() => setIsOpen(false)}
//                   className="w-full sm:w-auto order-2 sm:order-1"
//                 >
//                   {t("cancel")}
//                 </Button>
//                 <Button
//                   onClick={createFamilyLink}
//                   disabled={isCreating || !linkName.trim()}
//                   className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto order-1 sm:order-2"
//                 >
//                   {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
//                   {t("createLink")}
//                 </Button>
//               </>
//             ) : (
//               <Button 
//                 onClick={() => setIsOpen(false)} 
//                 className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto"
//               >
//                 {t("done")}
//               </Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };


import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Link2, Copy, Check, Trash2, Loader2, Users, Mail, Send, Briefcase, Heart, Crown, Globe, ShoppingBag, Headphones, MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

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
  const { t, language } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isNewLinkCopied, setIsNewLinkCopied] = useState(false);

  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [familyLinks, setFamilyLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [linkName, setLinkName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [step, setStep] = useState<"create" | "share">("create");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  useEffect(() => {
    if (isEditable) loadData();
    else setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditable]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // linked accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("linked_accounts")
        .select("*")
        .eq("sponsor_id", user.id);

      if (accountsError) throw accountsError;

      if (accounts && accounts.length > 0) {
        const linkedUserIds = accounts.map((a: any) => a.linked_user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", linkedUserIds);

        if (profilesError) throw profilesError;

        const accountsWithProfiles = accounts.map((account: any) => ({
          ...account,
          linked_profile: profiles?.find((p: any) => p.id === account.linked_user_id),
        }));

        setLinkedAccounts(accountsWithProfiles);
      } else {
        setLinkedAccounts([]);
      }

      // family links
      const { data: links, error: linksError } = await supabase
        .from("referral_links")
        .select("*")
        .eq("sponsor_id", user.id)
        .eq("is_family_link", true)
        .order("created_at", { ascending: false });

      if (linksError) throw linksError;

      setFamilyLinks(links || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("errorLoadingData") || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialogState = () => {
    setStep("create");
    setLinkName("");
    setRecipientEmail("");
    setNewLinkUrl("");
    setCopiedLinkId(null);
    setIsNewLinkCopied(false);
    setSelectedPages([]);
  };

  // Available pages for selection
  const availablePages = [
    { route: "/profile", label: t("profile"), icon: User, description: t("profileDescription") || "Profil personnel" },
    { route: "/business", label: t("business"), icon: Briefcase, description: t("businessDescription") || "Activités professionnelles" },
    { route: "/family", label: t("family"), icon: Heart, description: t("familyDescription") || "Lignée et alliances" },
    { route: "/personal", label: t("personal"), icon: Crown, description: t("personalDescription") || "Passions" },
    { route: "/network", label: t("network"), icon: Globe, description: t("networkDescription") || "Réseau d'influence" },
    { route: "/members", label: t("members"), icon: Users, description: t("membersDescription") || "Annuaire des membres" },
    { route: "/marketplace", label: t("marketplace"), icon: ShoppingBag, description: t("marketplaceDescription") || "Place de marché" },
    { route: "/concierge", label: t("concierge"), icon: Headphones, description: t("conciergeDescription") || "Service conciergerie" },
    { route: "/messages", label: t("messages"), icon: MessageSquare, description: t("messagesDescription") || "Messages privés" },
  ];

  const togglePageSelection = (route: string) => {
    setSelectedPages((prev) =>
      prev.includes(route) ? prev.filter((p) => p !== route) : [...prev, route]
    );
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    resetDialogState();
  };

  const generateLinkUrl = (linkCode: string) =>
    `${window.location.origin}/register?link=${linkCode}&family=true`;

  const createFamilyLink = async () => {
    if (!linkName.trim()) {
      toast.error(t("pleaseGiveLinkName"));
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.referral_code) {
        toast.error(t("referralCodeNotFound"));
        return;
      }

      const generateLinkCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "AURORA-LINK-";
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
      };

      const linkCode = generateLinkCode();

      const { data, error } = await supabase
        .from("referral_links")
        .insert({
          sponsor_id: user.id,
          referral_code: profile.referral_code,
          link_code: linkCode,
          link_name: linkName.trim(),
          is_family_link: true,
          is_active: true,
          allowed_pages: selectedPages.length > 0 ? selectedPages : null,
        })
        .select()
        .single();

      if (error) throw error;

      const linkUrl = generateLinkUrl(data.link_code);
      setNewLinkUrl(linkUrl);
      setStep("share");
      setCopiedLinkId(null);
      setIsNewLinkCopied(false);

      toast.success(t("familyLinkCreatedSuccessfully"));
      await loadData();
    } catch (error) {
      console.error("Error creating family link:", error);
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
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      const senderName = profile ? `${profile.first_name} ${profile.last_name}` : t("anAuroraMember");

      const { error } = await supabase.functions.invoke("send-family-invite", {
        body: {
          recipientEmail: recipientEmail.trim(),
          senderName,
          inviteLink: newLinkUrl,
          linkName: linkName,
        },
      });

      if (error) throw error;

      toast.success(`${t("invitationSentTo")} ${recipientEmail}`);
      setRecipientEmail("");
    } catch (error) {
      console.error("Error sending invite email:", error);
      toast.error(t("errorSendingEmailCopyManually"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  // const copyToClipboard = async (url: string, linkId?: string) => {
  //   try {
  //     await navigator.clipboard.writeText(url);
  //     if (linkId) {
  //       setCopiedLinkId(linkId);
  //       setTimeout(() => setCopiedLinkId(null), 2000);
  //     }
  //     toast.success(t("linkCopied"));
  //   } catch (error) {
  //     console.error("Error copying to clipboard:", error);
  //     toast.error(t("errorCopying"));
  //   }
  // };
  const copyToClipboard = async (text: string, linkId?: string) => {
    const markCopied = () => {
      if (linkId) {
        setCopiedLinkId(linkId);
        setTimeout(() => setCopiedLinkId(null), 2000);
      }
    };
  
    const fallbackExecCommandCopy = (value: string) => {
      const ta = document.createElement("textarea");
      ta.value = value;
  
      // éviter le scroll / garder hors écran
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      ta.style.opacity = "0";
  
      document.body.appendChild(ta);
  
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length); // iOS
  
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
  
      return ok;
    };
  
    try {
      // 1) API moderne (nécessite https + permissions)
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        markCopied();
        toast.success(t("linkCopied"));
        return;
      }
  
      // 2) Fallback legacy
      const ok = fallbackExecCommandCopy(text);
      if (ok) {
        markCopied();
        toast.success(t("linkCopied"));
        return;
      }
  
      // 3) Dernier recours (quand tout est bloqué)
      // Affiche le texte pour copie manuelle
      // (tu peux remplacer par un Dialog shadcn)
      window.prompt(t("copyManually") || "Copiez ce texte :", text);
      toast.success(t("copyManuallyShown") || "Copie manuelle affichée");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      // Même en erreur, tente au moins le prompt
      try {
        window.prompt(t("copyManually") || "Copiez ce texte :", text);
      } catch {}
      toast.error(t("errorCopying"));
    }
  };
  

  const deleteLink = async (linkId: string) => {
    if (!confirm(t("deleteThisInvitationLink"))) return;

    try {
      const { error } = await supabase.from("referral_links").delete().eq("id", linkId);
      if (error) throw error;

      toast.success(t("linkDeleted"));
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error(t("errorDeleting"));
    }
  };

  const deleteLinkedAccount = async (accountId: string) => {
    if (!confirm(t("removeAccessConfirm"))) return;

    try {
      const { error } = await supabase.from("linked_accounts").delete().eq("id", accountId);
      if (error) throw error;

      toast.success(t("accessRemoved"));
      await loadData();
      onUpdate?.();
    } catch (e) {
      console.error(e);
      toast.error(t("errorDeleting"));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const localeMap: Record<string, string> = {
      fr: "fr-FR",
      en: "en-US",
      es: "es-ES",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-BR",
      ar: "ar-SA",
      zh: "zh-CN",
      ja: "ja-JP",
      ru: "ru-RU",
    };
    return date.toLocaleDateString(localeMap[language] || "fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!isEditable) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleOpenDialog}
          disabled={isCreating || isSendingEmail}
          className="bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">{t("inviteClose")}</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span>{t("inviteClose")}</span>
            </>
          )}
        </Button>
      </div>

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
                    {account.linked_profile?.first_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {account.linked_profile
                        ? `${account.linked_profile.first_name} ${account.linked_profile.last_name}`
                        : t("user")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {`${t("associatedOn")} ${formatDate(account.created_at)}`}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{`${link.registration_count || 0} ${t("registrations")}`}</span>
                    <span>•</span>
                    <span>{`${t("createdOn")} ${formatDate(link.created_at)}`}</span>
                    {link.allowed_pages && Array.isArray(link.allowed_pages) && link.allowed_pages.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-gold/70">
                          {link.allowed_pages.length} {t("pages") || "pages"}
                        </span>
                      </>
                    )}
                  </div>
                  {link.allowed_pages && Array.isArray(link.allowed_pages) && link.allowed_pages.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {link.allowed_pages.slice(0, 3).map((route: string) => {
                        const page = availablePages.find((p) => p.route === route);
                        if (!page) return null;
                        const Icon = page.icon;
                        return (
                          <div
                            key={route}
                            className="flex items-center gap-1 bg-gold/10 border border-gold/20 rounded px-1.5 py-0.5 text-xs"
                          >
                            <Icon className="w-3 h-3 text-gold/70" />
                            <span className="text-gold/70">{page.label}</span>
                          </div>
                        );
                      })}
                      {link.allowed_pages.length > 3 && (
                        <span className="text-xs text-gold/50">
                          +{link.allowed_pages.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = generateLinkUrl(link.link_code);
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="border-gold/30 text-gold hover:bg-gold/10 text-xs"
                    title={t("openLink")}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateLinkUrl(link.link_code), link.id)}
                    className="border-gold/30 text-gold hover:bg-gold/10 text-xs"
                    title={t("copyLink")}
                  >
                    {copiedLinkId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLink(link.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title={t("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && linkedAccounts.length === 0 && familyLinks.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          {t("inviteCloseToViewProfile")}
        </p>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetDialogState();
        }}
      >
        <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0" />
              <span className="break-words">{t("inviteClose")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {step === "create" ? t("createInvitationLinkForFamily") : t("shareLinkByEmailOrCopy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-amber-200">{t("accessLimited")}</p>
            </div>

            {step === "create" ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="linkName" className="text-xs sm:text-sm">
                    {t("linkNameExample")}
                  </Label>
                  <Input
                    id="linkName"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder={t("giveNameThisLink")}
                    className="mt-1 h-9 sm:h-10 text-sm"
                  />
                </div>

                {/* Page Selection Section */}
                <div>
                  <Label className="text-xs sm:text-sm mb-3 block">
                    {t("selectAccessiblePages") || "Sélectionnez les pages accessibles"}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t("selectPagesDescription") || "Choisissez les pages auxquelles la personne invitée aura accès"}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2 border border-gold/20 rounded-lg bg-black/20">
                    {availablePages.map((page) => {
                      const isSelected = selectedPages.includes(page.route);
                      const Icon = page.icon;
                      return (
                        <Card
                          key={page.route}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-gold/20 border-gold/50 ring-2 ring-gold/30"
                              : "bg-black/30 border-gold/10 hover:border-gold/30"
                          }`}
                          onClick={() => togglePageSelection(page.route)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg flex-shrink-0 ${
                                  isSelected ? "bg-gold/20 text-gold" : "bg-gold/5 text-gold/60"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-sm font-medium ${isSelected ? "text-gold" : "text-gold/80"}`}>
                                    {page.label}
                                  </p>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-gold/50 mt-1 line-clamp-1">
                                  {page.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {selectedPages.length > 0 && (
                    <p className="text-xs text-gold/60 mt-2">
                      {t("selectedPagesCount") || "Pages sélectionnées"}: {selectedPages.length} / {availablePages.length}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Selected Pages Summary */}
                {selectedPages.length > 0 && (
                  <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
                    <Label className="text-xs sm:text-sm text-gold/80 mb-2 block">
                      {t("selectedPagesCount") || "Pages sélectionnées"} ({selectedPages.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedPages.map((route) => {
                        const page = availablePages.find((p) => p.route === route);
                        if (!page) return null;
                        const Icon = page.icon;
                        return (
                          <div
                            key={route}
                            className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-md px-2 py-1 text-xs"
                          >
                            <Icon className="w-3 h-3 text-gold" />
                            <span className="text-gold/90">{page.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs sm:text-sm">{t("invitationLinkCreated")}</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Input value={newLinkUrl} readOnly className="text-xs sm:text-sm h-9 sm:h-10 flex-1 min-w-0" />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          copyToClipboard(newLinkUrl);
                          setIsNewLinkCopied(true);
                          setTimeout(() => setIsNewLinkCopied(false), 2000);
                        }}
                        className="border-gold/30 text-gold hover:bg-gold/10 flex-1 sm:flex-shrink-0"
                        title={t("copyLink")}
                      >
                        {isNewLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:inline">{t("copyLink")}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(newLinkUrl, "_blank", "noopener,noreferrer")}
                        className="border-gold/30 text-gold hover:bg-gold/10 flex-1 sm:flex-shrink-0"
                        title={t("openLink")}
                      >
                        <Link2 className="w-4 h-4" />
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:inline">{t("openLink")}</span>
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t("clickToOpenOrCopyLink")}</p>
                </div>

                <div className="border-t border-border pt-3 sm:pt-4">
                  <Label htmlFor="recipientEmail" className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {t("sendByEmail")}
                  </Label>

                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder={"exemple@email.com"}
                      className="flex-1 h-9 sm:h-10 text-sm"
                    />

                    <Button
                      type="button"
                      onClick={sendInviteEmail}
                      disabled={isSendingEmail || !recipientEmail.trim()}
                      className="bg-gold text-black hover:bg-gold/90 flex-shrink-0 h-9 sm:h-10"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">{t("sending")}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">{t("send")}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{t("invitedPersonIdentityVerification")}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
            {step === "create" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  {t("cancel")}
                </Button>

                <Button
                  type="button"
                  onClick={createFamilyLink}
                  disabled={isCreating || !linkName.trim() || selectedPages.length === 0}
                  className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("createLink")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto"
              >
                {t("done")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
