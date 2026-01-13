import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign,
  Shield,
  Activity,
  Filter,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminReports() {
  const { t } = useLanguage();

  const reportTypes = [
    {
      id: 'members',
      title: t('adminReportsMembersTitle'),
      description: t('adminReportsMembersDescription'),
      icon: Users,
      format: t('adminReportsFormatCSV')
    },
    {
      id: 'verifications',
      title: t('adminReportsVerificationsTitle'),
      description: t('adminReportsVerificationsDescription'),
      icon: Shield,
      format: t('adminReportsFormatCSV')
    },
    {
      id: 'connections',
      title: t('adminReportsConnectionsTitle'),
      description: t('adminReportsConnectionsDescription'),
      icon: Users,
      format: t('adminReportsFormatCSV')
    },
    {
      id: 'activity',
      title: t('adminReportsActivityTitle'),
      description: t('adminReportsActivityDescription'),
      icon: Activity,
      format: t('adminReportsFormatCSV')
    },
  ];
  const [period, setPeriod] = useState('month');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [generatedReports, setGeneratedReports] = useState<Array<{
    name: string;
    date: string;
    size: string;
    type: string;
    data: string;
  }>>([]);

  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateMembersReport = async () => {
    // Fetch public profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch private data for admin report
    const { data: privateProfiles } = await supabase
      .from('profiles_private')
      .select('*');

    // Create a map for quick lookup
    const privateMap = new Map(privateProfiles?.map(p => [p.user_id, p]) || []);

    const headers = ['ID', 'Prénom', 'Nom', 'Téléphone', 'Pays', 'Fonction', 'Domaine', 'Fortune', 'Vérifié', 'Créé le'];
    const rows = profiles?.map(p => {
      const priv = privateMap.get(p.id);
      return [
        p.id,
        p.first_name,
        p.last_name,
        priv?.mobile_phone || '',
        p.country || '',
        p.job_function || '',
        p.activity_domain || '',
        `${priv?.wealth_amount || ''} ${priv?.wealth_unit || ''} ${priv?.wealth_currency || ''}`.trim(),
        p.identity_verified ? t('adminReportsYes') : t('adminReportsNo'),
        p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''
      ];
    }) || [];

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    return { csv, count: profiles?.length || 0 };
  };

  const generateVerificationsReport = async () => {
    const { data: verifications, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const headers = ['ID', 'User ID', 'Statut', 'Type', 'Prénom extrait', 'Nom extrait', 'Type document', 'Pays document', 'Créé le'];
    const rows = verifications?.map(v => [
      v.id,
      v.user_id,
      v.status,
      v.verification_type || '',
      v.first_name_extracted || '',
      v.last_name_extracted || '',
      v.document_type || '',
      v.document_country || '',
      v.created_at ? new Date(v.created_at).toLocaleDateString('fr-FR') : ''
    ]) || [];

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    return { csv, count: verifications?.length || 0 };
  };

  const generateConnectionsReport = async () => {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const headers = ['ID', 'User ID', 'Friend ID', 'Business Access', 'Family Access', 'Personal Access', 'Influence Access', 'Créé le'];
    const rows = friendships?.map(f => [
      f.id,
      f.user_id,
      f.friend_id,
      f.business_access ? t('adminReportsYes') : t('adminReportsNo'),
      f.family_access ? t('adminReportsYes') : t('adminReportsNo'),
      f.personal_access ? t('adminReportsYes') : t('adminReportsNo'),
      f.influence_access ? t('adminReportsYes') : t('adminReportsNo'),
      f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : ''
    ]) || [];

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    return { csv, count: friendships?.length || 0 };
  };

  const generateActivityReport = async () => {
    const { data: requests, error } = await supabase
      .from('connection_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const headers = ['ID', 'Demandeur', 'Destinataire', 'Statut', 'Créé le', 'Mis à jour le'];
    const rows = requests?.map(r => [
      r.id,
      r.requester_id,
      r.recipient_id,
      r.status,
      r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '',
      r.updated_at ? new Date(r.updated_at).toLocaleDateString('fr-FR') : ''
    ]) || [];

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    return { csv, count: requests?.length || 0 };
  };

  const handleGenerateReport = async (reportId: string) => {
    setGeneratingReport(reportId);
    
    try {
      let result: { csv: string; count: number };
      let filename: string;
      const date = new Date().toISOString().split('T')[0];

      switch (reportId) {
        case 'members':
          result = await generateMembersReport();
          filename = `Membres_${date}.csv`;
          break;
        case 'verifications':
          result = await generateVerificationsReport();
          filename = `Verifications_${date}.csv`;
          break;
        case 'connections':
          result = await generateConnectionsReport();
          filename = `Connexions_${date}.csv`;
          break;
        case 'activity':
          result = await generateActivityReport();
          filename = `Activite_${date}.csv`;
          break;
        default:
          throw new Error(t('adminReportsUnknownType'));
      }

      // Download the file
      downloadCSV(result.csv, filename);

      // Add to recent reports
      const newReport = {
        name: filename,
        date: new Date().toLocaleDateString('fr-FR'),
        size: `${(result.csv.length / 1024).toFixed(1)} KB`,
        type: reportId,
        data: result.csv
      };

      setGeneratedReports(prev => [newReport, ...prev.slice(0, 9)]);
      toast.success(t('adminReportsSuccess').replace('{count}', result.count.toString()));

    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(t('adminReportsError').replace('{message}', error.message));
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadReport = (report: typeof generatedReports[0]) => {
    downloadCSV(report.data, report.name);
    toast.success(t('adminReportsDownloadStarted'));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif text-gold">{t('adminReportsTitle')}</h1>
            <p className="text-gold/60">{t('adminReportsDescription')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] border-gold/30 bg-black text-gold">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('adminReportsPeriod')} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30">
                <SelectItem value="week" className="text-gold">{t('adminReportsThisWeek')}</SelectItem>
                <SelectItem value="month" className="text-gold">{t('adminReportsThisMonth')}</SelectItem>
                <SelectItem value="quarter" className="text-gold">{t('adminReportsThisQuarter')}</SelectItem>
                <SelectItem value="year" className="text-gold">{t('adminReportsThisYear')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <Card key={report.id} className="bg-black/40 border-gold/20 hover:border-gold/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-gold/10">
                    <report.icon className="w-5 h-5 text-gold" />
                  </div>
                  <Badge variant="outline" className="border-gold/30 text-gold/60 text-xs">
                    {report.format}
                  </Badge>
                </div>
                <CardTitle className="text-gold font-medium text-lg mt-3">
                  {report.title}
                </CardTitle>
                <CardDescription className="text-gold/60 text-sm">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  size="sm" 
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={generatingReport === report.id}
                  className="w-full bg-gold text-black hover:bg-gold/90"
                >
                  {generatingReport === report.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      {t('adminReportsGenerating')}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-1" />
                      {t('adminReportsGenerateAndDownload')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Reports */}
        <Card className="bg-black/40 border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold font-serif">{t('adminReportsGeneratedTitle')}</CardTitle>
            <CardDescription className="text-gold/60">
              {t('adminReportsGeneratedDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedReports.length === 0 ? (
              <div className="text-center py-8 text-gold/40">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('adminReportsNoReports')}</p>
                <p className="text-sm mt-1">{t('adminReportsNoReportsHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedReports.map((report, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold/10 hover:border-gold/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-gold/10">
                        <FileText className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <p className="text-gold font-medium text-sm">{report.name}</p>
                        <p className="text-gold/50 text-xs">{report.date} • {report.size}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadReport(report)}
                      className="text-gold hover:bg-gold/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
