/**
 * Connection Status Indicator
 * Affiche l'état de connexion en temps réel
 * Compatible Android, iOS, Web
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader2, CloudOff, Cloud, RefreshCw } from 'lucide-react';
import { useConnectionStatus, useOfflineQueue } from '@/hooks/useSync';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ConnectionStatusIndicatorProps {
  showLabel?: boolean;
  showQueueCount?: boolean;
  variant?: 'badge' | 'icon' | 'full';
  className?: string;
}

export function ConnectionStatusIndicator({
  showLabel = true,
  showQueueCount = true,
  variant = 'badge',
  className = ''
}: ConnectionStatusIndicatorProps) {
  const { isOnline, connectionQuality, isSlowConnection } = useConnectionStatus();
  const { queueLength, hasPendingActions } = useOfflineQueue();
  const [wasOffline, setWasOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Notify when connection is restored
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setWasOffline(false);
      if (hasPendingActions) {
        setSyncing(true);
        toast.info('Connexion rétablie, synchronisation en cours...');
        // Simulate sync time
        setTimeout(() => setSyncing(false), 2000);
      } else {
        toast.success('Connexion rétablie');
      }
    }
  }, [isOnline, wasOffline, hasPendingActions]);

  const getIcon = () => {
    if (syncing) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    if (!isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    if (isSlowConnection) {
      return <Wifi className="w-4 h-4 animate-pulse" />;
    }
    if (hasPendingActions) {
      return <CloudOff className="w-4 h-4" />;
    }
    return <Cloud className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (syncing) return 'Synchronisation...';
    if (!isOnline) return 'Hors ligne';
    if (isSlowConnection) return 'Connexion lente';
    if (hasPendingActions) return `${queueLength} en attente`;
    return 'Connecté';
  };

  const getVariantClass = () => {
    if (!isOnline) return 'bg-destructive/20 text-destructive border-destructive/30';
    if (syncing) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (isSlowConnection) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (hasPendingActions) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  // Don't render if everything is fine and we want minimal display
  if (variant === 'icon' && isOnline && !hasPendingActions && !isSlowConnection) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <div className={`${className}`} title={getLabel()}>
        {getIcon()}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <Badge 
        variant="outline" 
        className={`gap-1.5 text-xs ${getVariantClass()} ${className}`}
      >
        {getIcon()}
        {showLabel && <span>{getLabel()}</span>}
        {showQueueCount && hasPendingActions && !showLabel && (
          <span>{queueLength}</span>
        )}
      </Badge>
    );
  }

  // Full variant
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${getVariantClass()} ${className}`}>
      {getIcon()}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{getLabel()}</span>
        {hasPendingActions && (
          <span className="text-xs opacity-70">
            {queueLength} action{queueLength > 1 ? 's' : ''} en attente
          </span>
        )}
        {isSlowConnection && (
          <span className="text-xs opacity-70">
            Les actions peuvent être plus lentes
          </span>
        )}
      </div>
    </div>
  );
}
