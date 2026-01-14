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
      

      <div className="border-b border-border p-4 sm:p-6 bg-card mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-2">
              {/* <PageHeaderBackButton to={id ? `/profile/${id}` : "/profile"} /> */}
              <PageHeaderBackButton to={"/member-card"} />
              <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-gold tracking-wide">{t('referralsTitle')}</h1>
              <p className="text-gold/60 text-sm mt-1">{t('referralsDescription')}</p>
              </div>
            </div>
          </div>
        </div>


      <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-12 overflow-x-hidden">


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
