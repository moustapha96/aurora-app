import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from './ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, isLoading } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      // Don't redirect, show access denied
    }
  }, [isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès Refusé</h1>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
            Seuls les administrateurs peuvent y accéder.
          </p>
          <Button onClick={() => navigate('/member-card')}>
            Retour à mon profil
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
