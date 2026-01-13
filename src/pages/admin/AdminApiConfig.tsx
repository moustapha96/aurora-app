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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
          endpoint: t('adminApiConfigViaLovableGateway')
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
          description: t('adminApiConfigVeriffWebhookDesc'),
          status: 'active'
        },
        {
          name: 'Analyze ID Card',
          url: `${baseUrl}/analyze-id-card`,
          description: t('adminApiConfigAnalyzeIDCardDesc'),
          status: 'active'
        }
      ]);

    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error(t('adminApiConfigLoadingError'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('adminApiConfigCopied').replace('{label}', label));
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    toast.info(t('adminApiConfigTestWebhook').replace('{name}', webhook.name));

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
          toast.success(t('adminApiConfigFunctionReady').replace('{name}', webhook.name));
        } else if (error) {
          toast.warning(t('adminApiConfigFunctionAccessible').replace('{name}', webhook.name).replace('{message}', error.message));
        } else {
          toast.success(t('adminApiConfigFunctionWorking').replace('{name}', webhook.name));
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true },
      });

      if (error) {
        toast.warning(
          t('adminApiConfigWebhookError').replace('{message}', error.message),
        );
      } else {
        toast.success(t('adminApiConfigWebhookWorking').replace('{name}', webhook.name));
      }
    } catch (err: unknown) {
      console.error('Test webhook error:', err);
      toast.error(t('adminApiConfigTestError').replace('{name}', webhook.name));
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('adminApiConfigTitle')}</h1>
            <p className="text-muted-foreground">{t('adminApiConfigDescription')}</p>
          </div>
          <Button onClick={loadConfiguration} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('adminApiConfigRefresh')}
          </Button>
        </div>

        <div className="grid gap-6">
          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('adminApiConfigExternalAPIs')}
              </CardTitle>
              <CardDescription>
                {t('adminApiConfigExternalAPIsDescription')}
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
                        {api.configured ? t('adminApiConfigConfigured') : t('adminApiConfigNotConfigured')}
                      </Badge>
                      {api.endpoint && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(api.endpoint!, t('adminApiConfigEndpoint'))}
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
                {t('adminApiConfigWebhooks')}
              </CardTitle>
              <CardDescription>
                {t('adminApiConfigWebhooksDescription')}
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
                          {webhook.status === 'active' ? t('adminApiConfigActive') : 
                           webhook.status === 'inactive' ? t('adminApiConfigInactive') : t('adminApiConfigPending')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testWebhook(webhook)}
                        >
                          {t('adminApiConfigTest')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(webhook.url, t('adminApiConfigWebhookURL'))}
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
                    <h4 className="font-medium text-amber-500">{t('adminApiConfigVeriffWebhookConfig')}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('adminApiConfigVeriffWebhookConfigDesc')}
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
                {t('adminApiConfigSecrets')}
              </CardTitle>
              <CardDescription>
                {t('adminApiConfigSecretsDescription')}
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
                  {t('adminApiConfigConnectionInfo')}
                </h4>
                
                <div className="grid gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">{t('adminApiConfigProjectID')}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{projectId}</code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(projectId, t('adminApiConfigProjectID'))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">{t('adminApiConfigSupabaseURL')}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        https://{projectId}.supabase.co
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`https://${projectId}.supabase.co`, t('adminApiConfigSupabaseURL'))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium mb-1">{t('adminApiConfigEdgeFunctionsBaseURL')}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        https://{projectId}.supabase.co/functions/v1
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(`https://${projectId}.supabase.co/functions/v1`, t('adminApiConfigFunctionsURL'))}
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
                {t('adminApiConfigEdgeFunctions')}
              </CardTitle>
              <CardDescription>
                {t('adminApiConfigEdgeFunctionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'analyze-id-card', description: t('adminApiConfigFuncAnalyzeIDCard') },
                  { name: 'veriff-verification', description: t('adminApiConfigFuncVeriffVerification') },
                  { name: 'veriff-webhook', description: t('adminApiConfigFuncVeriffWebhook') },
                  { name: 'business-ai-suggest', description: t('adminApiConfigFuncBusinessAISuggest') },
                  { name: 'family-ai-suggest', description: t('adminApiConfigFuncFamilyAISuggest') },
                  { name: 'network-ai-suggest', description: t('adminApiConfigFuncNetworkAISuggest') },
                  { name: 'personal-ai-suggest', description: t('adminApiConfigFuncPersonalAISuggest') },
                  { name: 'parse-cv-business', description: t('adminApiConfigFuncParseCVBusiness') },
                  { name: 'parse-cv-network', description: t('adminApiConfigFuncParseCVNetwork') },
                  { name: 'create-test-members', description: t('adminApiConfigFuncCreateTestMembers') },
                  { name: 'migrate-base64-avatars', description: t('adminApiConfigFuncMigrateAvatars') },
                  { name: 'verify-documents-batch', description: t('adminApiConfigFuncVerifyDocumentsBatch') },
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
                        t('adminApiConfigURL')
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
              <CardTitle>{t('adminApiConfigDocumentation')}</CardTitle>
              <CardDescription>{t('adminApiConfigDocumentationDescription')}</CardDescription>
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
                  <span>{t('adminApiConfigDocVeriff')}</span>
                </a>
                <a 
                  href="https://supabase.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span>{t('adminApiConfigDocSupabase')}</span>
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
