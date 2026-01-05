import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MarketplaceCountdownProps {
  endDate: string | null;
  compact?: boolean;
}

export const MarketplaceCountdown = ({ endDate, compact = false }: MarketplaceCountdownProps) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate) {
    return null;
  }

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-1.5 text-destructive text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>{t('offerExpired')}</span>
      </div>
    );
  }

  if (compact) {
    const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;
    return (
      <div className={`flex items-center gap-1.5 text-sm ${isUrgent ? 'text-orange-500' : 'text-muted-foreground'}`}>
        <Clock className="w-3.5 h-3.5" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}j `}
          {String(timeLeft.hours).padStart(2, '0')}h{String(timeLeft.minutes).padStart(2, '0')}m
        </span>
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0;

  return (
    <div className={`rounded-lg p-3 ${isUrgent ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-primary/5 border border-primary/10'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-primary'}`} />
        <span className={`text-xs font-medium ${isUrgent ? 'text-orange-500' : 'text-primary'}`}>
          {t('offerEndsIn')}
        </span>
      </div>
      <div className="flex gap-2 justify-center">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">{t('days')}</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">{t('hours')}</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">{t('minutes')}</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-foreground">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">{t('seconds')}</div>
        </div>
      </div>
    </div>
  );
};
