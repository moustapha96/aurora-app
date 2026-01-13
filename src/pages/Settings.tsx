import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Globe, 
  Bell, 
  Shield, 
  User, 
  Fingerprint,
  Moon,
  Eye,
  Lock,
  Trash2,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { PageHeaderBackButton } from "@/components/BackButton";
import { IdentityVerification } from "@/components/IdentityVerification";
import NotificationSettings from "@/components/NotificationSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [settings, setSettings] = useState({
    biometricEnabled: false,
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    connectionNotifications: true,
    profileVisibility: "connections", // "public", "connections", "private"
    showWealthBadge: true,
    showLocation: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [accountNumber, setAccountNumber] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("biometric_enabled, account_number")
        .eq("id", user.id)
        .single();

      if (profile) {
        setSettings(prev => ({
          ...prev,
          biometricEnabled: profile.biometric_enabled || false,
        }));
        setAccountNumber(profile.account_number || "");
      }

      // Load settings from localStorage for client-side preferences
      const savedSettings = localStorage.getItem("aurora_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Save to localStorage
      localStorage.setItem("aurora_settings", JSON.stringify(newSettings));
      return newSettings;
    });

    // Special handling for biometric - save to database
    if (key === "biometricEnabled") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ biometric_enabled: value })
          .eq("id", user.id);
      }
    }

    toast({
      title: t('settingUpdated'),
      description: t('preferenceSaved'),
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Check if Clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast({
          title: t('accountNumberCopied'),
          description: t('clickToCopy'),
        });
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: t('accountNumberCopied'),
            description: t('clickToCopy'),
          });
        } catch (err) {
          console.error('Fallback copy failed:', err);
          toast({
            title: t('error'),
            description: t('copyAccountNumberError'),
            variant: "destructive",
          });
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: t('error'),
        description: t('copyAccountNumberError'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete user data from various tables
      await supabase.from("messages").delete().eq("sender_id", user.id);
      await supabase.from("conversation_members").delete().eq("user_id", user.id);
      await supabase.from("friendships").delete().or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      await supabase.from("connection_requests").delete().or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      await supabase.from("business_content").delete().eq("user_id", user.id);
      await supabase.from("family_content").delete().eq("user_id", user.id);
      await supabase.from("sports_hobbies").delete().eq("user_id", user.id);
      await supabase.from("artwork_collection").delete().eq("user_id", user.id);
      await supabase.from("destinations").delete().eq("user_id", user.id);
      await supabase.from("social_influence").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      await supabase.auth.signOut();
      
      toast({
        title: t('delete'),
        description: t('deleteForever'),
      });
      
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: t('error'),
        description: t('deleteAccountWarning'),
        variant: "destructive",
      });
    }
  };



  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center pt-32 sm:pt-36">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 max-w-2xl safe-area-all">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <PageHeaderBackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('settingsPageTitle')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('managePreferences')}</p>
          </div>
        </div>

        {/* Account Number Display */}
        {accountNumber && (
          <div className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t('accountNumber')}</p>
                <p className="text-lg sm:text-xl font-mono font-bold text-gold tracking-wider">
                  {accountNumber}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(accountNumber)}
                className="text-gold hover:bg-gold/20"
                title={t('clickToCopy')}
              >
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
         

          {/* Mobile Push Notifications */}
          <NotificationSettings />

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('emailNotifications')}
              </CardTitle>
              <CardDescription>{t('manageEmailPreferences')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">{t('emailNotificationsLabel')}</Label>
                <Switch
                  id="email-notif"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="message-notif">{t('newMessages')}</Label>
                <Switch
                  id="message-notif"
                  checked={settings.messageNotifications}
                  onCheckedChange={(checked) => updateSetting("messageNotifications", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="connection-notif">{t('connectionRequestsLabel')}</Label>
                <Switch
                  id="connection-notif"
                  checked={settings.connectionNotifications}
                  onCheckedChange={(checked) => updateSetting("connectionNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('privacy')}
              </CardTitle>
              <CardDescription>{t('controlWhoSees')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('profileVisibility')}</Label>
                <Select 
                  value={settings.profileVisibility} 
                  onValueChange={(value) => updateSetting("profileVisibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{t('publicAllMembers')}</SelectItem>
                    <SelectItem value="connections">{t('connectionsOnly')}</SelectItem>
                    <SelectItem value="private">{t('privateOnlyYou')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="show-wealth">{t('showWealthBadge')}</Label>
                <Switch
                  id="show-wealth"
                  checked={settings.showWealthBadge}
                  onCheckedChange={(checked) => updateSetting("showWealthBadge", checked)}
                />
              </div>
              {/* <Separator /> */}
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="show-location">{t('showLocation')}</Label>
                <Switch
                  id="show-location"
                  checked={settings.showLocation}
                  onCheckedChange={(checked) => updateSetting("showLocation", checked)}
                />
              </div> */}
            </CardContent>
          </Card>
          {/* Identity Verification */}
          <IdentityVerification onVerificationChange={loadSettings} />

          {/* Biometric Authentication - Link to dedicated page */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                {t('biometricAuthSettings')}
              </CardTitle>
              <CardDescription>
                {t('configureBiometric')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/security-settings")}
              >
                <Shield className="h-4 w-4 mr-2" />
                {t('manageBiometric')}
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('security')}
              </CardTitle>
              <CardDescription>{t('securityDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={() => navigate("/login?mode=reset")}>
                <Lock className="h-4 w-4 mr-2" />
                {t('changePassword')}
              </Button>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('accountSection')}
              </CardTitle>
              <CardDescription>{t('accountManagementSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/edit-profile")}
              >
                {t('editProfile')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/landing-preview")}
              >
                {t('manageLanding')}
              </Button>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full h-9 sm:h-10 px-2 sm:px-4">
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('deleteAccount')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteAccountConfirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('deleteAccountWarning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                      {t('deleteAccountPermanently')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
