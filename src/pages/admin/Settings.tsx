import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw,
  Shield,
  Mail,
  Bell,
  Database,
  Globe,
  Lock,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: settings.siteName || "Aurora Society",
    siteDescription: settings.siteDescription || "Exclusive network for high-net-worth individuals",
    maintenanceMode: settings.maintenanceMode || false,
    allowRegistrations: settings.allowRegistrations ?? true,
    requireEmailVerification: settings.requireEmailVerification ?? true,
    defaultRole: settings.defaultRole || "member",
  });
  
  // Load settings on mount
  useEffect(() => {
    setGeneralSettings({
      siteName: settings.siteName || "Aurora Society",
      siteDescription: settings.siteDescription || "Exclusive network for high-net-worth individuals",
      maintenanceMode: settings.maintenanceMode || false,
      allowRegistrations: settings.allowRegistrations ?? true,
      requireEmailVerification: settings.requireEmailVerification ?? true,
      defaultRole: settings.defaultRole || "member",
    });
    setSecuritySettings({
      maxLoginAttempts: settings.maxLoginAttempts || 5,
      lockoutDuration: settings.lockoutDuration || 15,
      sessionTimeout: settings.sessionTimeout || 60,
      require2FA: settings.require2FA || false,
      passwordMinLength: settings.passwordMinLength || 8,
      passwordRequireUppercase: settings.passwordRequireUppercase ?? true,
      passwordRequireNumbers: settings.passwordRequireNumbers ?? true,
      passwordRequireSpecialChars: settings.passwordRequireSpecialChars ?? true,
    });
    setEmailSettings({
      smtpHost: settings.smtpHost || "",
      smtpPort: settings.smtpPort || 587,
      smtpUser: settings.smtpUser || "",
      smtpPassword: settings.smtpPassword || "",
      fromEmail: settings.fromEmail || "noreply@aurorasociety.ch",
      fromName: settings.fromName || "Aurora Society",
    });
    setNotificationSettings({
      emailOnNewUser: settings.emailOnNewUser ?? true,
      emailOnNewConnection: settings.emailOnNewConnection ?? true,
      emailOnNewMessage: settings.emailOnNewMessage ?? true,
      emailOnReport: settings.emailOnReport ?? true,
      emailOnError: settings.emailOnError ?? true,
    });
  }, [settings]);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: settings.maxLoginAttempts || 5,
    lockoutDuration: settings.lockoutDuration || 15, // minutes
    sessionTimeout: settings.sessionTimeout || 60, // minutes
    require2FA: settings.require2FA || false,
    passwordMinLength: settings.passwordMinLength || 8,
    passwordRequireUppercase: settings.passwordRequireUppercase ?? true,
    passwordRequireNumbers: settings.passwordRequireNumbers ?? true,
    passwordRequireSpecialChars: settings.passwordRequireSpecialChars ?? true,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: settings.smtpHost || "",
    smtpPort: settings.smtpPort || 587,
    smtpUser: settings.smtpUser || "",
    smtpPassword: settings.smtpPassword || "",
    fromEmail: settings.fromEmail || "noreply@aurorasociety.ch",
    fromName: settings.fromName || "Aurora Society",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewUser: settings.emailOnNewUser ?? true,
    emailOnNewConnection: settings.emailOnNewConnection ?? true,
    emailOnNewMessage: settings.emailOnNewMessage ?? true,
    emailOnReport: settings.emailOnReport ?? true,
    emailOnError: settings.emailOnError ?? true,
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maxReferralsPerUser: 2,
  });

  // Load system settings on mount
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value')
          .eq('key', 'max_referrals_per_user')
          .maybeSingle();

        if (!error && data) {
          const maxReferrals = parseInt(data.value, 10);
          if (!isNaN(maxReferrals) && maxReferrals > 0) {
            setSystemSettings({ maxReferralsPerUser: maxReferrals });
          }
        }
      } catch (error) {
        console.error('Error loading system settings:', error);
      }
    };
    loadSystemSettings();
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('error'));
        return;
      }

      // Sauvegarder chaque paramètre
      const updates = Object.entries(generalSettings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        category: 'general',
        updated_by: user.id,
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      await refreshSettings();
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      console.error('Error saving general settings:', error);
      toast.error(t('settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('error'));
        return;
      }

      const updates = Object.entries(securitySettings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        category: 'security',
        updated_by: user.id,
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      await refreshSettings();
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      console.error('Error saving security settings:', error);
      toast.error(t('settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('error'));
        return;
      }

      const updates = Object.entries(emailSettings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        category: 'email',
        updated_by: user.id,
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      await refreshSettings();
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      console.error('Error saving email settings:', error);
      toast.error(t('settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('error'));
        return;
      }

      const updates = Object.entries(notificationSettings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        category: 'notifications',
        updated_by: user.id,
      }));

      const { error } = await supabase
        .from('app_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      await refreshSettings();
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(t('settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('error'));
        return;
      }

      // Valider que la valeur est un nombre positif
      if (systemSettings.maxReferralsPerUser < 1) {
        toast.error(t('maxReferralsMustBePositive') || 'Le nombre maximum de filleuls doit être supérieur à 0');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'max_referrals_per_user',
          value: systemSettings.maxReferralsPerUser.toString(),
          description: 'Nombre maximum de filleuls qu\'un utilisateur peut parrainer avec son code de parrainage',
        }, { onConflict: 'key' });

      if (error) throw error;

      toast.success(t('settingsSaved') || 'Paramètres sauvegardés avec succès');
    } catch (error: any) {
      console.error('Error saving system settings:', error);
      toast.error(t('settingsSaveError') || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('adminSettings')}</h1>
            <p className="text-gold/60">{t('adminSettingsDescription')}</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="bg-[hsl(var(--navy-blue-light))] border border-gold/20">
            <TabsTrigger value="general" className="text-gold data-[state=active]:bg-gold/20">
              <SettingsIcon className="mr-2 h-4 w-4" />
              {t('general')}
            </TabsTrigger>
            <TabsTrigger value="security" className="text-gold data-[state=active]:bg-gold/20">
              <Shield className="mr-2 h-4 w-4" />
              {t('security')}
            </TabsTrigger>
            <TabsTrigger value="email" className="text-gold data-[state=active]:bg-gold/20">
              <Mail className="mr-2 h-4 w-4" />
              {t('email')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-gold data-[state=active]:bg-gold/20">
              <Bell className="mr-2 h-4 w-4" />
              {t('notifications')}
            </TabsTrigger>
            <TabsTrigger value="system" className="text-gold data-[state=active]:bg-gold/20">
              <Database className="mr-2 h-4 w-4" />
              {t('systemSettings') || 'Paramètres Système'}
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('generalSettings')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('generalSettingsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-gold">{t('siteName')}</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription" className="text-gold">{t('siteDescription')}</Label>
                  <Textarea
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('maintenanceMode')}</Label>
                    <p className="text-sm text-gold/60">{t('maintenanceModeDescription')}</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('allowRegistrations')}</Label>
                    <p className="text-sm text-gold/60">{t('allowRegistrationsDescription')}</p>
                  </div>
                  <Switch
                    checked={generalSettings.allowRegistrations}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, allowRegistrations: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('requireEmailVerification')}</Label>
                    <p className="text-sm text-gold/60">{t('requireEmailVerificationDescription')}</p>
                  </div>
                  <Switch
                    checked={generalSettings.requireEmailVerification}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, requireEmailVerification: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultRole" className="text-gold">{t('defaultRole')}</Label>
                  <Select
                    value={generalSettings.defaultRole}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, defaultRole: value })}
                  >
                    <SelectTrigger className="bg-black/50 border-gold/30 text-gold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="bg-gold text-black hover:bg-gold/80"
                >
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> :                   <Save className="mr-2 h-4 w-4" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('securitySettings')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('securitySettingsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts" className="text-gold">{t('maxLoginAttempts')}</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration" className="text-gold">{t('lockoutDuration')}</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: parseInt(e.target.value) })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout" className="text-gold">{t('sessionTimeout')}</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('require2FA')}</Label>
                    <p className="text-sm text-gold/60">{t('require2FADescription')}</p>
                  </div>
                  <Switch
                    checked={securitySettings.require2FA}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, require2FA: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength" className="text-gold">{t('passwordMinLength')}</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('passwordRequireUppercase')}</Label>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireUppercase}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireUppercase: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('passwordRequireNumbers')}</Label>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireNumbers}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireNumbers: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('passwordRequireSpecialChars')}</Label>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireSpecialChars}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireSpecialChars: checked })}
                  />
                </div>
                <Button
                  onClick={handleSaveSecurity}
                  disabled={saving}
                  className="bg-gold text-black hover:bg-gold/80"
                >
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> :                   <Save className="mr-2 h-4 w-4" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('emailSettings')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('emailSettingsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost" className="text-gold">{t('smtpHost')}</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                    className="bg-black/50 border-gold/30 text-gold"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort" className="text-gold">{t('smtpPort')}</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser" className="text-gold">{t('smtpUser')}</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword" className="text-gold">{t('smtpPassword')}</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail" className="text-gold">{t('fromEmail')}</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName" className="text-gold">{t('fromName')}</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                </div>
                <Button
                  onClick={handleSaveEmail}
                  disabled={saving}
                  className="bg-gold text-black hover:bg-gold/80"
                >
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> :                   <Save className="mr-2 h-4 w-4" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('notificationSettings')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('notificationSettingsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('emailOnNewUser')}</Label>
                    <p className="text-sm text-gold/60">{t('emailOnNewUserDescription')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailOnNewUser}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOnNewUser: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('emailOnNewConnection')}</Label>
                    <p className="text-sm text-gold/60">{t('emailOnNewConnectionDescription')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailOnNewConnection}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOnNewConnection: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('emailOnNewMessage')}</Label>
                    <p className="text-sm text-gold/60">{t('emailOnNewMessageDescription')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailOnNewMessage}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOnNewMessage: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('emailOnReport')}</Label>
                    <p className="text-sm text-gold/60">{t('emailOnReportDescription')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailOnReport}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOnReport: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gold">{t('emailOnError')}</Label>
                    <p className="text-sm text-gold/60">{t('emailOnErrorDescription')}</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailOnError}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOnError: checked })}
                  />
                </div>
                <Button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-gold text-black hover:bg-gold/80"
                >
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> :                   <Save className="mr-2 h-4 w-4" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('systemSettings') || 'Paramètres Système'}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('systemSettingsDescription') || 'Gérer les paramètres système de l\'application'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxReferralsPerUser" className="text-gold">
                    {t('maxReferralsPerUser') || 'Nombre maximum de filleuls par utilisateur'}
                  </Label>
                  <Input
                    id="maxReferralsPerUser"
                    type="number"
                    min="1"
                    value={systemSettings.maxReferralsPerUser}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value > 0) {
                        setSystemSettings({ maxReferralsPerUser: value });
                      }
                    }}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                  <p className="text-xs text-gold/60">
                    {t('maxReferralsPerUserDescription') || 'Définit le nombre maximum de personnes qu\'un utilisateur peut parrainer avec son code de parrainage. La valeur par défaut est 2.'}
                  </p>
                </div>
                <Button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="bg-gold text-black hover:bg-gold/80"
                >
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('systemSettings') || 'Paramètres Système'}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('systemSettingsDescription') || 'Gérer les paramètres système de l\'application'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxReferralsPerUser" className="text-gold">
                    {t('maxReferralsPerUser') || 'Nombre maximum de filleuls par utilisateur'}
                  </Label>
                  <Input
                    id="maxReferralsPerUser"
                    type="number"
                    min="1"
                    value={systemSettings.maxReferralsPerUser}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value > 0) {
                        setSystemSettings({ maxReferralsPerUser: value });
                      }
                    }}
                    className="bg-black/50 border-gold/30 text-gold"
                  />
                  <p className="text-xs text-gold/60">
                    {t('maxReferralsPerUserDescription') || 'Définit le nombre maximum de personnes qu\'un utilisateur peut parrainer avec son code de parrainage. La valeur par défaut est 2.'}
                  </p>
                </div>
                <Button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="bg-gold text-black hover:bg-gold/80"
                >
                  {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;

