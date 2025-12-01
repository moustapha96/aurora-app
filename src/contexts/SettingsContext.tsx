import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  // General
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  defaultRole: 'member' | 'admin';
  
  // Security
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  require2FA: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  
  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  
  // Notifications
  emailOnNewUser: boolean;
  emailOnNewConnection: boolean;
  emailOnNewMessage: boolean;
  emailOnReport: boolean;
  emailOnError: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  siteName: 'Aurora Society',
  siteDescription: 'Une plateforme sociale exclusive dédiée à l\'élite mondiale. Réseau, conciergerie de luxe, étiquette et voyages d\'exception.',
  maintenanceMode: false,
  allowRegistrations: true,
  requireEmailVerification: true,
  defaultRole: 'member',
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  sessionTimeout: 60,
  require2FA: false,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  fromEmail: 'noreply@aurorasociety.ch',
  fromName: 'Aurora Society',
  emailOnNewUser: true,
  emailOnNewConnection: true,
  emailOnNewMessage: true,
  emailOnReport: true,
  emailOnError: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        const loadedSettings: Partial<AppSettings> = { ...defaultSettings };
        
        data.forEach((item) => {
          const key = item.key as keyof AppSettings;
          const value = item.value;
          
          // Parse JSONB values
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              loadedSettings[key] = parsed;
            } catch {
              loadedSettings[key] = value as any;
            }
          } else {
            loadedSettings[key] = value as any;
          }
        });

        setSettings(loadedSettings as AppSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
    
    // Subscribe to changes
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
        },
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

