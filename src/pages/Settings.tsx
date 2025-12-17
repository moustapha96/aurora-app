import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import { IdentityVerification } from "@/components/IdentityVerification";
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
  const { language, setLanguage, t } = useLanguage();
  
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
        .select("biometric_enabled")
        .eq("id", user.id)
        .single();

      if (profile) {
        setSettings(prev => ({
          ...prev,
          biometricEnabled: profile.biometric_enabled || false,
        }));
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
      title: "Paramètre mis à jour",
      description: "Vos préférences ont été enregistrées",
    });
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
        title: "Compte supprimé",
        description: "Votre compte a été définitivement supprimé",
      });
      
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "destructive",
      });
    }
  };

  const languages = [
    { code: "fr", name: "Français" },
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ar", name: "العربية" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ru", name: "Русский" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 max-w-2xl safe-area-all">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Paramètres</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gérez vos préférences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Langue
              </CardTitle>
              <CardDescription>Choisissez la langue de l'application</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Gérez vos préférences de notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">Notifications par email</Label>
                <Switch
                  id="email-notif"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notif">Notifications push</Label>
                <Switch
                  id="push-notif"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="message-notif">Nouveaux messages</Label>
                <Switch
                  id="message-notif"
                  checked={settings.messageNotifications}
                  onCheckedChange={(checked) => updateSetting("messageNotifications", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="connection-notif">Demandes de connexion</Label>
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
                Confidentialité
              </CardTitle>
              <CardDescription>Contrôlez qui peut voir vos informations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Visibilité du profil</Label>
                <Select 
                  value={settings.profileVisibility} 
                  onValueChange={(value) => updateSetting("profileVisibility", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (tous les membres)</SelectItem>
                    <SelectItem value="connections">Connexions uniquement</SelectItem>
                    <SelectItem value="private">Privé (vous seul)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="show-wealth">Afficher le badge de richesse</Label>
                <Switch
                  id="show-wealth"
                  checked={settings.showWealthBadge}
                  onCheckedChange={(checked) => updateSetting("showWealthBadge", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="show-location">Afficher la localisation</Label>
                <Switch
                  id="show-location"
                  checked={settings.showLocation}
                  onCheckedChange={(checked) => updateSetting("showLocation", checked)}
                />
              </div>
            </CardContent>
          </Card>
          {/* Identity Verification */}
          <IdentityVerification />

          {/* Biometric Authentication - Link to dedicated page */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Authentification Biométrique
              </CardTitle>
              <CardDescription>
                Configurez Face ID, Touch ID ou Windows Hello pour une connexion sécurisée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/security-settings")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Gérer la sécurité biométrique
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
              <CardDescription>Paramètres de sécurité de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={() => navigate("/login?mode=reset")}>
                <Lock className="h-4 w-4 mr-2" />
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Compte
              </CardTitle>
              <CardDescription>Gestion de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/edit-profile")}
              >
                Modifier le profil
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/landing-preview")}
              >
                Gérer la page d'atterrissage
              </Button>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer le compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes vos données, connexions, messages et contenus seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                      Supprimer définitivement
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
