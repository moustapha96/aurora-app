import { useState } from "react";
import { AuroraLogo } from "./AuroraLogo";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Menu, Settings, User, MessageSquare, FileText, Trash2, LogOut, Layout, Smartphone, Monitor, Apple, Globe, Briefcase, Heart, Users, Compass, ShoppingBag, Headphones, X, Home, Shield, Fingerprint } from "lucide-react";
import { usePlatformContext } from "@/contexts/PlatformContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export const Header = () => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { platform, isNative, isIOS, isAndroid, isWeb } = usePlatformContext();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAdminCheck();

  const navigationItems = [
    { label: "Accueil", icon: Home, path: "/member-card" },
    { label: "Business", icon: Briefcase, path: "/business" },
    { label: "Famille", icon: Heart, path: "/family" },
    { label: "Personnel", icon: User, path: "/personal" },
    { label: "Réseau", icon: Users, path: "/network" },
    { label: "Membres", icon: Compass, path: "/members" },
    { label: "Marketplace", icon: ShoppingBag, path: "/marketplace" },
    { label: "Conciergerie", icon: Headphones, path: "/concierge" },
  ];

  const getPlatformIcon = () => {
    if (isIOS) return <Apple className="w-3 h-3" />;
    if (isAndroid) return <Smartphone className="w-3 h-3" />;
    return <Monitor className="w-3 h-3" />;
  };

  const getPlatformLabel = () => {
    if (isIOS) return "iOS";
    if (isAndroid) return "Android";
    return "Web";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilisateur non connecté");
        return;
      }

      // Delete all user data from related tables
      const userId = user.id;
      
      // Delete in order to respect foreign key constraints
      await supabase.from('messages').delete().eq('sender_id', userId);
      await supabase.from('conversation_members').delete().eq('user_id', userId);
      await supabase.from('connection_requests').delete().or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);
      await supabase.from('friendships').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      await supabase.from('artwork_collection').delete().eq('user_id', userId);
      await supabase.from('business_content').delete().eq('user_id', userId);
      await supabase.from('family_content').delete().eq('user_id', userId);
      await supabase.from('social_influence').delete().eq('user_id', userId);
      await supabase.from('sports_hobbies').delete().eq('user_id', userId);
      await supabase.from('curated_sports').delete().eq('user_id', userId);
      await supabase.from('destinations').delete().eq('user_id', userId);
      await supabase.from('exhibitions').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);

      // Sign out
      await supabase.auth.signOut();
      
      toast.success("Compte supprimé avec succès");
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Erreur lors de la suppression du compte");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Navigation Menu - Visible on all screens */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">Navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <AuroraLogo size="sm" />
                    <span className="font-serif text-primary">AURORA</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col space-y-2">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className="justify-start gap-3 h-12"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Button>
                  ))}
                  <div className="border-t border-border my-4" />
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-12"
                    onClick={() => handleNavigate("/messages")}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Messages
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-12"
                    onClick={() => handleNavigate("/edit-profile")}
                  >
                    <User className="w-5 h-5" />
                    Mon Profil
                  </Button>
                  {isAdmin && (
                    <>
                      <div className="border-t border-border my-4" />
                      <Button
                        variant="ghost"
                        className="justify-start gap-3 h-12"
                        onClick={() => handleNavigate("/admin/dashboard")}
                      >
                        <Shield className="w-5 h-5" />
                        {t('administration')}
                      </Button>
                    </>
                  )}
                  <div className="border-t border-border my-4" />
                  <Button
                    variant="ghost"
                    className="justify-start gap-3 h-12 text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                    Déconnexion
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Center: Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer" 
              onClick={() => navigate("/member-card")}
            >
              <AuroraLogo size="sm" />
              <div>
                <h1 className="text-xl font-serif text-primary">AURORA</h1>
                <p className="text-xs text-muted-foreground tracking-widest">SOCIETY</p>
              </div>
            </div>
            
            {/* Right: User Actions */}
            <div className="flex items-center space-x-2">
              {/* Platform Indicator (for testing) */}
              <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-xs">
                {getPlatformIcon()}
                {getPlatformLabel()}
                {isNative && <span className="text-primary">•</span>}
              </Badge>

              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Globe className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={language === lang.code ? "bg-accent" : ""}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => navigate("/terms")}>
                <FileText className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
                <MessageSquare className="w-5 h-5" />
              </Button>
              
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/security-settings")}>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    {t('securitySettings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/landing-preview")}>
                    <Layout className="w-4 h-4 mr-2" />
                    {t('landingPages')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                        <Shield className="w-4 h-4 mr-2" />
                        {t('administration')}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logout')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('deleteAccount')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" size="icon" onClick={() => navigate("/edit-profile")}>
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
