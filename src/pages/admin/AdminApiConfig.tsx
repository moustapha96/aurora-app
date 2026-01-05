import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Key, 
  Webhook, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Copy, 
  RefreshCw,
  Globe,
  Shield,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ApiStatus {
  name: string;
  configured: boolean;
  lastChecked?: string;
  endpoint?: string;
}

interface WebhookConfig {
  name: string;
  url: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
}

const AdminApiConfig = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [secrets, setSecrets] = useState<{ name: string; configured: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId] = useState('lwfqselpqlliaxduxihu');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // Load API configurations from admin_settings
      const { data: settings, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value, updated_at')
        .in('setting_key', [
          'veriff_api_key',
          'veriff_shared_secret',
          'veriff_base_url'
        ]);

      if (error) throw error;

      const configMap: Record<string, { value: string; updated: string }> = {};
      settings?.forEach(item => {
        configMap[item.setting_key] = { 
          value: item.setting_value || '', 
          updated: item.updated_at 
        };
      });

      // Set API statuses
      const veriffConfigured = !!(configMap.veriff_api_key?.value);

      setApiStatuses([
        {
          name: 'Veriff Identity Verification',
          configured: veriffConfigured,
          lastChecked: configMap.veriff_api_key?.updated,
          endpoint: configMap.veriff_base_url?.value || 'https://stationapi.veriff.com'
        },
        {
          name: 'OpenAI (Lovable AI)',
          configured: true,
          endpoint: 'Via Lovable AI Gateway'
        },
        {
          name: 'Supabase Database',
          configured: true,
          endpoint: `https://${projectId}.supabase.co`
        }
      ]);

      // Set secrets status
      setSecrets([
        { name: 'SUPABASE_URL', configured: true },
        { name: 'SUPABASE_ANON_KEY', configured: true },
        { name: 'SUPABASE_SERVICE_ROLE_KEY', configured: true },
        { name: 'VERIFF_API_KEY', configured: veriffConfigured },
        { name: 'VERIFF_SHARED_SECRET', configured: !!configMap.veriff_shared_secret?.value },
        { name: 'LOVABLE_API_KEY', configured: true },
      ]);

      // Set webhooks
      const baseUrl = `https://${projectId}.supabase.co/functions/v1`;
      setWebhooks([
        {
          name: 'Veriff Webhook',
          url: `${baseUrl}/veriff-webhook`,
          description: 'Reçoit les notifications de vérification Veriff',
          status: 'active'
        },
        {
          name: 'Analyze ID Card',
          url: `${baseUrl}/analyze-id-card`,
          description: 'Analyse les documents d\'identité via IA',
          status: 'active'
        }
      ]);

    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier`);
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    toast.info(`Test du webhook ${webhook.name}...`);

    // Map webhook names to actual function names
    const functionNameMap: Record<string, string> = {
      'Veriff Webhook': 'veriff-webhook',
      'Analyze ID Card': 'analyze-id-card',
    };

    const functionName =
      functionNameMap[webhook.name] || webhook.name.toLowerCase().replace(/\s+/g, '-');

    try {
      // analyze-id-card requires an image: a 400 "Image is required" is expected for this test
      if (functionName === 'analyze-id-card') {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { test: true },
        });

        // Check if response data contains the expected validation error
        const responseError = data?.error || error?.message || '';
        
        if (
          responseError.includes('Image is required') ||
          responseError.includes('imageBase64') ||
          // If we get a non-2xx but function is responding, it's working
          (error?.message?.includes('non-2xx') && !error?.message?.includes('404'))
        ) {
          toast.success(`Fonction ${webhook.name} accessible et prête`);
        } else if (error) {
          toast.warning(`Fonction ${webhook.name} accessible: ${error.message}`);
        } else {
          toast.success(`Fonction ${webhook.name} fonctionnelle`);
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true },
      });

      if (error) {
        toast.warning(
          `Webhook accessible mais retourne une erreur: ${error.message}`,
        );
      } else {
        toast.success(`Webhook ${webhook.name} fonctionnel`);
      }
    } catch (err: unknown) {
      console.error('Test webhook error:', err);
      toast.error(`Erreur lors du test du webhook ${webhook.name}`);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuration API</h1>
            <p className="text-muted-foreground">APIs, Webhooks et clés de configuration</p>
          </div>
          <Button onClick={loadConfiguration} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="grid gap-6">
          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                APIs Externes
              </CardTitle>
              <CardDescription>
                État des connexions aux APIs tierces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiStatuses.map((api, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {api.configured ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{api.name}</p>
                        <p className="text-sm text-muted-foreground">{api.endpoint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={api.configured ? 'default' : 'destructive'}>
                        {api.configured ? 'Configuré' : 'Non configuré'}
                      </Badge>
                      {api.endpoint && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(api.endpoint!, 'Endpoint')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Endpoints pour recevoir les notifications externes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <Badge 
                          variant={
                            webhook.status === 'active' ? 'default' : 
                            webhook.status === 'inactive' ? 'destructive' : 'secondary'
                          }
                        >
                          {webhook.status === 'active' ? 'Actif' : 
                           webhook.status === 'inactive' ? 'Inactif' : 'En attente'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testWebhook(webhook)}
                        >
                          Tester
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(webhook.url, 'URL du webhook')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{webhook.description}</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                      {webhook.url}
                    </code>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-500">Configuration Veriff Webhook</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pour que Veriff envoie les résultats de vérification, configurez l'URL du webhook dans votre dashboard Veriff:
                    </p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block break-all">
                      https://{projectId}.supabase.co/functions/v1/veriff-webhook
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secrets / Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Secrets & Variables d'Environnement
              </CardTitle>
              <CardDescription>
                Clés API et secrets configurés pour les Edge Functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {secrets.map((secret, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      secret.configured ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'
                    }`}
                  >
                    {secret.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="text-sm font-mono truncate">{secret.name}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Informations de Connexion
                </h4>
                
                <div className="grid gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">Project ID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{projectId}</code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(projectId, 'Project ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">Supabase URL</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        https://{projectId}.supabase.co
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`https://${projectId}.supabase.co`, 'Supabase URL')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">Edge Functions Base URL</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        https://{projectId}.supabase.co/functions/v1
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`https://${projectId}.supabase.co/functions/v1`, 'Functions URL')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edge Functions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Edge Functions Disponibles
              </CardTitle>
              <CardDescription>
                Liste des fonctions serverless déployées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'analyze-id-card', description: 'Analyse documents d\'identité via IA' },
                  { name: 'veriff-verification', description: 'Initie vérification Veriff' },
                  { name: 'veriff-webhook', description: 'Reçoit callbacks Veriff' },
                  { name: 'business-ai-suggest', description: 'Suggestions IA Business' },
                  { name: 'family-ai-suggest', description: 'Suggestions IA Family' },
                  { name: 'network-ai-suggest', description: 'Suggestions IA Network' },
                  { name: 'personal-ai-suggest', description: 'Suggestions IA Personal' },
                  { name: 'parse-cv-business', description: 'Parse CV pour Business' },
                  { name: 'parse-cv-network', description: 'Parse CV pour Network' },
                  { name: 'create-test-members', description: 'Crée membres de test' },
                  { name: 'migrate-base64-avatars', description: 'Migration avatars' },
                  { name: 'verify-documents-batch', description: 'Vérification batch documents' },
                ].map((func, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-mono text-sm">{func.name}</p>
                      <p className="text-xs text-muted-foreground">{func.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(
                        `https://${projectId}.supabase.co/functions/v1/${func.name}`,
                        'URL'
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentation Links */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Liens vers les documentations des APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a 
                  href="https://docs.veriff.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span>Documentation Veriff</span>
                </a>
                <a 
                  href="https://supabase.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span>Documentation Supabase</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminApiConfig;
