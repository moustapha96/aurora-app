import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VerificationCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const token = searchParams.get("token");
    const verificationComplete = searchParams.get("verification") === "complete";

    // Si verification=complete, on redirige immédiatement vers login
    // tout en sauvegardant le statut en arrière-plan
    if (verificationComplete || token) {
      // Enregistrer le statut en arrière-plan (fire and forget)
      if (token) {
        supabase.functions.invoke("veriff-verification", {
          body: {
            action: "check-registration",
            registrationToken: token,
          },
        }).then(({ data, error }) => {
          if (error) {
            console.error("Error saving verification status:", error);
          } else {
            console.log("Verification status saved:", data?.status);
          }
        }).catch(err => {
          console.error("Error in verification callback:", err);
        });
      }

      // Déconnecter et rediriger immédiatement vers login
      toast.info(t('verificationSubmitted'));
      supabase.auth.signOut().finally(() => {
        navigate("/login", { replace: true });
      });
    } else {
      // Pas de token ni de verification=complete, retour au register
      navigate("/register", { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
        <p className="text-gold/70">{t('redirecting')}</p>
      </div>
    </main>
  );
}
