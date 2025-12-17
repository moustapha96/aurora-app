import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Users, Gift, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

interface ReferredMember {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  createdAt: string;
}

const Referrals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referredMembers, setReferredMembers] = useState<ReferredMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get user's profile with referral code
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Generate referral code if not exists
      let code = profile?.referral_code;
      if (!code) {
        code = generateReferralCode();
        await supabase
          .from("profiles")
          .update({ referral_code: code })
          .eq("id", user.id);
      }
      setReferralCode(code);

      // Get members who used this referral code
      const { data: referred, error: referredError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, created_at")
        .eq("referral_code", code)
        .neq("id", user.id);

      if (referredError) throw referredError;

      setReferredMembers(
        (referred || []).map(m => ({
          id: m.id,
          firstName: m.first_name,
          lastName: m.last_name,
          avatarUrl: m.avatar_url,
          createdAt: m.created_at || "",
        }))
      );
    } catch (error) {
      console.error("Error loading referral data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de parrainage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "AURORA-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: "Code copié !",
        description: "Le code de parrainage a été copié dans le presse-papiers",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code",
        variant: "destructive",
      });
    }
  };

  const shareReferralLink = async () => {
    const shareUrl = `${window.location.origin}/register?ref=${referralCode}`;
    const shareData = {
      title: "Rejoignez Aurora Society",
      text: `Je vous invite à rejoindre Aurora Society, un cercle exclusif pour les membres d'élite. Utilisez mon code de parrainage : ${referralCode}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Lien copié !",
          description: "Le lien de parrainage a été copié",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Parrainage</h1>
            <p className="text-muted-foreground">Invitez de nouveaux membres et suivez vos parrainages</p>
          </div>
        </div>

        {/* Referral Code Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Votre Code de Parrainage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  value={referralCode}
                  readOnly
                  className="text-center text-xl font-mono font-bold tracking-wider bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" className="flex-1 sm:flex-none">
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copié" : "Copier"}
                </Button>
                <Button onClick={shareReferralLink} className="flex-1 sm:flex-none">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Partagez ce code avec vos contacts pour les inviter à rejoindre Aurora Society.
              Ils devront l'entrer lors de leur inscription.
            </p>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{referredMembers.length}</p>
                  <p className="text-sm text-muted-foreground">Membres parrainés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{referredMembers.length}</p>
                  <p className="text-sm text-muted-foreground">Inscriptions confirmées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Gift className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {referredMembers.length >= 5 ? "Gold" : referredMembers.length >= 3 ? "Silver" : "Bronze"}
                  </p>
                  <p className="text-sm text-muted-foreground">Statut parrain</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referred Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres Parrainés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Aucun membre parrainé</h3>
                <p className="text-muted-foreground">
                  Partagez votre code de parrainage pour inviter de nouveaux membres
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/profile/${member.id}`)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.firstName[0]}{member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Inscrit le {formatDate(member.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Referrals;
