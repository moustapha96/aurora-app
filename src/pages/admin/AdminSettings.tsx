import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Shield, Bell, Database, AlertTriangle, Save, Clock, FlaskConical, Mail, Eye, EyeOff, Send, CheckCircle, XCircle, Loader2, Lock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    emailVerificationRequired: false,
    maxReferralsPerUser: 10,
    maxInvitationCodesPerUser: 2,
    autoApproveContent: false,
    enableNotifications: true,
  });

  // Inactivity timeout state
  const [inactivityTimeout, setInactivityTimeout] = useState(10);
  const [savingTimeout, setSavingTimeout] = useState(false);
  
  // Test mode state
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [savingTestMode, setSavingTestMode] = useState(false);
  
  // Email config state
  const [emailMode, setEmailMode] = useState<'test' | 'production'>('test');
  const [emailProvider, setEmailProvider] = useState<'smtp' | 'resend'>('resend');
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    senderEmail: '',
    senderName: ''
  });
  const [savingEmailConfig, setSavingEmailConfig] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // CAPTCHA config state
  const [captchaConfig, setCaptchaConfig] = useState({
    siteKey: '',
    secretKey: '',
    enabled: false,
    enabledForLogin: true,
    enabledForRegister: true,
    enabledForContact: true,
  });
  const [savingCaptcha, setSavingCaptcha] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Stripe config state
  const [stripeMode, setStripeMode] = useState<'test' | 'production'>('test');
  const [stripeConfig, setStripeConfig] = useState({
    testSecretKey: '',
    liveSecretKey: '',
  });
  const [savingStripe, setSavingStripe] = useState(false);
  const [showStripeTestKey, setShowStripeTestKey] = useState(false);
  const [showStripeLiveKey, setShowStripeLiveKey] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [stripeTestResult, setStripeTestResult] = useState<{
    success: boolean;
    message: string;
    productsCount?: number;
    pricesCount?: number;
  } | null>(null);

  useEffect(() => {
    loadInactivityTimeout();
    loadTestMode();
    loadEmailConfig();
    loadCaptchaConfig();
    loadStripeConfig();
  }, []);

  const loadStripeConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'stripe_mode',
          'stripe_test_secret_key',
          'stripe_live_secret_key'
        ]);

      if (error) throw error;

      const configMap: Record<string, string> = {};
      data?.forEach(item => {
        configMap[item.setting_key] = item.setting_value || '';
      });

      setStripeMode((configMap['stripe_mode'] as 'test' | 'production') || 'test');
      setStripeConfig({
        testSecretKey: configMap['stripe_test_secret_key'] || '',
        liveSecretKey: configMap['stripe_live_secret_key'] || ''
      });
    } catch (error) {
      console.error('Error loading Stripe config:', error);
    }
  };

  const saveStripeConfig = async () => {
    setSavingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-stripe-config', {
        body: {
          stripe_mode: stripeMode,
          stripe_test_secret_key: stripeConfig.testSecretKey,
          stripe_live_secret_key: stripeConfig.liveSecretKey
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(t('adminStripeConfigSaved'));
    } catch (error: any) {
      console.error('Error saving Stripe config:', error);
      toast.error(error?.message || t('adminErrorSaving'));
    } finally {
      setSavingStripe(false);
    }
  };

  const testStripeConnection = async () => {
    setTestingStripe(true);
    setStripeTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-stripe-connection');
      
      if (error) throw error;
      
      if (data?.success) {
        setStripeTestResult({
          success: true,
          message: t('adminStripeConnectionSuccess'),
          productsCount: data.productsCount,
          pricesCount: data.pricesCount
        });
        toast.success(t('adminStripeConnectionSuccess'));
      } else {
        setStripeTestResult({
          success: false,
          message: data?.error || t('adminStripeConnectionFailed')
        });
        toast.error(data?.error || t('adminStripeConnectionFailed'));
      }
    } catch (error: any) {
      const errorMessage = error?.message || t('adminStripeConnectionFailed');
      setStripeTestResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setTestingStripe(false);
    }
  };

  const loadCaptchaConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'captcha_site_key',
          'captcha_secret_key',
          'captcha_enabled',
          'captcha_enabled_login',
          'captcha_enabled_register',
          'captcha_enabled_contact'
        ]);

      if (error) throw error;

      const configMap: Record<string, string> = {};
      data?.forEach(item => {
        configMap[item.setting_key] = item.setting_value;
      });

      setCaptchaConfig({
        siteKey: configMap['captcha_site_key'] || '',
        secretKey: configMap['captcha_secret_key'] || '',
        enabled: configMap['captcha_enabled'] === 'true',
        enabledForLogin: configMap['captcha_enabled_login'] !== 'false',
        enabledForRegister: configMap['captcha_enabled_register'] !== 'false',
        enabledForContact: configMap['captcha_enabled_contact'] !== 'false',
      });

      // Store in localStorage for quick access
      localStorage.setItem('captcha_config', JSON.stringify({
        siteKey: configMap['captcha_site_key'] || '',
        enabled: configMap['captcha_enabled'] === 'true',
        enabledForLogin: configMap['captcha_enabled_login'] !== 'false',
        enabledForRegister: configMap['captcha_enabled_register'] !== 'false',
        enabledForContact: configMap['captcha_enabled_contact'] !== 'false',
      }));
    } catch (error) {
      console.error('Error loading CAPTCHA config:', error);
    }
  };

  const saveCaptchaConfig = async () => {
    setSavingCaptcha(true);
    try {
      const settings = [
        { setting_key: 'captcha_site_key', setting_value: captchaConfig.siteKey, description: t('adminCaptchaSiteKeyDesc') },
        { setting_key: 'captcha_secret_key', setting_value: captchaConfig.secretKey, description: t('adminCaptchaSecretKeyDesc') },
        { setting_key: 'captcha_enabled', setting_value: captchaConfig.enabled.toString(), description: t('adminEnableCaptcha') },
        { setting_key: 'captcha_enabled_login', setting_value: captchaConfig.enabledForLogin.toString(), description: t('adminEnableCaptchaLogin') },
        { setting_key: 'captcha_enabled_register', setting_value: captchaConfig.enabledForRegister.toString(), description: t('adminEnableCaptchaRegister') },
        { setting_key: 'captcha_enabled_contact', setting_value: captchaConfig.enabledForContact.toString(), description: t('adminEnableCaptchaContact') },
      ];

      for (const setting of settings) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert(setting, { onConflict: 'setting_key' });
        if (error) throw error;
      }

      // Update localStorage
      localStorage.setItem('captcha_config', JSON.stringify({
        siteKey: captchaConfig.siteKey,
        enabled: captchaConfig.enabled,
        enabledForLogin: captchaConfig.enabledForLogin,
        enabledForRegister: captchaConfig.enabledForRegister,
        enabledForContact: captchaConfig.enabledForContact,
      }));

      toast.success(t('adminCaptchaConfigSaved'));
    } catch (error) {
      console.error('Error saving CAPTCHA config:', error);
      toast.error(t('adminErrorSavingCaptcha'));
    } finally {
      setSavingCaptcha(false);
    }
  };

  const loadInactivityTimeout = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'inactivity_timeout_minutes')
        .maybeSingle();

      if (!error && data?.setting_value) {
        const minutes = parseInt(data.setting_value, 10);
        if (!isNaN(minutes) && minutes > 0) {
          setInactivityTimeout(minutes);
        }
      }
    } catch (error) {
      console.error('Error loading inactivity timeout:', error);
    }
  };

  const loadTestMode = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'test_mode_enabled')
        .maybeSingle();

      if (!error && data?.setting_value) {
        setTestModeEnabled(data.setting_value === 'true');
      }
    } catch (error) {
      console.error('Error loading test mode:', error);
    }
  };

  const saveTestMode = async (enabled: boolean) => {
    setSavingTestMode(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'test_mode_enabled',
          setting_value: enabled.toString(),
          description: t('adminTestModeDescription')
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      setTestModeEnabled(enabled);
      toast.success(enabled ? t('adminTestModeEnabled') : t('adminTestModeDisabled'));
    } catch (error) {
      console.error('Error saving test mode:', error);
      toast.error(t('adminErrorSavingTestMode'));
    } finally {
      setSavingTestMode(false);
    }
  };

  const loadEmailConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'email_mode',
          'email_provider',
          'smtp_host',
          'smtp_port',
          'smtp_user',
          'smtp_password',
          'sender_email',
          'sender_name'
        ]);

      if (!error && data) {
        const configMap = data.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {} as Record<string, string | null>);
        
        setEmailMode((configMap['email_mode'] as 'test' | 'production') || 'test');
        setEmailProvider((configMap['email_provider'] as 'smtp' | 'resend') || 'resend');
        setEmailConfig({
          smtpHost: configMap['smtp_host'] || '',
          smtpPort: configMap['smtp_port'] || '587',
          smtpUser: configMap['smtp_user'] || '',
          smtpPassword: configMap['smtp_password'] || '',
          senderEmail: configMap['sender_email'] || '',
          senderName: configMap['sender_name'] || ''
        });
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  const saveEmailConfig = async () => {
    setSavingEmailConfig(true);
    try {
      // Use the Edge function to update SMTP config
      const { data, error } = await supabase.functions.invoke('update-smtp-config', {
        body: {
          email_mode: emailMode,
          email_provider: emailProvider,
          smtp_host: emailConfig.smtpHost,
          smtp_port: emailConfig.smtpPort,
          smtp_user: emailConfig.smtpUser,
          smtp_password: emailConfig.smtpPassword,
          sender_email: emailConfig.senderEmail,
          sender_name: emailConfig.senderName
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(t('adminEmailConfigSaved'));
    } catch (error: any) {
      console.error('Error saving email config:', error);
      toast.error(error?.message || t('adminErrorSaving'));
    } finally {
      setSavingEmailConfig(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error(t('adminEnterEmailAddress'));
      return;
    }

    setTestingEmail(true);
    setTestEmailResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { recipientEmail: testEmailAddress }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setTestEmailResult({ success: true, message: data.message || t('adminEmailSentSuccess') });
        toast.success(t('adminTestEmailSent'));
      } else {
        throw new Error(data?.error || t('adminUnknownError'));
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      const errorMessage = error.message || t('adminErrorSending');
      setTestEmailResult({ success: false, message: errorMessage });
      toast.error(`${t('adminSendFailed')}: ${errorMessage}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const saveInactivityTimeout = async () => {
    setSavingTimeout(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'inactivity_timeout_minutes',
          setting_value: inactivityTimeout.toString(),
          description: t('adminInactivityTimeoutDesc')
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      toast.success(t('adminInactivityTimeoutUpdated') + ': ' + inactivityTimeout + ' ' + (t('minutes') || 'minutes'));
    } catch (error) {
      console.error('Error saving inactivity timeout:', error);
      toast.error(t('adminErrorSavingTimeout'));
    } finally {
      setSavingTimeout(false);
    }
  };


  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    toast.success(t('adminSettingsSaved'));
  };


  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('adminSettingsTitle')}</h1>
            <p className="text-muted-foreground">{t('adminSettingsDescription')}</p>
          </div>
          <Button onClick={saveSettings} className="h-9 sm:h-10 px-2 sm:px-4">
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('adminSaveSettings')}</span>
          </Button>
        </div>

        <div className="grid gap-6">

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('generalSettings')}
              </CardTitle>
              <CardDescription>{t('adminSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registration">{t('allowRegistrations')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('allowRegistrations')}
                  </p>
                </div>
                <Switch
                  id="registration"
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => updateSetting('allowRegistration', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailVerification">{t('adminEmailVerificationRequired')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminEmailVerificationRequiredDesc')}
                  </p>
                </div>
                <Switch
                  id="emailVerification"
                  checked={settings.emailVerificationRequired}
                  onCheckedChange={(checked) => updateSetting('emailVerificationRequired', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maxReferrals">{t('adminMaxReferralsPerUser')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminMaxReferralsPerUserDesc')}
                  </p>
                </div>
                <Input
                  id="maxReferrals"
                  type="number"
                  value={settings.maxReferralsPerUser}
                  onChange={(e) => updateSetting('maxReferralsPerUser', parseInt(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maxInvitationCodes">{t('adminMaxInvitationCodesPerUser') || 'Codes d\'invitation par membre'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminMaxInvitationCodesPerUserDesc') || 'Nombre maximum de codes d\'invitation à usage unique par membre'}
                  </p>
                </div>
                <Input
                  id="maxInvitationCodes"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxInvitationCodesPerUser}
                  onChange={(e) => updateSetting('maxInvitationCodesPerUser', parseInt(e.target.value) || 2)}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Session & Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('adminSessionManagement')}
              </CardTitle>
              <CardDescription>{t('adminAutoLogoutConfig')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inactivityTimeout">{t('adminInactivityTimeout')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminInactivityTimeoutDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    id="inactivityTimeout"
                    type="number"
                    min="1"
                    max="120"
                    value={inactivityTimeout}
                    onChange={(e) => setInactivityTimeout(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-20"
                  />
                  <Button 
                    size="sm" 
                    onClick={saveInactivityTimeout}
                    disabled={savingTimeout}
                  >
                    {savingTimeout ? t('saving') : t('apply')}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('adminInactivityTimeoutWarning').replace('{minutes}', inactivityTimeout.toString())}
              </p>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card className={emailMode === 'production' ? 'border-green-500' : 'border-blue-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className={`h-5 w-5 ${emailMode === 'production' ? 'text-green-500' : 'text-blue-500'}`} />
                {t('adminEmailServerConfig')}
              </CardTitle>
              <CardDescription>
                {t('adminEmailServerConfigDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('adminEmailSendMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {emailMode === 'test' 
                      ? t('adminEmailModeTestDesc')
                      : t('adminEmailModeProductionDesc')
                    }
                  </p>
                </div>
                <Select value={emailMode} onValueChange={(value: 'test' | 'production') => setEmailMode(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">{t('adminTestMode')}</SelectItem>
                    <SelectItem value="production">{t('adminProductionMode')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {emailMode === 'test' && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                  <p className="text-sm text-blue-500 font-medium">
                    📧 {t('adminInfomaniakServerTest')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('adminInfomaniakServerDesc')}
                  </p>
                </div>
              )}

              {emailMode === 'production' && (
                <>
                  <Separator />
                  
                  {/* Email Provider Selection */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('adminEmailProvider')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {emailProvider === 'resend' 
                          ? t('adminEmailProviderResendDesc')
                          : t('adminEmailProviderSmtpDesc')
                        }
                      </p>
                    </div>
                    <Select value={emailProvider} onValueChange={(value: 'smtp' | 'resend') => setEmailProvider(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resend">
                          <span className="flex items-center gap-2">
                            <span className="text-purple-500">⚡</span> Resend (API)
                          </span>
                        </SelectItem>
                        <SelectItem value="smtp">
                          <span className="flex items-center gap-2">
                            <span className="text-blue-500">📧</span> {t('adminSmtpServer')}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {emailProvider === 'resend' && (
                    <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                      <p className="text-sm text-purple-500 font-medium">
                        ⚡ {t('adminResendProvider')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('adminResendProviderDesc')}
                      </p>
                    </div>
                  )}

                  {emailProvider === 'smtp' && (
                    <>
                      <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                        <p className="text-sm text-green-500 font-medium">
                          🚀 {t('adminProductionModeCustomServer')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('adminProductionModeCustomServerDesc')}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtpHost">{t('adminSmtpServer')}</Label>
                          <Input
                            id="smtpHost"
                            placeholder={t('adminSmtpServerPlaceholder')}
                            value={emailConfig.smtpHost}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpPort">{t('adminPort')}</Label>
                          <Input
                            id="smtpPort"
                            placeholder="587"
                            value={emailConfig.smtpPort}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground">{t('adminSmtpPortHelp')}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpUser">{t('adminSmtpUser')}</Label>
                          <Input
                            id="smtpUser"
                            placeholder={t('adminSmtpUserPlaceholder')}
                            value={emailConfig.smtpUser}
                            onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpPassword">{t('adminSmtpPassword')}</Label>
                          <div className="relative">
                            <Input
                              id="smtpPassword"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={emailConfig.smtpPassword}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Sender info (common to both providers) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="senderEmail">{t('adminSenderEmail')}</Label>
                      <Input
                        id="senderEmail"
                        placeholder={t('adminSenderEmailPlaceholder')}
                        value={emailConfig.senderEmail}
                        onChange={(e) => setEmailConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      />
                      {emailProvider === 'resend' && (
                        <p className="text-xs text-muted-foreground">{t('adminResendDomainHint')}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senderName">{t('adminSenderName')}</Label>
                      <Input
                        id="senderName"
                        placeholder={t('adminSenderNamePlaceholder')}
                        value={emailConfig.senderName}
                        onChange={(e) => setEmailConfig(prev => ({ ...prev, senderName: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <Label>{t('adminTestConfiguration')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminTestConfigurationDesc')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder={t('adminTestEmailPlaceholder')}
                    value={testEmailAddress}
                    onChange={(e) => {
                      setTestEmailAddress(e.target.value);
                      setTestEmailResult(null);
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendTestEmail}
                    disabled={testingEmail || !testEmailAddress}
                    variant="outline"
                  >
                    {testingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('adminSendTest')}</span>
                      </>
                    )}
                  </Button>
                </div>
                {testEmailResult && (
                  <div className={`rounded-lg p-3 flex items-start gap-2 ${
                    testEmailResult.success 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    {testEmailResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${testEmailResult.success ? 'text-green-500' : 'text-red-500'}`}>
                      {testEmailResult.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={saveEmailConfig}
                  disabled={savingEmailConfig}
                >
                  {savingEmailConfig ? t('saving') : t('adminSaveEmailConfig')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Mode Settings */}
          <Card className={testModeEnabled ? 'border-purple-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className={`h-5 w-5 ${testModeEnabled ? 'text-purple-500' : ''}`} />
                {t('adminTestMode')}
              </CardTitle>
              <CardDescription>{t('adminTestModeConfigDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="testMode" className={testModeEnabled ? 'text-purple-500 font-medium' : ''}>
                    {testModeEnabled ? t('adminTestModeEnabled') : t('adminTestModeDisabled')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {testModeEnabled 
                      ? t('adminTestModeEnabledDesc')
                      : t('adminTestModeDisabledDesc')
                    }
                  </p>
                </div>
                <Switch
                  id="testMode"
                  checked={testModeEnabled}
                  onCheckedChange={(checked) => saveTestMode(checked)}
                  disabled={savingTestMode}
                />
              </div>
              {testModeEnabled && (
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                  <p className="text-sm text-purple-500 font-medium">
                    ⚠️ {t('adminTestModeActive')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('adminTestModeActiveDesc')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('security')}
              </CardTitle>
              <CardDescription>{t('adminSecurityModerationSettings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoApprove">{t('adminAutoApproveContent')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminAutoApproveContentDesc')}
                  </p>
                </div>
                <Switch
                  id="autoApprove"
                  checked={settings.autoApproveContent}
                  onCheckedChange={(checked) => updateSetting('autoApproveContent', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notifications')}
              </CardTitle>
              <CardDescription>{t('adminSystemNotificationsConfig')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">{t('adminEnableNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminEnableNotificationsDesc')}
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode */}
          <Card className={settings.maintenanceMode ? 'border-orange-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${settings.maintenanceMode ? 'text-orange-500' : ''}`} />
                {t('adminMaintenanceMode')}
              </CardTitle>
              <CardDescription>{t('adminMaintenanceModeDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance" className={settings.maintenanceMode ? 'text-orange-500 font-medium' : ''}>
                    {settings.maintenanceMode ? t('adminMaintenanceModeEnabled') : t('adminMaintenanceModeDisabled')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.maintenanceMode 
                      ? t('adminMaintenanceModeEnabledDesc')
                      : t('adminMaintenanceModeDisabledDesc')
                    }
                  </p>
                </div>
                <Switch
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stripe Configuration */}
          <Card className={stripeMode === 'production' ? 'border-green-500/50' : 'border-orange-500/50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className={`h-5 w-5 ${stripeMode === 'production' ? 'text-green-500' : 'text-orange-500'}`} />
                {t('adminStripeConfiguration')}
                {stripeMode === 'test' && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs rounded-full flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" />
                    {t('adminStripeTestMode')}
                  </span>
                )}
                {stripeMode === 'production' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded-full">
                    {t('adminStripeProductionMode')}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {t('adminStripeConfigurationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Selection */}
              <div className="space-y-2">
                <Label>{t('adminStripeMode')}</Label>
                <Select value={stripeMode} onValueChange={(v: 'test' | 'production') => setStripeMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-orange-500" />
                        {t('adminStripeTestMode')}
                      </div>
                    </SelectItem>
                    <SelectItem value="production">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        {t('adminStripeProductionMode')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {stripeMode === 'test' ? t('adminStripeModeTestDesc') : t('adminStripeModeProductionDesc')}
                </p>
              </div>

              <Separator />

              {/* Test Mode Keys */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-orange-500" />
                  <Label className="text-orange-500 font-medium">{t('adminStripeTestKeys')}</Label>
                </div>
                
                <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-4">
                  <p className="text-sm text-orange-500 font-medium">
                    🧪 {t('adminStripeTestInfo')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('adminStripeTestInfoDesc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-test-secret-key">{t('adminStripeSecretKey')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stripe-test-secret-key"
                      type={showStripeTestKey ? 'text' : 'password'}
                      placeholder="sk_test_..."
                      value={stripeConfig.testSecretKey}
                      onChange={(e) => setStripeConfig(prev => ({ ...prev, testSecretKey: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowStripeTestKey(!showStripeTestKey)}
                    >
                      {showStripeTestKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

              </div>

              <Separator />

              {/* Production Mode Keys */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <Label className="text-green-500 font-medium">{t('adminStripeLiveKeys')}</Label>
                </div>
                
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <p className="text-sm text-green-500 font-medium">
                    💳 {t('adminStripeLiveInfo')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('adminStripeLiveInfoDesc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-live-secret-key">{t('adminStripeSecretKey')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stripe-live-secret-key"
                      type={showStripeLiveKey ? 'text' : 'password'}
                      placeholder="sk_live_..."
                      value={stripeConfig.liveSecretKey}
                      onChange={(e) => setStripeConfig(prev => ({ ...prev, liveSecretKey: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowStripeLiveKey(!showStripeLiveKey)}
                    >
                      {showStripeLiveKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Test Connection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{t('adminStripeTestConnection')}</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('adminStripeTestConnectionDesc')}
                    </p>
                  </div>
                  <Button
                    onClick={testStripeConnection}
                    disabled={testingStripe}
                    variant="outline"
                  >
                    {testingStripe ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('testing')}
                      </>
                    ) : (
                      <>
                        <FlaskConical className="h-4 w-4 mr-2" />
                        {t('adminStripeTestButton')}
                      </>
                    )}
                  </Button>
                </div>

                {stripeTestResult && (
                  <div className={`p-4 rounded-lg flex items-start gap-3 ${stripeTestResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    {stripeTestResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${stripeTestResult.success ? 'text-green-500' : 'text-red-500'}`}>
                        {stripeTestResult.message}
                      </p>
                      {stripeTestResult.success && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('adminStripeProductsFound')}: {stripeTestResult.productsCount} | {t('adminStripePricesFound')}: {stripeTestResult.pricesCount}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={saveStripeConfig}
                  disabled={savingStripe}
                >
                  {savingStripe ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('adminSaveStripeConfig')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CAPTCHA Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('adminCaptchaConfiguration')}
              </CardTitle>
              <CardDescription>
                {t('adminCaptchaConfigurationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="captcha-enabled">{t('adminEnableCaptcha')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminEnableCaptchaDesc')}
                  </p>
                </div>
                <Switch
                  id="captcha-enabled"
                  checked={captchaConfig.enabled}
                  onCheckedChange={(checked) => setCaptchaConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {captchaConfig.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="captcha-site-key">{t('adminCaptchaSiteKey')}</Label>
                      <Input
                        id="captcha-site-key"
                        type="text"
                        placeholder="6Lc..."
                        value={captchaConfig.siteKey}
                        onChange={(e) => setCaptchaConfig(prev => ({ ...prev, siteKey: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('adminGetCaptchaKey')}{' '}
                        <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          Google reCAPTCHA
                        </a>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="captcha-secret-key">{t('adminCaptchaSecretKey')}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="captcha-secret-key"
                          type={showSecretKey ? "text" : "password"}
                          placeholder="6Lc..."
                          value={captchaConfig.secretKey}
                          onChange={(e) => setCaptchaConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        >
                          {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('adminCaptchaSecretKeyDesc')}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label>{t('adminEnableCaptchaOn')}</Label>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="captcha-login" className="font-normal">{t('adminLoginPage')}</Label>
                        <Switch
                          id="captcha-login"
                          checked={captchaConfig.enabledForLogin}
                          onCheckedChange={(checked) => setCaptchaConfig(prev => ({ ...prev, enabledForLogin: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="captcha-register" className="font-normal">{t('adminRegisterPage')}</Label>
                        <Switch
                          id="captcha-register"
                          checked={captchaConfig.enabledForRegister}
                          onCheckedChange={(checked) => setCaptchaConfig(prev => ({ ...prev, enabledForRegister: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="captcha-contact" className="font-normal">{t('adminContactPage')}</Label>
                        <Switch
                          id="captcha-contact"
                          checked={captchaConfig.enabledForContact}
                          onCheckedChange={(checked) => setCaptchaConfig(prev => ({ ...prev, enabledForContact: checked }))}
                        />
                      </div>
                    </div>

                    <Separator />

                    <Button 
                      onClick={saveCaptchaConfig} 
                      disabled={savingCaptcha || !captchaConfig.siteKey || !captchaConfig.secretKey}
                      className="w-full"
                    >
                      {savingCaptcha ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t('adminSaveCaptchaConfig')}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Database Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t('adminDatabase')}
              </CardTitle>
              <CardDescription>{t('adminDatabaseInfo')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('adminProvider')}</p>
                  <p className="font-medium text-foreground">Supabase</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('adminRegion')}</p>
                  <p className="font-medium text-foreground">EU (Paris)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">{t('adminStatus')}</p>
                  <p className="font-medium text-green-500">{t('adminConnected')}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">RLS</p>
                  <p className="font-medium text-green-500">{t('adminEnabled')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
