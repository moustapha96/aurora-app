import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { PageHeaderBackButton } from "@/components/BackButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, CreditCard } from "lucide-react";

export const SUBSCRIPTION_CHECKOUT_STORAGE_KEY = "subscription_checkout_url";

const SubscriptionCheckout = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutUrl =
    (location.state as { checkoutUrl?: string })?.checkoutUrl ||
    sessionStorage.getItem(SUBSCRIPTION_CHECKOUT_STORAGE_KEY);

  useEffect(() => {
    if (!checkoutUrl) {
      navigate("/subscription", { replace: true });
      return;
    }
    sessionStorage.removeItem(SUBSCRIPTION_CHECKOUT_STORAGE_KEY);
    window.location.href = checkoutUrl;
  }, [checkoutUrl, navigate]);

  if (!checkoutUrl) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b border-border p-4 sm:p-6 bg-card mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-2">
            <PageHeaderBackButton to="/subscription" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-12 flex flex-col items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold" />
          <div className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5 text-gold" />
            <p className="text-lg">{t("redirectingToPayment")}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("pleaseWaitOrRetry")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
