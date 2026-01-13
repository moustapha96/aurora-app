import { Header } from "@/components/Header";
import { PageHeaderBackButton } from "@/components/BackButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { FamilyParrainage } from "@/components/family";

const Referrals = () => {
  const { t } = useLanguage();

  const handleUpdate = () => {
    // Callback pour rafraîchir les données si nécessaire
    // Le composant FamilyParrainage gère déjà son propre rafraîchissement
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <PageHeaderBackButton />
            <h1 className="text-2xl sm:text-3xl font-serif text-gold tracking-wide">{t('referralsTitle')}</h1>
          </div>
          <p className="text-gold/60 text-sm mt-1">{t('referralsDescription')}</p>
        </div>

        {/* FamilyParrainage Component - Complete referral system with links, statistics, and member management */}
        <FamilyParrainage 
          isEditable={true} 
          onUpdate={handleUpdate}
          userId={undefined}
        />
      </div>
    </div>
  );
};

export default Referrals;
