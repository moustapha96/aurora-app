import { AuroraLogo } from "./AuroraLogo";
import { Button } from "./ui/button";
import { Menu, Settings, User, MessageSquare, FileText, Globe, LogOut, Briefcase, Heart, Crown, Users, Network as NetworkIcon, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdmin } from "@/hooks/useAdmin";
import { LayoutDashboard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { settings } = useSettings();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, loading: roleLoading } = useUserRole();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(t('logoutSuccess') || 'Déconnexion réussie');
      setIsAuthenticated(false);
      navigate("/login");
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error(t('error') || 'Erreur lors de la déconnexion');
    }
  };

  const navigationItems = [
    { path: "/business", label: t('business'), icon: Briefcase },
    { path: "/personal", label: t('personal'), icon: Crown },
    { path: "/family", label: t('family'), icon: Heart },
    { path: "/network", label: t('network'), icon: NetworkIcon },
    { path: "/referrals", label: t('myReferralNetwork') || 'Parrainage', icon: NetworkIcon },
    { path: "/members", label: t('members'), icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Menu & Logo */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <AuroraLogo size="sm" />
                    <div>
                      <h1 className="text-lg font-serif text-primary">{settings.siteName || 'AURORA'}</h1>
                      <p className="text-xs text-muted-foreground tracking-widest">
                        {settings.siteDescription ? settings.siteDescription.substring(0, 20) + '...' : 'SOCIETY'}
                      </p>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-8 space-y-2">
                  {isAuthenticated && navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant={isActive(item.path) ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3"
                        onClick={() => handleNavigation(item.path)}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                  <div className="pt-4 border-t">
                   
                    {isAuthenticated && (
                      <>
                        {/* User Role in Mobile Menu */}
                        {!roleLoading && role && (
                          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-md bg-accent/50 border border-border">
                            {role === 'admin' && <Shield className="w-4 h-4 text-gold" />}
                            <span className="text-sm font-medium text-foreground">
                              {role === 'admin' ? t('admin') || 'Admin' : t('member') || 'Member'}
                            </span>
                          </div>
                        )}
                        {/* Admin Access Button in Mobile Menu */}
                        {!adminLoading && isAdmin && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20"
                            onClick={() => handleNavigation("/admin/dashboard")}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t('adminDashboard') || 'Administration'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={() => handleNavigation("/messages")}
                        >
                          <MessageSquare className="w-4 h-4" />
                          {t('messages') || 'Messages'}
                        </Button>
                      
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={() => handleNavigation("/edit-profile")}
                        >
                          <User className="w-4 h-4" />
                          {t('profile') || 'Profil'}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4" />
                          {t('logout') || 'Déconnexion'}
                        </Button>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo - Clickable */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <AuroraLogo size="sm" />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-serif text-primary">{settings.siteName || 'AURORA'}</h1>
                <p className="text-xs text-muted-foreground tracking-widest">
                  {settings.siteDescription ? settings.siteDescription.substring(0, 20) + '...' : 'SOCIETY'}
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(item.path)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
            )}
          </div>
          
          {/* Right: User Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px] sm:w-[140px] h-9 bg-background border-border text-foreground">
                <Globe className="w-4 h-4 mr-1 sm:mr-2" />
                <SelectValue className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">
                    {languages.find(lang => lang.code === language)?.flag || '🌐'} {languages.find(lang => lang.code === language)?.name || language.toUpperCase()}
                  </span>
                  <span className="sm:hidden">
                    {languages.find(lang => lang.code === language)?.flag || '🌐'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {languages.map((lang) => (
                  <SelectItem 
                    key={lang.code} 
                    value={lang.code}
                    className="text-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Public Actions */}
            {/* <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/terms")}
              className="hidden sm:flex"
              title={t('terms') || 'Conditions'}
            >
              <FileText className="w-5 h-5" />
            </Button> */}

            {/* Authenticated Actions */}
            {isAuthenticated && (
              <>
                {/* User Role Badge */}
                {!roleLoading && role && (
                  <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-accent/50 border border-border">
                    {role === 'admin' && <Shield className="w-4 h-4 text-gold" />}
                    <span className="text-xs font-medium text-foreground">
                      {role === 'admin' ? t('admin') || 'Admin' : t('member') || 'Member'}
                    </span>
                  </div>
                )}
                {/* Admin Access Button */}
                {!adminLoading && isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/admin/dashboard")}
                    className="hidden sm:flex items-center gap-2 border-gold/30 text-gold hover:bg-gold/10 bg-gold/5"
                    title={t('adminDashboard') || 'Administration'}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden lg:inline">{t('adminDashboard') || 'Admin'}</span>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/messages")}
                  title={t('messages') || 'Messages'}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
                {/* <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/settings")}
                  className="hidden sm:flex"
                  title={t('settings') || 'Paramètres'}
                >
                  <Settings className="w-5 h-5" />
                </Button> */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/edit-profile")}
                  className="hidden sm:flex"
                  title={t('profile') || 'Profil'}
                >
                  <User className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={t('logout') || 'Déconnexion'}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};