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

const reportTypes = [
  {
    id: 'members',
    title: 'Rapport Membres',
    description: 'Liste complète des membres avec leurs informations',
    icon: Users,
    format: 'CSV'
  },
  {
    id: 'verifications',
    title: 'Rapport Vérifications',
    description: 'Statut des vérifications d\'identité',
    icon: Shield,
    format: 'CSV'
  },
  {
    id: 'connections',
    title: 'Rapport Connexions',
    description: 'Analyse du réseau et des connexions entre membres',
    icon: Users,
    format: 'CSV'
  },
  {
    id: 'activity',
    title: 'Rapport d\'Activité',
    description: 'Analyse des connexions et interactions des membres',
    icon: Activity,
    format: 'CSV'
  },
];

export default function AdminReports() {
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
        p.identity_verified ? 'Oui' : 'Non',
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
      f.business_access ? 'Oui' : 'Non',
      f.family_access ? 'Oui' : 'Non',
      f.personal_access ? 'Oui' : 'Non',
      f.influence_access ? 'Oui' : 'Non',
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
          throw new Error('Type de rapport inconnu');
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
      toast.success(`Rapport généré avec succès (${result.count} entrées)`);

    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadReport = (report: typeof generatedReports[0]) => {
    downloadCSV(report.data, report.name);
    toast.success('Téléchargement lancé');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif text-gold">Rapports</h1>
            <p className="text-gold/60">Générer et télécharger des rapports détaillés</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] border-gold/30 bg-black text-gold">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30">
                <SelectItem value="week" className="text-gold">Cette semaine</SelectItem>
                <SelectItem value="month" className="text-gold">Ce mois</SelectItem>
                <SelectItem value="quarter" className="text-gold">Ce trimestre</SelectItem>
                <SelectItem value="year" className="text-gold">Cette année</SelectItem>
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
                      Génération...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-1" />
                      Générer & Télécharger
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
            <CardTitle className="text-gold font-serif">Rapports Générés</CardTitle>
            <CardDescription className="text-gold/60">
              Télécharger les rapports générés durant cette session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedReports.length === 0 ? (
              <div className="text-center py-8 text-gold/40">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun rapport généré</p>
                <p className="text-sm mt-1">Cliquez sur "Générer" pour créer un rapport</p>
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
