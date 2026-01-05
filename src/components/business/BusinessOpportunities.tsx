import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronRight, Building2, Globe, Handshake } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

type CategoryType = 'offmarket' | 'immobilier' | 'participations' | 'clubdeals';

const getCategories = (t: (key: string) => string): { key: CategoryType; label: string; icon: React.ElementType; description: string }[] => [
  { key: 'offmarket', label: t('businessOffMarketDeals'), icon: TrendingUp, description: t('businessOffMarketDesc') },
  { key: 'immobilier', label: t('businessInternationalRealEstate'), icon: Building2, description: t('businessRealEstateDesc') },
  { key: 'participations', label: t('businessPrivateEquity'), icon: Globe, description: t('businessPrivateEquityDesc') },
  { key: 'clubdeals', label: t('businessClubDeals'), icon: Handshake, description: t('businessClubDealsDesc') },
];

export const BusinessOpportunities = () => {
  const { t } = useLanguage();
  const CATEGORIES = getCategories(t);
  const [expandedCategory, setExpandedCategory] = useState<CategoryType | null>(null);
  const [userDescriptions, setUserDescriptions] = useState<Record<CategoryType, string>>({
    offmarket: '',
    immobilier: '',
    participations: '',
    clubdeals: ''
  });

  const handleCategoryClick = (category: CategoryType) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  const handleDescriptionChange = (category: CategoryType, value: string) => {
    setUserDescriptions(prev => ({ ...prev, [category]: value }));
  };

  return (
    <div className="module-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
          <TrendingUp className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gold">{t("businessOpportunities")}</h3>
          <p className="text-sm text-gold/60">{t("businessPrivilegedAccess")}</p>
        </div>
      </div>

      <p className="text-gold/80 text-sm mb-4">{t("businessOpportunitiesDesc")}</p>

      <div className="space-y-2">
        {CATEGORIES.map(({ key, label, icon: Icon, description }) => (
          <div key={key}>
            <button 
              onClick={() => handleCategoryClick(key)}
              className="flex items-center gap-2 text-gold/70 hover:text-gold transition-colors w-full group py-1.5"
            >
              {expandedCategory === key ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </button>
            {expandedCategory === key && (
              <div className="ml-6 mt-1 mb-2 p-3 bg-gold/5 rounded-lg border border-gold/10 space-y-3">
                <p className="text-sm text-gold/70">{description}</p>
                <Textarea
                  value={userDescriptions[key]}
                  onChange={(e) => handleDescriptionChange(key, e.target.value)}
                  placeholder={t("businessDescribeInterests")}
                  className="min-h-[80px] bg-black/20 border-gold/20 text-gold placeholder:text-gold/40 text-sm resize-none focus:ring-1 focus:ring-gold/30"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-gold/50 italic text-xs pt-3 mt-2 border-t border-gold/10">
        {t("businessRightProject")}
      </p>
    </div>
  );
};
