import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '@/contexts/LanguageContext';

const NotificationSettings = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    isSupported,
    isInitialized,
    permissions,
    requestPermissions,
    showNotification,
  } = useNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [connectionNotifs, setConnectionNotifs] = useState(true);
  const [eventNotifs, setEventNotifs] = useState(true);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setNotificationsEnabled(prefs.enabled ?? false);
      setMessageNotifs(prefs.messages ?? true);
      setConnectionNotifs(prefs.connections ?? true);
      setEventNotifs(prefs.events ?? true);
    }

    // Check if permissions are already granted
    if (permissions.push || permissions.local) {
      setNotificationsEnabled(true);
    }
  }, [permissions]);

  const savePreferences = (prefs: {
    enabled: boolean;
    messages: boolean;
    connections: boolean;
    events: boolean;
  }) => {
    localStorage.setItem('notification_preferences', JSON.stringify(prefs));
  };

  const handleEnableNotifications = async () => {
    const result = await requestPermissions();
    
    if (result.push || result.local) {
      setNotificationsEnabled(true);
      savePreferences({
        enabled: true,
        messages: messageNotifs,
        connections: connectionNotifs,
        events: eventNotifs,
      });
      
      toast({
        title: t('notificationsEnabled'),
        description: t('notificationsEnabledDescription'),
      });
    } else {
      toast({
        title: t('permissionDenied'),
        description: t('permissionDeniedDescription'),
        variant: 'destructive',
      });
    }
  };

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false);
    savePreferences({
      enabled: false,
      messages: messageNotifs,
      connections: connectionNotifs,
      events: eventNotifs,
    });
    
    toast({
      title: t('notificationsDisabled'),
      description: t('notificationsDisabledDescription'),
    });
  };

  const handleTestNotification = async () => {
    await showNotification({
      title: t('testNotificationTitle'),
      body: t('testNotificationBody'),
      data: { type: 'test' },
    });
    
    toast({
      title: t('notificationSent'),
      description: t('notificationSentDescription'),
    });
  };

  const handleTogglePreference = (
    type: 'messages' | 'connections' | 'events',
    value: boolean
  ) => {
    switch (type) {
      case 'messages':
        setMessageNotifs(value);
        break;
      case 'connections':
        setConnectionNotifs(value);
        break;
      case 'events':
        setEventNotifs(value);
        break;
    }

    savePreferences({
      enabled: notificationsEnabled,
      messages: type === 'messages' ? value : messageNotifs,
      connections: type === 'connections' ? value : connectionNotifs,
      events: type === 'events' ? value : eventNotifs,
    });
  };

  if (!isNative) {
    return (
      <Card className="bg-card-surface border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gold">
            <Bell className="h-5 w-5" />
            {t('pushNotifications')}
          </CardTitle>
          <CardDescription>
            {t('pushNotificationsMobileOnly')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <Smartphone className="h-8 w-8 text-gold/60" />
            <div>
              <p className="text-sm font-medium">{t('downloadMobileApp')}</p>
              <p className="text-xs text-muted-foreground">
                {t('receivePushNotificationsRealTime')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-surface border-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold">
          <Bell className="h-5 w-5" />
          {t('pushNotifications')}
        </CardTitle>
        <CardDescription>
          {t('manageNotificationPreferences')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            {notificationsEnabled ? (
              <Bell className="h-5 w-5 text-gold" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">{t('notifications')}</p>
              <p className="text-xs text-muted-foreground">
                {notificationsEnabled ? t('enabled') : t('disabled')}
              </p>
            </div>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEnableNotifications();
              } else {
                handleDisableNotifications();
              }
            }}
          />
        </div>

        {/* Permission status */}
        <div className="flex items-center gap-2 text-sm">
          {permissions.push || permissions.local ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">{t('permissionsGranted')}</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-red-500" />
              <span className="text-muted-foreground">{t('permissionsNotGranted')}</span>
            </>
          )}
        </div>

        {/* Notification preferences */}
        {notificationsEnabled && (
          <div className="space-y-4 pt-4 border-t border-gold/10">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('notificationTypes')}
            </h4>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('messages')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('newMessagesReceived')}
                </p>
              </div>
              <Switch
                checked={messageNotifs}
                onCheckedChange={(value) => handleTogglePreference('messages', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('connections')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('requestsAndAcceptances')}
                </p>
              </div>
              <Switch
                checked={connectionNotifs}
                onCheckedChange={(value) => handleTogglePreference('connections', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('events')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('remindersAndInvitations')}
                </p>
              </div>
              <Switch
                checked={eventNotifs}
                onCheckedChange={(value) => handleTogglePreference('events', value)}
              />
            </div>
          </div>
        )}

        {/* Test button */}
        {notificationsEnabled && isInitialized && (
          <Button
            variant="outline"
            className="w-full border-gold/30 hover:bg-gold/10"
            onClick={handleTestNotification}
          >
            {t('testNotifications')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
