import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Shield, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Payment = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const badge = searchParams.get("badge") || "gold";
  const amount = searchParams.get("amount") || "0";

  const getBadgeInfo = (badgeType: string) => {
    switch (badgeType) {
      case "diamond":
        return { name: "Diamond", price: "5000", emoji: "💎" };
      case "platinum":
        return { name: "Platinum", price: "2500", emoji: "🏆" };
      case "gold":
        return { name: "Gold", price: "1000", emoji: "⭐" };
      default:
        return { name: "Standard", price: "0", emoji: "" };
    }
  };

  const badgeInfo = getBadgeInfo(badge);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/members")}
            className="text-muted-foreground hover:text-foreground mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Button>
          <h1 className="text-4xl font-serif text-primary tracking-wide">{t('payment')}</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Order Summary */}
          <Card className="bg-card border-border p-8">
            <h2 className="text-2xl font-serif text-primary mb-6">{t('orderSummary')}</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{badgeInfo.emoji}</span>
                  <div>
                    <p className="font-serif text-lg text-foreground">{t('level')} {badgeInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{t('monthlySubscription')}</p>
                  </div>
                </div>
                <p className="text-xl font-serif text-primary">{badgeInfo.price}€</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{t('accessMembers')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{t('unlimitedConnections')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{t('exclusiveServices')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{t('prioritySupport')}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <div className="flex justify-between text-lg font-serif mb-2">
                  <span className="text-foreground">{t('monthlyTotal')}</span>
                  <span className="text-primary">{badgeInfo.price}€</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('autoRenew')}</p>
              </div>
            </div>
          </Card>

          {/* Right Column - Payment Form */}
          <Card className="bg-card border-border p-8">
            <h2 className="text-2xl font-serif text-primary mb-6">{t('paymentInfo')}</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('cardNumber')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('cardExpirationDate')}
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('nameOnCard')}
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t('securePayment')}
                </p>
              </div>

              <Button
                variant="premium"
                className="w-full h-12 text-base font-serif"
                onClick={() => {
                  // TODO: Implement payment logic
                  alert(t('paymentSuccess'));
                  navigate("/profile");
                }}
              >
                {t('confirmPayment')} - {badgeInfo.price}€/mois
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
