import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  AlertTriangle, 
  BarChart3,
  Settings,
  Network,
  FileText,
  Activity,
  FileBarChart,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    if (adminLoading) return;
    
    if (isAdmin === false) {
      toast.error(t('adminAccessDenied'));
      navigate("/");
      return;
    }
  }, [isAdmin, adminLoading, navigate, t]);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || "");
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', user.id)
            .single();
          if (profile) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    if (isAdmin) {
      loadUserProfile();
    }
  }, [isAdmin]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <AuroraLogo size="lg" className="animate-pulse" />
      </div>
    );
  }

  if (isAdmin === false) {
    return null;
  }

  const navigationGroups = [
    {
      title: t('overview') || "Vue d'ensemble",
      items: [
        { icon: LayoutDashboard, label: t('adminDashboard'), path: "/admin/dashboard" },
      ]
    },
    {
      title: t('userManagement') || "Gestion des utilisateurs",
      items: [
        { icon: Users, label: t('adminMembers'), path: "/admin/members" },
        { icon: Shield, label: t('adminRoles'), path: "/admin/roles" },
        { icon: Network, label: t('adminConnections'), path: "/admin/connections" },
      ]
    },
    {
      title: t('contentModeration') || "Modération",
      items: [
        { icon: AlertTriangle, label: t('adminModeration'), path: "/admin/moderation" },
        { icon: FileText, label: t('adminContent'), path: "/admin/content" },
        { icon: FileBarChart, label: t('adminReports'), path: "/admin/reports" },
      ]
    },
    {
      title: t('analyticsAndLogs') || "Statistiques & Logs",
      items: [
        { icon: BarChart3, label: t('adminAnalytics'), path: "/admin/analytics" },
        { icon: Activity, label: t('adminLogs'), path: "/admin/logs" },
      ]
    },
    {
      title: t('configuration') || "Configuration",
      items: [
        { icon: Settings, label: t('adminSettings'), path: "/admin/settings" },
      ]
    },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t('logoutSuccess') || 'Déconnexion réussie');
      navigate("/login");
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error(t('error') || 'Erreur lors de la déconnexion');
    }
  };

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-black text-gold">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[hsl(var(--navy-blue-light))] border-b border-gold/20 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <AuroraLogo size="sm" />
          <div>
            <h1 className="text-sm font-serif text-gold">{settings.siteName || 'Aurora Society'}</h1>
            <p className="text-xs text-gold/60">Administration</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gold hover:bg-gold/10"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
          <div className="h-full flex flex-col bg-[hsl(var(--navy-blue-light))]">
            {/* Mobile Sidebar Header */}
            <div className="p-4 border-b border-gold/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AuroraLogo size="sm" />
                  <div>
                    <h2 className="text-sm font-serif text-gold">{settings.siteName || 'Aurora Society'}</h2>
                    <p className="text-xs text-gold/60">Administration</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gold hover:bg-gold/10"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              {/* User Info */}
              {userProfile && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gold/5">
                  <Avatar className="h-8 w-8 border border-gold/20">
                    <AvatarImage src={userProfile.avatar_url} />
                    <AvatarFallback className="bg-gold/10 text-gold text-xs">
                      {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gold truncate">
                      {userProfile.first_name} {userProfile.last_name}
                    </p>
                    <p className="text-xs text-gold/60 truncate">{userEmail}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-6">
                {navigationGroups.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <h3 className="text-xs font-semibold text-gold/60 uppercase tracking-wider mb-2 px-2">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.path}
                            variant="ghost"
                            onClick={() => {
                              navigate(item.path);
                              setSidebarOpen(false);
                            }}
                            className={cn(
                              "w-full justify-start text-gold hover:bg-gold/10 transition-colors",
                              isActive(item.path) && "bg-gold/20 border-l-2 border-gold font-medium"
                            )}
                          >
                            <Icon className="mr-3 h-4 w-4" />
                            {item.label}
                            {isActive(item.path) && (
                              <ChevronRight className="ml-auto h-4 w-4" />
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile Sidebar Footer */}
            <div className="p-4 border-t border-gold/20 space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/member-card");
                  setSidebarOpen(false);
                }}
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
              >
                <Home className="mr-2 h-4 w-4" />
                {t('backToApp')}
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full text-gold hover:bg-gold/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:bg-[hsl(var(--navy-blue-light))] lg:border-r lg:border-gold/20">
          {/* Desktop Sidebar Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gold/20">
            <div className="flex items-center gap-3">
              <AuroraLogo size="sm" />
              <div>
                <h1 className="text-sm font-serif text-gold">{settings.siteName || 'Aurora Society'}</h1>
                <p className="text-xs text-gold/60">Administration</p>
              </div>
            </div>
          </div>

          {/* User Profile Section */}
          {userProfile && (
            <div className="p-4 border-b border-gold/20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gold hover:bg-gold/10 h-auto p-3"
                  >
                    <Avatar className="h-10 w-10 border border-gold/20 mr-3">
                      <AvatarImage src={userProfile.avatar_url} />
                      <AvatarFallback className="bg-gold/10 text-gold">
                        {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gold truncate">
                        {userProfile.first_name} {userProfile.last_name}
                      </p>
                      <p className="text-xs text-gold/60 truncate">{userEmail}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-2 text-gold/60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[hsl(var(--navy-blue-light))] border-gold/20">
                  <DropdownMenuLabel className="text-gold">
                    {t('myAccount') || 'Mon compte'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gold/20" />
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="text-gold hover:bg-gold/10 cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('profile') || 'Profil'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="text-gold hover:bg-gold/10 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings') || 'Paramètres'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gold/20" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-gold hover:bg-gold/10 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logout') || 'Déconnexion'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {navigationGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className="text-xs font-semibold text-gold/60 uppercase tracking-wider mb-3 px-2">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.path}
                          variant="ghost"
                          onClick={() => navigate(item.path)}
                          className={cn(
                            "w-full justify-start text-gold hover:bg-gold/10 transition-all duration-200",
                            isActive(item.path) && "bg-gold/20 border-l-2 border-gold font-medium shadow-sm"
                          )}
                        >
                          <Icon className={cn(
                            "mr-3 h-4 w-4 transition-transform",
                            isActive(item.path) && "scale-110"
                          )} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {isActive(item.path) && (
                            <ChevronRight className="h-4 w-4 ml-2" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Desktop Sidebar Footer */}
          <div className="p-4 border-t border-gold/20 space-y-2">
            <Button
              variant="outline"
              onClick={() => navigate("/member-card")}
              className="w-full border-gold/30 text-gold hover:bg-gold/10"
            >
              <Home className="mr-2 h-4 w-4" />
              {t('backToApp')}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

