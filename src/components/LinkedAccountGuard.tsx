import React from "react";
import { useNavigate } from "react-router-dom";
import { useLinkedAccountRestrictions, canLinkedAccountAccess } from "@/hooks/useLinkedAccountRestrictions";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";

interface LinkedAccountGuardProps {
  section: string;
  children: React.ReactNode;
}

/**
 * Guard component that blocks linked accounts from accessing restricted sections.
 * Linked accounts can only view: Business, Family, Personal, Network
 * They cannot access: Concierge, Marketplace, Members
 */
export const LinkedAccountGuard: React.FC<LinkedAccountGuardProps> = ({ section, children }) => {
  const navigate = useNavigate();
  const { isLinkedAccount, loading } = useLinkedAccountRestrictions();

  // While loading, show nothing to prevent flash
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-24 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  // If linked account trying to access restricted section
  if (isLinkedAccount && !canLinkedAccountAccess(section)) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-24 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-xl font-semibold text-gold mb-3">Accès restreint</h2>
            <p className="text-muted-foreground mb-6">
              Votre compte associé ne vous permet pas d'accéder à cette section. 
              Contactez le membre principal pour plus d'informations.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Normal access
  return <>{children}</>;
};
