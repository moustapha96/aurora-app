import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Settings,
  FileText,
  Eye,
  User,
  Building,
  Home,
  Users,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  function_name: string;
  description: string;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  last_status: 'success' | 'error' | 'pending' | null;
  created_at: string;
}

interface CronExecution {
  id: string;
  job_id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: 'success' | 'error' | 'running';
  result: string | null;
  error_message: string | null;
}

interface DocumentAnalysis {
  documentId: string;
  fileName: string;
  userId: string;
  section: string;
  extractedContent: {
    documentType?: string;
    title?: string;
    names?: string[];
    dates?: string[];
    organizations?: string[];
    addresses?: string[];
    amounts?: string[];
    summary?: string;
    rawText?: string;
    language?: string;
  };
  status: 'analyzed' | 'error' | 'not_readable';
  errorMessage?: string;
  analyzedAt: string;
}

// Common cron schedules
const commonSchedules = [
  { label: 'Toutes les minutes', value: '* * * * *' },
  { label: 'Toutes les 5 minutes', value: '*/5 * * * *' },
  { label: 'Toutes les 15 minutes', value: '*/15 * * * *' },
  { label: 'Toutes les 30 minutes', value: '*/30 * * * *' },
  { label: 'Toutes les heures', value: '0 * * * *' },
  { label: 'Tous les jours à minuit', value: '0 0 * * *' },
  { label: 'Tous les jours à 8h', value: '0 8 * * *' },
  { label: 'Tous les lundis à 9h', value: '0 9 * * 1' },
  { label: 'Premier du mois à minuit', value: '0 0 1 * *' },
];

// Available edge functions that can be scheduled as cron jobs
// Note: Functions requiring user input (like analyze-id-card, analyze-profile-image) 
// should NOT be scheduled as cron jobs - they need user-provided data
const availableFunctions = [
  { name: 'auto-verify-documents', description: 'Vérification automatique IA des documents (recommandé pour cron)' },
  { name: 'analyze-section-documents', description: 'Analyse et extraction du contenu des documents de section' },
  { name: 'verify-documents-batch', description: 'Récupération des documents en attente' },
  { name: 'migrate-base64-avatars', description: 'Migration des avatars base64' },
];

const AdminCron = () => {
  const { t } = useLanguage();
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [executions, setExecutions] = useState<CronExecution[]>([]);
  const [documentAnalyses, setDocumentAnalyses] = useState<DocumentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showDocumentContent, setShowDocumentContent] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<DocumentAnalysis | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<CronExecution | null>(null);
  
  // New job form state
  const [newJob, setNewJob] = useState({
    name: '',
    schedule: '0 * * * *',
    function_name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadCronJobs();
    loadExecutionHistory();
    loadDocumentAnalyses();
  }, []);

  const loadCronJobs = async () => {
    setIsLoading(true);
    try {
      // Load from admin_settings where setting_key starts with 'cron_job_'
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .like('setting_key', 'cron_job_%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobs: CronJob[] = (data || []).map(item => {
        const jobData = JSON.parse(item.setting_value || '{}');
        return {
          id: item.id,
          name: jobData.name || item.setting_key.replace('cron_job_', ''),
          schedule: jobData.schedule || '0 * * * *',
          function_name: jobData.function_name || '',
          description: jobData.description || item.description || '',
          is_active: jobData.is_active ?? true,
          last_run: jobData.last_run || null,
          next_run: jobData.next_run || null,
          last_status: jobData.last_status || null,
          created_at: item.created_at,
        };
      });

      setCronJobs(jobs);
    } catch (error) {
      console.error('Error loading cron jobs:', error);
      toast.error('Erreur lors du chargement des tâches cron');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExecutionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .like('setting_key', 'cron_execution_%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const history: CronExecution[] = (data || []).map(item => {
        const execData = JSON.parse(item.setting_value || '{}');
        return {
          id: item.id,
          job_id: execData.job_id || '',
          job_name: execData.job_name || '',
          started_at: execData.started_at || item.created_at,
          completed_at: execData.completed_at || null,
          status: execData.status || 'pending',
          result: execData.result || null,
          error_message: execData.error_message || null,
        };
      });

      setExecutions(history);
    } catch (error) {
      console.error('Error loading execution history:', error);
    }
  };

  const loadDocumentAnalyses = async () => {
    setIsLoadingAnalyses(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .like('setting_key', 'doc_analysis_%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const analyses: DocumentAnalysis[] = (data || []).map(item => {
        return JSON.parse(item.setting_value || '{}');
      }).filter(a => a.documentId);

      setDocumentAnalyses(analyses);
    } catch (error) {
      console.error('Error loading document analyses:', error);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  const runDocumentAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      toast.info('Analyse des documents en cours...');
      const { data, error } = await supabase.functions.invoke('analyze-section-documents', {
        body: { section: sectionFilter !== 'all' ? sectionFilter : undefined },
      });

      if (error) throw error;

      toast.success(`${data?.stats?.totalAnalyzed || 0} documents analysés`);
      loadDocumentAnalyses();
    } catch (error) {
      console.error('Error running analysis:', error);
      toast.error('Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'family': return <Home className="h-4 w-4" />;
      case 'business': return <Building className="h-4 w-4" />;
      case 'personal': return <User className="h-4 w-4" />;
      case 'network': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredAnalyses = sectionFilter === 'all' 
    ? documentAnalyses 
    : documentAnalyses.filter(a => a.section === sectionFilter);

  const saveCronJob = async () => {
    if (!newJob.name || !newJob.function_name || !newJob.schedule) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const settingKey = `cron_job_${newJob.name.toLowerCase().replace(/\s+/g, '_')}`;
      const jobData = {
        ...newJob,
        last_run: null,
        next_run: null,
        last_status: null,
      };

      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: JSON.stringify(jobData),
          description: newJob.description,
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast.success('Tâche cron créée avec succès');
      setIsDialogOpen(false);
      setNewJob({
        name: '',
        schedule: '0 * * * *',
        function_name: '',
        description: '',
        is_active: true,
      });
      loadCronJobs();
    } catch (error) {
      console.error('Error saving cron job:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const toggleJobStatus = async (job: CronJob) => {
    try {
      const settingKey = `cron_job_${job.name.toLowerCase().replace(/\s+/g, '_')}`;
      const updatedJob = { ...job, is_active: !job.is_active };
      
      const { error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: JSON.stringify(updatedJob),
        })
        .eq('id', job.id);

      if (error) throw error;

      toast.success(updatedJob.is_active ? t('adminTaskActivated') : t('adminTaskDeactivated'));
      loadCronJobs();
    } catch (error) {
      console.error('Error toggling job status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteJob = async (job: CronJob) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${job.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_settings')
        .delete()
        .eq('id', job.id);

      if (error) throw error;

      toast.success(t('adminTaskDeleted'));
      loadCronJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const runJobNow = async (job: CronJob) => {
    try {
      toast.info(`Exécution de "${job.name}"...`);
      
      // Create execution record
      const executionId = `cron_execution_${Date.now()}`;
      const executionData = {
        job_id: job.id,
        job_name: job.name,
        started_at: new Date().toISOString(),
        status: 'running',
      };

      await supabase
        .from('admin_settings')
        .insert({
          setting_key: executionId,
          setting_value: JSON.stringify(executionData),
          description: `Exécution manuelle de ${job.name}`,
        });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke(job.function_name, {
        body: { triggered_by: 'manual', job_name: job.name },
      });

      // Update execution record
      const finalStatus = error ? 'error' : 'success';
      await supabase
        .from('admin_settings')
        .update({
          setting_value: JSON.stringify({
            ...executionData,
            completed_at: new Date().toISOString(),
            status: finalStatus,
            result: data ? JSON.stringify(data) : null,
            error_message: error?.message || null,
          }),
        })
        .eq('setting_key', executionId);

      // Update job's last_run
      const updatedJob = {
        ...job,
        last_run: new Date().toISOString(),
        last_status: finalStatus,
      };
      
      await supabase
        .from('admin_settings')
        .update({
          setting_value: JSON.stringify(updatedJob),
        })
        .eq('id', job.id);

      if (error) {
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.success('Tâche exécutée avec succès');
      }

      loadCronJobs();
      loadExecutionHistory();
    } catch (error) {
      console.error('Error running job:', error);
      toast.error('Erreur lors de l\'exécution');
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Succès</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Erreur</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> En cours</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> Jamais exécuté</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tâches Planifiées (Cron)</h1>
            <p className="text-muted-foreground mt-1">Gérez les tâches automatisées et leur planification</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Masquer l\'historique' : 'Voir l\'historique'}
            </Button>
            <Button variant="outline" onClick={() => { loadCronJobs(); loadExecutionHistory(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer une tâche cron</DialogTitle>
                  <DialogDescription>
                    Configurez une nouvelle tâche planifiée
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de la tâche *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Nettoyage quotidien"
                      value={newJob.name}
                      onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="function">Fonction Edge *</Label>
                    <Select
                      value={newJob.function_name}
                      onValueChange={(value) => setNewJob({ ...newJob, function_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une fonction" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFunctions.map((fn) => (
                          <SelectItem key={fn.name} value={fn.name}>
                            {fn.name} - {fn.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule">Planification (Cron) *</Label>
                    <Select
                      value={newJob.schedule}
                      onValueChange={(value) => setNewJob({ ...newJob, schedule: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonSchedules.map((schedule) => (
                          <SelectItem key={schedule.value} value={schedule.value}>
                            {schedule.label} ({schedule.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Ou entrez une expression cron personnalisée"
                      value={newJob.schedule}
                      onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: minute heure jour mois jour_semaine
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Description de la tâche..."
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={newJob.is_active}
                      onCheckedChange={(checked) => setNewJob({ ...newJob, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Activer immédiatement</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={saveCronJob}>
                    Créer la tâche
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-400">Configuration des tâches Cron</p>
                <p className="text-muted-foreground mt-1">
                  Les tâches cron sont gérées via pg_cron et pg_net. Pour activer une tâche en production,
                  vous devez exécuter la requête SQL correspondante dans la base de données.
                  Les exécutions manuelles sont disponibles directement depuis cette interface.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cron Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tâches planifiées
            </CardTitle>
            <CardDescription>
              {cronJobs.length} tâche(s) configurée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : cronJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune tâche cron configurée</p>
                <p className="text-sm">Créez votre première tâche planifiée</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Planification</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière exécution</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cronJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{job.function_name}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{job.schedule}</code>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.last_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.last_run 
                          ? format(new Date(job.last_run), 'dd MMM yyyy HH:mm', { locale: fr })
                          : 'Jamais'
                        }
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={job.is_active}
                          onCheckedChange={() => toggleJobStatus(job)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runJobNow(job)}
                            title="Exécuter maintenant"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteJob(job)}
                            className="text-destructive hover:text-destructive"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Execution History */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des exécutions
              </CardTitle>
              <CardDescription>
                Les 50 dernières exécutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune exécution enregistrée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tâche</TableHead>
                      <TableHead>Démarré</TableHead>
                      <TableHead>Terminé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((exec) => (
                      <TableRow key={exec.id}>
                        <TableCell className="font-medium">{exec.job_name}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(exec.started_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {exec.completed_at 
                            ? format(new Date(exec.completed_at), 'HH:mm:ss', { locale: fr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(exec.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExecution(exec)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir résultat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Execution Result Dialog */}
        <Dialog open={!!selectedExecution} onOpenChange={(open) => !open && setSelectedExecution(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedExecution && getStatusBadge(selectedExecution.status)}
                Résultat de l'exécution
              </DialogTitle>
              <DialogDescription>
                {selectedExecution?.job_name} - {selectedExecution?.started_at && format(new Date(selectedExecution.started_at), 'dd MMM yyyy HH:mm:ss', { locale: fr })}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Démarré:</span>
                    <p className="font-medium">
                      {selectedExecution?.started_at && format(new Date(selectedExecution.started_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Terminé:</span>
                    <p className="font-medium">
                      {selectedExecution?.completed_at 
                        ? format(new Date(selectedExecution.completed_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })
                        : 'En cours...'
                      }
                    </p>
                  </div>
                </div>

                {selectedExecution?.error_message && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Erreur</span>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap text-red-300">
                      {selectedExecution.error_message}
                    </pre>
                  </div>
                )}

                {selectedExecution?.result && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Résultat</span>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap overflow-auto">
                        {(() => {
                          try {
                            const parsed = JSON.parse(selectedExecution.result);
                            return JSON.stringify(parsed, null, 2);
                          } catch {
                            return selectedExecution.result;
                          }
                        })()}
                      </pre>
                    </div>
                  </div>
                )}

                {!selectedExecution?.result && !selectedExecution?.error_message && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun résultat disponible</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Document Content Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contenu des documents analysés
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>{filteredAnalyses.length} document(s) analysé(s)</span>
              <div className="flex gap-2">
                <Select value={sectionFilter} onValueChange={setSectionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes sections</SelectItem>
                    <SelectItem value="family">Famille</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="personal">Personnel</SelectItem>
                    <SelectItem value="network">Réseau</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadDocumentAnalyses} disabled={isLoadingAnalyses}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingAnalyses ? 'animate-spin' : ''}`} />
                </Button>
                <Button size="sm" onClick={runDocumentAnalysis} disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Analyser
                </Button>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAnalyses ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun document analysé</p>
                <p className="text-sm">Lancez une analyse pour extraire le contenu des documents</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredAnalyses.map((analysis) => (
                  <AccordionItem key={analysis.documentId} value={analysis.documentId}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        {getSectionIcon(analysis.section)}
                        <div>
                          <span className="font-medium">{analysis.fileName}</span>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{analysis.section}</Badge>
                            {analysis.extractedContent?.documentType && (
                              <Badge variant="secondary" className="text-xs">{analysis.extractedContent.documentType}</Badge>
                            )}
                            <Badge className={analysis.status === 'analyzed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {analysis.status === 'analyzed' ? 'Analysé' : 'Erreur'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                        {analysis.extractedContent?.summary && (
                          <div><strong>Résumé:</strong> {analysis.extractedContent.summary}</div>
                        )}
                        {analysis.extractedContent?.names?.length > 0 && (
                          <div><strong>Noms:</strong> {analysis.extractedContent.names.join(', ')}</div>
                        )}
                        {analysis.extractedContent?.dates?.length > 0 && (
                          <div><strong>Dates:</strong> {analysis.extractedContent.dates.join(', ')}</div>
                        )}
                        {analysis.extractedContent?.organizations?.length > 0 && (
                          <div><strong>Organisations:</strong> {analysis.extractedContent.organizations.join(', ')}</div>
                        )}
                        {analysis.extractedContent?.addresses?.length > 0 && (
                          <div><strong>Adresses:</strong> {analysis.extractedContent.addresses.join(', ')}</div>
                        )}
                        {analysis.extractedContent?.amounts?.length > 0 && (
                          <div><strong>Montants:</strong> {analysis.extractedContent.amounts.join(', ')}</div>
                        )}
                        {analysis.extractedContent?.rawText && (
                          <div className="mt-2">
                            <strong>Texte extrait:</strong>
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{analysis.extractedContent.rawText}</p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          Analysé le {format(new Date(analysis.analyzedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCron;
