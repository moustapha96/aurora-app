import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Bell, Database, AlertTriangle, Save, Key, Eye, EyeOff, CheckCircle, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    emailVerificationRequired: false,
    maxReferralsPerUser: 10,
    autoApproveContent: false,
    enableNotifications: true,
  });

  // Jumio configuration state
  const [jumioConfig, setJumioConfig] = useState({
    apiToken: '',
    apiSecret: '',
    baseUrl: 'https://api.amer-1.jumio.ai',
  });
  const [showJumioToken, setShowJumioToken] = useState(false);
  const [showJumioSecret, setShowJumioSecret] = useState(false);
  const [jumioConfigured, setJumioConfigured] = useState(false);
  const [savingJumio, setSavingJumio] = useState(false);

  useEffect(() => {
    loadJumioConfig();
  }, []);

  const loadJumioConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['jumio_api_token', 'jumio_api_secret', 'jumio_base_url']);

      if (error) throw error;

      if (data && data.length > 0) {
        const configMap: Record<string, string> = {};
        data.forEach(item => {
          configMap[item.setting_key] = item.setting_value || '';
        });

        setJumioConfig({
          apiToken: configMap.jumio_api_token || '',
          apiSecret: configMap.jumio_api_secret || '',
          baseUrl: configMap.jumio_base_url || 'https://api.amer-1.jumio.ai',
        });

        // Check if both token and secret are configured
        setJumioConfigured(!!configMap.jumio_api_token && !!configMap.jumio_api_secret);
      }
    } catch (error) {
      console.error('Error loading Jumio config:', error);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    toast.success('Paramètres enregistrés');
  };

  const saveJumioConfig = async () => {
    setSavingJumio(true);
    try {
      const configItems = [
        { setting_key: 'jumio_api_token', setting_value: jumioConfig.apiToken, description: 'Jumio API Token' },
        { setting_key: 'jumio_api_secret', setting_value: jumioConfig.apiSecret, description: 'Jumio API Secret' },
        { setting_key: 'jumio_base_url', setting_value: jumioConfig.baseUrl, description: 'Jumio API Base URL' },
      ];

      for (const item of configItems) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert(item, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      setJumioConfigured(!!jumioConfig.apiToken && !!jumioConfig.apiSecret);
      toast.success('Configuration Jumio enregistrée');
    } catch (error) {
      console.error('Error saving Jumio config:', error);
      toast.error('Erreur lors de l\'enregistrement de la configuration Jumio');
    } finally {
      setSavingJumio(false);
    }
  };

  const testJumioConnection = async () => {
    try {
      toast.info('Test de connexion Jumio en cours...');
      
      // Simple connection test - we can't actually call Jumio from frontend
      // but we can verify the config is saved
      if (!jumioConfig.apiToken || !jumioConfig.apiSecret) {
        toast.error('Veuillez configurer le token et le secret API');
        return;
      }

      // Test via edge function
      const { data, error } = await supabase.functions.invoke('jumio-verification', {
        body: { action: 'status' }
      });

      if (error) {
        if (error.message?.includes('non configuré')) {
          toast.error('Jumio n\'est pas configuré correctement');
        } else {
          toast.warning('Configuration sauvegardée. Le test complet nécessite des secrets serveur.');
        }
      } else {
        toast.success('Connexion Jumio fonctionnelle');
      }
    } catch (error) {
      console.error('Error testing Jumio:', error);
      toast.error('Erreur lors du test de connexion');
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
            <p className="text-muted-foreground">Configuration système de la plateforme</p>
          </div>
          <Button onClick={saveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Jumio Identity Verification Settings */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                Vérification d'Identité Jumio
                {jumioConfigured && (
                  <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Configuré
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Configuration de l'API Jumio pour la vérification des documents d'identité et photos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="jumioBaseUrl">URL de l'API Jumio</Label>
                <Input
                  id="jumioBaseUrl"
                  value={jumioConfig.baseUrl}
                  onChange={(e) => setJumioConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.amer-1.jumio.ai"
                />
                <p className="text-xs text-muted-foreground">
                  Régions: amer-1 (Americas), emea-1 (Europe), apac-1 (Asia Pacific)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="jumioToken">API Token</Label>
                <div className="relative">
                  <Input
                    id="jumioToken"
                    type={showJumioToken ? 'text' : 'password'}
                    value={jumioConfig.apiToken}
                    onChange={(e) => setJumioConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                    placeholder="Entrez votre API Token Jumio"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowJumioToken(!showJumioToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showJumioToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jumioSecret">API Secret</Label>
                <div className="relative">
                  <Input
                    id="jumioSecret"
                    type={showJumioSecret ? 'text' : 'password'}
                    value={jumioConfig.apiSecret}
                    onChange={(e) => setJumioConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Entrez votre API Secret Jumio"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowJumioSecret(!showJumioSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showJumioSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={saveJumioConfig} disabled={savingJumio}>
                  <Key className="h-4 w-4 mr-2" />
                  {savingJumio ? 'Enregistrement...' : 'Enregistrer les clés'}
                </Button>
                <Button variant="outline" onClick={testJumioConnection}>
                  Tester la connexion
                </Button>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Guide de configuration</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Connectez-vous à votre compte Jumio Dashboard</li>
                  <li>Allez dans Settings → API Credentials</li>
                  <li>Créez une nouvelle paire API Token/Secret</li>
                  <li>Copiez les valeurs dans les champs ci-dessus</li>
                  <li>Sélectionnez la région correspondant à votre compte</li>
                </ol>
                <a 
                  href="https://documentation.jumio.ai/docs/developer-resources/API/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Documentation Jumio →
                </a>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Généraux
              </CardTitle>
              <CardDescription>Configuration générale de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registration">Autoriser les inscriptions</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux nouveaux utilisateurs de s'inscrire
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
                  <Label htmlFor="emailVerification">Vérification email obligatoire</Label>
                  <p className="text-sm text-muted-foreground">
                    Exiger la vérification de l'email avant l'accès
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
                  <Label htmlFor="maxReferrals">Parrainages maximum par utilisateur</Label>
                  <p className="text-sm text-muted-foreground">
                    Nombre maximum de parrainages autorisés
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
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
              <CardDescription>Paramètres de sécurité et modération</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoApprove">Approbation automatique du contenu</Label>
                  <p className="text-sm text-muted-foreground">
                    Publier le contenu sans modération préalable
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
                Notifications
              </CardTitle>
              <CardDescription>Configuration des notifications système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Activer les notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer des notifications aux utilisateurs
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
                Mode Maintenance
              </CardTitle>
              <CardDescription>Mettre le site en maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance" className={settings.maintenanceMode ? 'text-orange-500 font-medium' : ''}>
                    {settings.maintenanceMode ? 'Mode maintenance ACTIVÉ' : 'Mode maintenance désactivé'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.maintenanceMode 
                      ? 'Seuls les administrateurs peuvent accéder au site'
                      : 'Le site est accessible à tous les utilisateurs'
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

          {/* Database Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Base de données
              </CardTitle>
              <CardDescription>Informations sur la base de données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium text-foreground">Supabase</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Région</p>
                  <p className="font-medium text-foreground">EU (Paris)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="font-medium text-green-500">Connecté</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">RLS</p>
                  <p className="font-medium text-green-500">Activé</p>
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
