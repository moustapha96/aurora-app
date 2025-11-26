import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useLocation } from 'react-router-dom';
import { AuroraLogo } from './AuroraLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MaintenanceModeProps {
  children: React.ReactNode;
}

export const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ children }) => {
  const { settings, loading } = useSettings();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Don't block admin routes
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Don't block login page (admins need to be able to log in)
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  if (loading || adminLoading) {
    return <>{children}</>;
  }

  // If maintenance mode is enabled and user is not admin, show maintenance message
  if (settings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy-blue via-navy-blue-dark to-black flex items-center justify-center p-4">
        <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AuroraLogo />
            </div>
            <CardTitle className="text-gold text-2xl font-serif">
              Mode Maintenance
            </CardTitle>
            <CardDescription className="text-gold/60 mt-2">
              {settings.siteName || 'Aurora Society'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gold/80">
              L'application est actuellement en maintenance.
            </p>
            <p className="text-gold/60 text-sm">
              Nous travaillons à améliorer votre expérience. Veuillez réessayer plus tard.
            </p>
            {settings.siteDescription && (
              <p className="text-gold/40 text-xs mt-4">
                {settings.siteDescription}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

