import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AuroraLogo } from './AuroraLogo';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
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

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/members', label: 'Membres', icon: Users },
  { path: '/admin/referrals', label: 'Parrainages', icon: UserPlus },
  { path: '/admin/users-security', label: 'Sécurité Utilisateurs', icon: Shield },
  { path: '/admin/roles', label: 'Rôles', icon: Shield },
  { path: '/admin/document-verification', label: 'Vérification Documents', icon: FileText },
  { path: '/admin/moderation', label: 'Modération', icon: AlertTriangle },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/connections', label: 'Connexions', icon: Link2 },
  { path: '/admin/content', label: 'Contenu', icon: FileText },
  { path: '/admin/api-config', label: 'APIs & Webhooks', icon: Link2 },
  { path: '/admin/cron', label: 'Tâches Cron', icon: Clock },
  { path: '/admin/logs', label: 'Logs', icon: ScrollText },
  { path: '/admin/reports', label: 'Rapports', icon: ClipboardList },
  { path: '/admin/settings', label: 'Paramètres', icon: Settings },
];

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

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
          <span className="truncate">Retour au site</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate">Déconnexion</span>
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
