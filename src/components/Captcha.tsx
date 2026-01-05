import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (element: HTMLElement, options: { sitekey: string; size: string }) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  action?: string;
  siteKey?: string;
}

export const Captcha = ({ onVerify, onError, action = 'submit', siteKey }: CaptchaProps) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // Load reCAPTCHA script
  useEffect(() => {
    if (!siteKey) {
      console.warn('CAPTCHA site key not configured');
      return;
    }

    // Check if script is already loaded
    if (window.grecaptcha) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      if (onError) {
        onError(t('captchaLoadError') || 'Failed to load CAPTCHA');
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector(`script[src*="recaptcha"]`);
      if (existingScript) {
        // Don't remove script as it might be used by other components
      }
    };
  }, [siteKey, onError, t]);

  const executeCaptcha = async () => {
    if (!siteKey || !isLoaded || !window.grecaptcha) {
      if (onError) {
        onError(t('captchaNotConfigured') || 'CAPTCHA not configured');
      }
      return;
    }

    setIsVerifying(true);
    try {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action });
          onVerify(token);
        } catch (error: any) {
          console.error('CAPTCHA execution error:', error);
          if (onError) {
            onError(error.message || t('captchaError') || 'CAPTCHA verification failed');
          }
        } finally {
          setIsVerifying(false);
        }
      });
    } catch (error: any) {
      console.error('CAPTCHA error:', error);
      if (onError) {
        onError(error.message || t('captchaError') || 'CAPTCHA verification failed');
      }
      setIsVerifying(false);
    }
  };

  // Auto-execute CAPTCHA when component mounts and is ready
  useEffect(() => {
    if (isLoaded && siteKey && window.grecaptcha) {
      executeCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, siteKey]);

  return (
    <div className="captcha-container">
      <div ref={captchaRef} className="g-recaptcha" />
      {isVerifying && (
        <p className="text-xs text-muted-foreground mt-2">
          {t('verifyingCaptcha') || 'Verifying...'}
        </p>
      )}
    </div>
  );
};

// Hook to get CAPTCHA site key from admin settings
export const useCaptchaConfig = (formType?: 'login' | 'register' | 'contact') => {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const loadCaptchaConfig = async () => {
      try {
        // Load from localStorage first (set by admin)
        const stored = localStorage.getItem('captcha_config');
        if (stored) {
          const config = JSON.parse(stored);
          const baseEnabled = config.enabled || false;
          
          // Check if enabled for specific form type
          let formEnabled = baseEnabled;
          if (formType && baseEnabled) {
            if (formType === 'login') {
              formEnabled = config.enabledForLogin !== false;
            } else if (formType === 'register') {
              formEnabled = config.enabledForRegister !== false;
            } else if (formType === 'contact') {
              formEnabled = config.enabledForContact !== false;
            }
          }
          
          setSiteKey(config.siteKey || null);
          setIsEnabled(formEnabled);
          return;
        }

        // Fallback: try to load from Supabase admin_settings
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: settings } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value')
          .in('setting_key', [
            'captcha_site_key',
            'captcha_enabled',
            'captcha_enabled_login',
            'captcha_enabled_register',
            'captcha_enabled_contact'
          ]);

        if (settings) {
          const configMap: Record<string, string> = {};
          settings.forEach(item => {
            configMap[item.setting_key] = item.setting_value || '';
          });

          const baseEnabled = configMap['captcha_enabled'] === 'true';
          let formEnabled = baseEnabled;
          
          if (formType && baseEnabled) {
            if (formType === 'login') {
              formEnabled = configMap['captcha_enabled_login'] !== 'false';
            } else if (formType === 'register') {
              formEnabled = configMap['captcha_enabled_register'] !== 'false';
            } else if (formType === 'contact') {
              formEnabled = configMap['captcha_enabled_contact'] !== 'false';
            }
          }

          setSiteKey(configMap['captcha_site_key'] || null);
          setIsEnabled(formEnabled);
        }
      } catch (error) {
        console.error('Error loading CAPTCHA config:', error);
      }
    };

    loadCaptchaConfig();
  }, [formType]);

  return { siteKey, isEnabled };
};
