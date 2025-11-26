import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard,
  LogOut,
  Trash2,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { validatePassword, getPasswordRequirements } from "@/lib/passwordValidator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobilePhone: "",
    username: "",
  });

  // Security settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [sessions, setSessions] = useState<any[]>([]);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    connectionRequests: true,
    marketingEmails: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: "members" as "public" | "members" | "private",
    showEmail: false,
    showPhone: false,
    allowSearch: true,
    biometricEnabled: false,
  });

  // Subscription settings
  const [subscription, setSubscription] = useState({
    level: "Gold" as "Gold" | "Platinum" | "Diamond",
    status: "active" as "active" | "expired" | "cancelled",
    renewalDate: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        toast.error(t('error'));
        navigate("/login");
        return;
      }

      setUser(currentUser);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast.error(t('error'));
      } else if (profileData) {
        setProfile(profileData);
        setProfileData({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: currentUser.email || "",
          mobilePhone: profileData.mobile_phone || "",
          username: profileData.username || "",
        });
        setPrivacy({
          ...privacy,
          biometricEnabled: profileData.biometric_enabled || false,
        });
      }

      // Load sessions (we'll use auth metadata for now)
      // In a real app, you'd track sessions in a separate table
      setSessions([{
        id: 'current',
        device: navigator.userAgent,
        location: 'Current session',
        lastActive: new Date().toISOString(),
        current: true,
      }]);

    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          mobile_phone: profileData.mobilePhone,
          username: profileData.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success(t('success'));
      loadUserData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error(t('error'));
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(passwordData.newPassword);
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.errors[0] || t('error'));
        return;
      }

      setSaving(true);

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success(t('success'));
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      setSaving(true);
      // In a real app, save notification preferences to database
      // For now, we'll just save to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(notifications));
      toast.success(t('success'));
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePrivacy = async () => {
    try {
      setSaving(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          biometric_enabled: privacy.biometricEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Save other privacy settings to localStorage or a separate table
      localStorage.setItem('privacySettings', JSON.stringify(privacy));
      
      toast.success(t('success'));
    } catch (error: any) {
      console.error('Error updating privacy:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(t('success'));
      navigate("/login");
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error(t('error'));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Delete user account (this will cascade delete profile due to foreign key)
      const { error } = await supabase.auth.admin.deleteUser(currentUser.id);
      
      if (error) {
        // If admin API is not available, we can't delete the account directly
        // In production, this should be handled by an Edge Function
        toast.error(t('error'));
        return;
      }

      toast.success(t('success'));
      navigate("/");
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(t('error'));
    }
  };

  const handleExportData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Export all user data
      const exportData = {
        profile,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          createdAt: currentUser.created_at,
        },
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aurora-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('success'));
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error(t('error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gold hover:bg-gold/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-serif text-gold">{t('settings')}</h1>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-black/40 border border-gold/20">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gold/20">
              <User className="w-4 h-4 mr-2" />
              {t('profile')}
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gold/20">
              <Lock className="w-4 h-4 mr-2" />
              {t('security')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gold/20">
              <Bell className="w-4 h-4 mr-2" />
              {t('notifications')}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-gold/20">
              <Shield className="w-4 h-4 mr-2" />
              {t('privacy')}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-gold/20">
              <CreditCard className="w-4 h-4 mr-2" />
              {t('subscription')}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('profileInformation')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('managePersonalInfo')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20 border-2 border-gold/30">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-gold/20 text-gold">
                      {profileData.firstName[0]}{profileData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/edit-profile")}
                      className="text-gold border-gold/30 hover:bg-gold/10"
                    >
                      {t('editAvatar')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gold/80">
                      {t('firstName')}
                    </Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="bg-black border-gold/30 text-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gold/80">
                      {t('lastName')}
                    </Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="bg-black border-gold/30 text-gold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gold/80">
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-black/50 border-gold/30 text-gold/60"
                  />
                  <p className="text-xs text-gold/40">{t('emailCannotBeChanged')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobilePhone" className="text-gold/80">
                    {t('mobilePhone')}
                  </Label>
                  <Input
                    id="mobilePhone"
                    value={profileData.mobilePhone}
                    onChange={(e) => setProfileData({ ...profileData, mobilePhone: e.target.value })}
                    className="bg-black border-gold/30 text-gold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gold/80">
                    {t('username')}
                  </Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="bg-black border-gold/30 text-gold"
                  />
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                >
                  {saving ? t('saving') : t('saveChanges')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6 space-y-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('changePassword')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('useStrongPassword')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gold/80">
                    {t('currentPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="bg-black border-gold/30 text-gold pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-gold/60 hover:text-gold"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gold/80">
                    {t('newPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="bg-black border-gold/30 text-gold pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-gold/60 hover:text-gold"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="text-xs text-gold/60 space-y-1">
                    <p className="font-medium">{t('requirements')}</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      {getPasswordRequirements().map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gold/80">
                    {t('confirmNewPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-black border-gold/30 text-gold pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full text-gold/60 hover:text-gold"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                >
                  {saving ? t('changing') : t('changePassword')}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('activeSessions')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('manageActiveSessions')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-black/20 border border-gold/10 rounded-lg"
                    >
                      <div>
                        <p className="text-gold font-medium">{session.location}</p>
                        <p className="text-gold/60 text-sm">{session.device}</p>
                        <p className="text-gold/40 text-xs">
                          {t('lastActivity')} {new Date(session.lastActive).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ru' ? 'ru-RU' : language)}
                        </p>
                      </div>
                      {session.current && (
                        <span className="text-xs text-gold/60 bg-gold/10 px-2 py-1 rounded">
                          {t('currentSession')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-gold/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400">{t('dangerousZone')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gold font-medium">{t('logout')}</p>
                    <p className="text-gold/60 text-sm">{t('logoutDescription')}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-gold border-gold/30 hover:bg-gold/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logout')}
                  </Button>
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-400 font-medium">{t('deleteAccount')}</p>
                    <p className="text-gold/60 text-sm">{t('deleteAccountDescription')}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('delete')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-black border-gold/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-400">
                          {t('deleteAccount')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gold/60">
                          {t('deleteAccountConfirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="text-gold border-gold/30">
                          {t('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {t('deletePermanently')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('notificationPreferences')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('manageNotifications')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('emailNotifications')}</Label>
                    <p className="text-gold/60 text-sm">{t('receiveEmailNotifications')}</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('pushNotifications')}</Label>
                    <p className="text-gold/60 text-sm">{t('receivePushNotifications')}</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, pushNotifications: checked })
                    }
                  />
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('messageNotifications')}</Label>
                    <p className="text-gold/60 text-sm">{t('notifiedNewMessages')}</p>
                  </div>
                  <Switch
                    checked={notifications.messageNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, messageNotifications: checked })
                    }
                  />
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('connectionRequests')}</Label>
                    <p className="text-gold/60 text-sm">{t('notifiedConnectionRequests')}</p>
                  </div>
                  <Switch
                    checked={notifications.connectionRequests}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, connectionRequests: checked })
                    }
                  />
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('marketingEmails')}</Label>
                    <p className="text-gold/60 text-sm">{t('receiveMarketingEmails')}</p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, marketingEmails: checked })
                    }
                  />
                </div>

                <Button
                  onClick={handleUpdateNotifications}
                  disabled={saving}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                >
                  {saving ? t('saving') : t('savePreferences')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="mt-6 space-y-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('privacySettings')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('controlInformationVisibility')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gold font-medium">{t('profileVisibility')}</Label>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) =>
                      setPrivacy({
                        ...privacy,
                        profileVisibility: e.target.value as "public" | "members" | "private",
                      })
                    }
                    className="w-full bg-black border border-gold/30 text-gold rounded-md px-3 py-2"
                  >
                    <option value="public">{t('public')}</option>
                    <option value="members">{t('membersOnly')}</option>
                    <option value="private">{t('private')}</option>
                  </select>
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('showEmail')}</Label>
                    <p className="text-gold/60 text-sm">{t('allowMembersSeeEmail')}</p>
                  </div>
                  <Switch
                    checked={privacy.showEmail}
                    onCheckedChange={(checked) =>
                      setPrivacy({ ...privacy, showEmail: checked })
                    }
                  />
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('showPhone')}</Label>
                    <p className="text-gold/60 text-sm">{t('allowMembersSeePhone')}</p>
                  </div>
                  <Switch
                    checked={privacy.showPhone}
                    onCheckedChange={(checked) =>
                      setPrivacy({ ...privacy, showPhone: checked })
                    }
                  />
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('allowSearch')}</Label>
                    <p className="text-gold/60 text-sm">{t('allowOthersFindYou')}</p>
                  </div>
                  <Switch
                    checked={privacy.allowSearch}
                    onCheckedChange={(checked) =>
                      setPrivacy({ ...privacy, allowSearch: checked })
                    }
                  />
                </div>

                <Separator className="bg-gold/20" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gold font-medium">{t('biometricAuth')}</Label>
                    <p className="text-gold/60 text-sm">{t('useBiometricAuth')}</p>
                  </div>
                  <Switch
                    checked={privacy.biometricEnabled}
                    onCheckedChange={(checked) =>
                      setPrivacy({ ...privacy, biometricEnabled: checked })
                    }
                  />
                </div>

                <Button
                  onClick={handleUpdatePrivacy}
                  disabled={saving}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                >
                  {saving ? t('saving') : t('saveSettings')}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('dataExport')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('downloadDataCopy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full text-gold border-gold/30 hover:bg-gold/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('exportMyData')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="mt-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('subscription')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('manageMembershipLevel')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-gold/10 border border-gold/30 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-serif text-gold mb-2">
                        {t('level')} {subscription.level}
                      </h3>
                      <p className="text-gold/60">
                        {t('status')} <span className="text-gold font-medium">{t(subscription.status)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold/60 text-sm">{t('renewal')}</p>
                      <p className="text-gold font-medium">
                        {subscription.renewalDate || t('notDefined')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-gold font-medium">{t('availableLevels')}</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-black/20 border border-gold/20 rounded-lg">
                      <h5 className="text-gold font-medium mb-2">Gold</h5>
                      <p className="text-gold/60 text-sm">{t('basicAccess')}</p>
                    </div>
                    <div className="p-4 bg-black/20 border border-gold/30 rounded-lg">
                      <h5 className="text-gold font-medium mb-2">Platinum</h5>
                      <p className="text-gold/60 text-sm">{t('premiumAccess')}</p>
                    </div>
                    <div className="p-4 bg-black/20 border border-gold/40 rounded-lg">
                      <h5 className="text-gold font-medium mb-2">Diamond</h5>
                      <p className="text-gold/60 text-sm">{t('exclusiveAccess')}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/payment")}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                >
                  {t('upgradeSubscription')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;

