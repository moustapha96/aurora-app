import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Fingerprint, Smartphone, Monitor, Trash2, Plus, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const WebAuthnSetup = () => {
  const {
    isSupported,
    isPlatformAvailable,
    isEnabled,
    credentials,
    isLoading,
    register,
    removeCredential,
  } = useWebAuthn();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsRegistering(true);
    
    const result = await register();
    
    if (result.success) {
      toast.success("Authentification biométrique activée");
    } else {
      toast.error(result.error || "Erreur lors de l'activation");
    }
    
    setIsRegistering(false);
  };

  const handleDelete = async (credentialId: string) => {
    setDeletingId(credentialId);
    
    const success = await removeCredential(credentialId);
    
    if (success) {
      toast.success("Appareil supprimé");
    } else {
      toast.error("Erreur lors de la suppression");
    }
    
    setDeletingId(null);
  };

  const getDeviceIcon = (deviceName: string | null) => {
    if (!deviceName) return <Smartphone className="w-5 h-5" />;
    
    const name = deviceName.toLowerCase();
    if (name.includes('windows')) return <Monitor className="w-5 h-5" />;
    if (name.includes('mac') || name.includes('touch id')) return <Fingerprint className="w-5 h-5" />;
    if (name.includes('face id')) return <Fingerprint className="w-5 h-5" />;
    
    return <Smartphone className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Authentification Biométrique
          </CardTitle>
          <CardDescription>
            WebAuthn n'est pas supporté sur ce navigateur. Utilisez un navigateur moderne (Chrome, Safari, Firefox, Edge) pour activer cette fonctionnalité.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isPlatformAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-500" />
            Authentification Biométrique
          </CardTitle>
          <CardDescription>
            Aucun authentificateur biométrique détecté sur cet appareil. Assurez-vous que Touch ID, Face ID ou Windows Hello est configuré sur votre appareil.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Authentification Biométrique
          {isEnabled && (
            <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-500/20">
              Activée
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Sécurisez l'accès à votre compte avec Touch ID, Face ID ou Windows Hello. 
          Vos données biométriques restent sur votre appareil et ne sont jamais envoyées à nos serveurs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Registered devices */}
        {credentials.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Appareils enregistrés</h4>
            {credentials.map((cred) => (
              <div 
                key={cred.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(cred.device_name)}
                  <div>
                    <p className="text-sm font-medium">{cred.device_name || "Appareil"}</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouté le {format(new Date(cred.created_at), "d MMMM yyyy", { locale: fr })}
                      {cred.last_used_at && (
                        <> • Utilisé le {format(new Date(cred.last_used_at), "d MMM", { locale: fr })}</>
                      )}
                    </p>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingId === cred.id}
                    >
                      {deletingId === cred.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cet appareil ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Vous ne pourrez plus utiliser l'authentification biométrique depuis {cred.device_name || "cet appareil"}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(cred.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}

        {/* Add device button */}
        <Button
          onClick={handleRegister}
          disabled={isRegistering}
          variant={credentials.length > 0 ? "outline" : "default"}
          className="w-full gap-2"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {credentials.length > 0 ? "Ajouter un autre appareil" : "Activer l'authentification biométrique"}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Compatible avec Touch ID (Mac), Face ID, Windows Hello et les lecteurs d'empreintes
        </p>
      </CardContent>
    </Card>
  );
};
