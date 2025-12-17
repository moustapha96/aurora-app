import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, AlertTriangle, FileText, Image, MessageSquare } from "lucide-react";

const AdminModeration = () => {
  // Placeholder data - would be fetched from database
  const pendingItems = [
    { id: 1, type: "profile", member: "Jean Dupont", content: "Mise à jour du profil", date: "2024-12-09", status: "pending" },
    { id: 2, type: "business", member: "Marie Martin", content: "Nouveau contenu business", date: "2024-12-08", status: "pending" },
    { id: 3, type: "image", member: "Pierre Bernard", content: "Photo de profil", date: "2024-12-08", status: "pending" },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "profile": return <FileText className="w-4 h-4" />;
      case "business": return <FileText className="w-4 h-4" />;
      case "image": return <Image className="w-4 h-4" />;
      case "message": return <MessageSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">En attente</Badge>;
      case "approved": return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approuvé</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejeté</Badge>;
      default: return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Modération</h1>
          <p className="text-muted-foreground">Gérez le contenu en attente de validation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approuvés (30j)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">45</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejetés (30j)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">2</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Signalements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">1</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">En attente (3)</TabsTrigger>
            <TabsTrigger value="approved">Approuvés</TabsTrigger>
            <TabsTrigger value="rejected">Rejetés</TabsTrigger>
            <TabsTrigger value="reported">Signalés</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <p className="font-medium">{item.member}</p>
                        <p className="text-sm text-muted-foreground">{item.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm" className="text-green-500 hover:text-green-600">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>Historique des contenus approuvés</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <p>Historique des contenus rejetés</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reported">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <p>Contenus signalés par les membres</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminModeration;
