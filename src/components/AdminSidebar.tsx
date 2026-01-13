import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AuroraLogo } from './AuroraLogo';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  BarChart3,
  Link2,
  FileText,
  ScrollText,
  ClipboardList,
  Settings,
  ArrowLeft,
  LogOut,
  Menu,
  Clock,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const getMenuItems = (t: (key: string) => string) => [
  { path: '/admin/dashboard', label: t('adminMenuDashboard'), icon: LayoutDashboard },
  { path: '/admin/members', label: t('adminMenuMembers'), icon: Users },
  { path: '/admin/referrals', label: t('adminMenuReferrals'), icon: UserPlus },
  { path: '/admin/users-security', label: t('adminMenuUsersSecurity'), icon: Shield },
  { path: '/admin/roles', label: t('adminMenuRoles'), icon: Shield },
  { path: '/admin/document-verification', label: t('adminMenuDocumentVerification'), icon: FileText },
  { path: '/admin/moderation', label: t('adminMenuModeration'), icon: AlertTriangle },
  { path: '/admin/analytics', label: t('adminMenuAnalytics'), icon: BarChart3 },
  { path: '/admin/connections', label: t('adminMenuConnections'), icon: Link2 },
  { path: '/admin/content', label: t('adminMenuContent'), icon: FileText },
  { path: '/admin/api-config', label: t('adminMenuApiConfig'), icon: Link2 },
  { path: '/admin/cron', label: t('adminMenuCron'), icon: Clock },
  { path: '/admin/logs', label: t('adminMenuLogs'), icon: ScrollText },
  { path: '/admin/reports', label: t('adminMenuReports'), icon: ClipboardList },
  { path: '/admin/settings', label: t('adminMenuSettings'), icon: Settings },
];

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t('logoutSuccess'));
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const menuItems = getMenuItems(t);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AuroraLogo size="sm" />
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
            ADMIN
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => handleNavigate('/member-card')}
        >
          <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate">{t('adminMenuBackToSite')}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate">{t('adminMenuLogout')}</span>
        </Button>
      </div>
    </div>
  );
};

export const AdminSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: Hamburger button + Sheet drawer */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-card">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card">
            <SidebarContent onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-card border-r border-border flex-col">
        <SidebarContent />
      </aside>
    </>
  );
};
