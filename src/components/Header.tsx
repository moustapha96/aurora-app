import { useState, useEffect } from "react";
import { AuroraLogo } from "./AuroraLogo";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Menu, Settings, User, MessageSquare, FileText, Trash2, LogOut, Layout, Smartphone, Monitor, Apple, Globe, Briefcase, Heart, Users, Compass, ShoppingBag, Headphones, Home, Shield, Fingerprint, Gift, CreditCard } from "lucide-react";
import { usePlatformContext } from "@/contexts/PlatformContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserNotifications } from "./UserNotifications";
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
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const { platform, isNative, isIOS, isAndroid, isWeb } = usePlatformContext();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useAdminCheck();
  const isMobile = useIsMobile();



  const navigationItems = [
    { label: t('home'), icon: Home, path: "/member-card" },
    { label: t('business'), icon: Briefcase, path: "/business" },
    { label: t('lineage'), icon: Heart, path: "/family" },
    { label: t('passions'), icon: User, path: "/personal" },
    { label: t('network'), icon: Users, path: "/network" },
    { label: t('members'), icon: Compass, path: "/members" },
    { label: t('referrals'), icon: Gift, path: "/referrals" },
    { label: t('marketplace'), icon: ShoppingBag, path: "/marketplace" },
    { label: t('concierge'), icon: Headphones, path: "/concierge" },
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
        toast.error(t('userNotConnected'));
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
      
      toast.success(t('accountDeletedSuccess'));
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t('accountDeletionError'));
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-primary/10">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Navigation Menu */}
            {isMobile ? (
              /* Mobile: Full Sheet Drawer */
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 flex flex-col overflow-hidden">
                  <SheetHeader className="flex-shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                      <AuroraLogo size="sm" />
                      <span className="font-serif text-primary">AURORA</span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-8 flex flex-col space-y-2 overflow-y-auto flex-1 pb-4">
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
                      {t('messages')}
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-12"
                      onClick={() => handleNavigate("/edit-profile")}
                    >
                      <User className="w-5 h-5" />
                      {t('myProfile')}
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
                      {t('logout')}
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              /* Desktop: Compact Dropdown Menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Menu className="w-4 h-4" />
                    <span>{t('navigation')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {navigationItems.map((item) => (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="gap-3"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/messages")} className="gap-3">
                    <MessageSquare className="w-4 h-4" />
                    {t('messages')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/edit-profile")} className="gap-3">
                    <User className="w-4 h-4" />
                    {t('myProfile')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin/dashboard")} className="gap-3">
                        <Shield className="w-4 h-4" />
                        {t('administration')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Center: Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer" 
              onClick={() => navigate("/member-card")}
            >
              <AuroraLogo size="sm" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-serif text-primary tracking-wider">AURORA</h1>
                <p className="text-[10px] text-muted-foreground tracking-[0.25em]">SOCIETY</p>
              </div>
            </div>
            
            {/* Right: User Actions - Hidden on mobile */}
            {!isMobile && (
              <div className="flex items-center space-x-2">
                {/* Platform Indicator (for testing) */}
                <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-xs">
                  {getPlatformIcon()}
                  {getPlatformLabel()}
                  {isNative && <span className="text-primary">•</span>}
                </Badge>

                {/* Account Number */}
                {/* {accountNumber && (
                  <div className="text-xs sm:text-sm font-mono text-muted-foreground px-2 sm:px-3 py-1 border border-border rounded-md">
                    {accountNumber}
                  </div>
                )} */}

                {/* User Notifications */}
                <UserNotifications />

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
                    <DropdownMenuItem onClick={() => navigate("/subscription")}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t('subscription')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
            )}
            
            {/* Mobile: Quick Actions */}
            {isMobile && (
              <div className="flex items-center space-x-1">
                {/* Account Number */}
                {accountNumber && (
                  <div className="text-xs font-mono text-muted-foreground px-2 py-1 border border-border rounded-md">
                    {accountNumber}
                  </div>
                )}

                {/* User Notifications */}
                <UserNotifications />
                
                {/* Language Switcher - Globe Icon */}
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
                
                {/* Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/subscription")}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t('subscription')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
                    <DropdownMenuItem onClick={() => navigate("/terms")}>
                      <FileText className="w-4 h-4 mr-2" />
                      CGU
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteAccountTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteAccountDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('deleting') : t('deletePermanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
