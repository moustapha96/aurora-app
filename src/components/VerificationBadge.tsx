import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Shield, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'initiated' | 'review_needed' | 'not_verified';

interface VerificationBadgeProps {
  status: VerificationStatus;
  type?: 'identity' | 'document' | 'profile';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const statusConfig = {
  verified: {
    icon: ShieldCheck,
    text: 'Vérifié',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
    iconClassName: 'text-green-400'
  },
  pending: {
    icon: Clock,
    text: 'En attente',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    iconClassName: 'text-yellow-400'
  },
  initiated: {
    icon: Shield,
    text: 'Initié',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    iconClassName: 'text-blue-400'
  },
  rejected: {
    icon: ShieldX,
    text: 'Rejeté',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    iconClassName: 'text-red-400'
  },
  review_needed: {
    icon: ShieldAlert,
    text: 'À revoir',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    iconClassName: 'text-orange-400'
  },
  not_verified: {
    icon: AlertTriangle,
    text: 'Non vérifié',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    iconClassName: 'text-gray-400'
  }
};

const sizeConfig = {
  sm: {
    badge: 'px-1.5 py-0.5 text-[10px]',
    icon: 'w-3 h-3',
    iconOnly: 'w-4 h-4'
  },
  md: {
    badge: 'px-2 py-1 text-xs',
    icon: 'w-3.5 h-3.5',
    iconOnly: 'w-5 h-5'
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    iconOnly: 'w-6 h-6'
  }
};

export const VerificationBadge = ({
  status,
  type = 'document',
  size = 'sm',
  showText = true,
  className
}: VerificationBadgeProps) => {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  if (!showText) {
    return (
      <div 
        className={cn(
          "rounded-full flex items-center justify-center",
          config.iconClassName,
          className
        )}
        title={config.text}
      >
        <Icon className={sizes.iconOnly} />
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 font-medium border",
        config.className,
        sizes.badge,
        className
      )}
    >
      <Icon className={sizes.icon} />
      <span>{config.text}</span>
    </Badge>
  );
};

interface IdentityVerifiedBadgeProps {
  isVerified: boolean;
  /** Affiche aussi un badge "non vérifié" lorsque isVerified=false */
  showWhenNotVerified?: boolean;
  className?: string;
}

export const IdentityVerifiedBadge = ({
  isVerified,
  showWhenNotVerified = true,
  className,
}: IdentityVerifiedBadgeProps) => {
  if (!isVerified && !showWhenNotVerified) return null;

  const title = isVerified ? "Identité vérifiée" : "Identité non vérifiée";

  return (
    <div
      className={cn(
        "absolute -bottom-1 -right-1 rounded-full p-1 shadow-lg border-2 z-20",
        isVerified
          ? "bg-green-500 border-black"
          : "bg-gray-600 border-black",
        className
      )}
      title={title}
      aria-label={title}
    >
      {isVerified ? (
        <CheckCircle2 className="w-4 h-4 text-white" />
      ) : (
        <ShieldX className="w-4 h-4 text-white" />
      )}
    </div>
  );
};
