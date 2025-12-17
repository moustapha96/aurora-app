import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, CheckCircle, Clock, XCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { toast } from 'sonner';

export function IdentityVerification() {
  const { 
    verificationStatus, 
    profileVerification, 
    loading, 
    initiating, 
    initiateVerification,
    refreshStatus 
  } = useIdentityVerification();

  const handleStartVerification = async () => {
    const result = await initiateVerification();
    
    if (result.success && result.redirectUrl) {
      toast.success('Redirection vers Jumio...');
      // Open Jumio verification in new tab
      window.open(result.redirectUrl, '_blank');
    } else {
      toast.error(result.error || 'Erreur lors de l\'initialisation de la vérification');
    }
  };

  const getStatusBadge = () => {
    if (profileVerification.verified) {
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Vérifié
        </Badge>
      );
    }

    switch (verificationStatus.status) {
      case 'initiated':
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        );
      case 'review_needed':
        return (
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-500 border-orange-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Examen requis
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Non vérifié
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Vérification d'identité</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Vérifiez votre identité pour accéder à toutes les fonctionnalités de la plateforme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profileVerification.verified ? (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Identité vérifiée</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre identité a été vérifiée avec succès
              {profileVerification.verifiedAt && (
                <> le {new Date(profileVerification.verifiedAt).toLocaleDateString('fr-FR')}</>
              )}
              .
            </p>
            {verificationStatus.documentType && (
              <p className="text-sm text-muted-foreground mt-1">
                Document: {verificationStatus.documentType}
                {verificationStatus.documentCountry && ` (${verificationStatus.documentCountry})`}
              </p>
            )}
          </div>
        ) : verificationStatus.status === 'initiated' || verificationStatus.status === 'pending' ? (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
            <div className="flex items-center gap-2 text-yellow-500 mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Vérification en cours</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre vérification est en cours de traitement. Cela peut prendre quelques minutes.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={refreshStatus}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser le statut
            </Button>
          </div>
        ) : verificationStatus.status === 'rejected' ? (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Vérification rejetée</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Votre vérification n'a pas pu être validée. Vous pouvez réessayer avec un autre document.
            </p>
            <Button onClick={handleStartVerification} disabled={initiating}>
              {initiating ? 'Initialisation...' : 'Réessayer la vérification'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Pourquoi vérifier votre identité ?</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Accès complet à toutes les fonctionnalités</li>
                <li>Badge de membre vérifié sur votre profil</li>
                <li>Confiance accrue auprès des autres membres</li>
                <li>Protection contre l'usurpation d'identité</li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Documents acceptés</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Passeport</li>
                <li>Carte d'identité nationale</li>
                <li>Permis de conduire</li>
              </ul>
            </div>

            <Button 
              onClick={handleStartVerification} 
              disabled={initiating}
              className="w-full"
            >
              {initiating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Initialisation...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Démarrer la vérification
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              La vérification est sécurisée et effectuée par Jumio, leader mondial de la vérification d'identité.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
