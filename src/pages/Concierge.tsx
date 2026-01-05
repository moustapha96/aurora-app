import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Plane, 
  Home, 
  Utensils, 
  Heart,
  Users
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageNavigation } from "@/components/BackButton";
import { LinkedAccountGuard } from "@/components/LinkedAccountGuard";

const ConciergeContent = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const domaines = [
    {
      icon: Plane,
      title: t('travelMobility'),
      points: [
        t('travelMobilityP1'),
        t('travelMobilityP2'),
        t('travelMobilityP3')
      ]
    },
    {
      icon: Home,
      title: t('luxuryRealEstate'),
      points: [
        t('luxuryRealEstateP1'),
        t('luxuryRealEstateP2')
      ]
    },
    {
      icon: Utensils,
      title: t('artOfLiving'),
      points: [
        t('artOfLivingP1'),
        t('artOfLivingP2')
      ]
    },
    {
      icon: Heart,
      title: t('healthSerenity'),
      points: [
        t('healthSerenityP1'),
        t('healthSerenityP2')
      ]
    }
  ];

  const handleContactConcierge = () => {
    navigate("/contact");
  };

  return (
    <div className="min-h-screen bg-background safe-area-all">
      <Header />
      <PageNavigation to="/member-card" />
      
      <main className="pt-32 sm:pt-36 pb-16">

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 text-center mb-20 sm:mb-28">
          <div className="max-w-[700px] mx-auto">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 font-sans text-xs tracking-wide">
              {t('conciergeBadge')}
            </Badge>
            
            <div className="mb-14 space-y-4">
              <p className="text-xl sm:text-2xl font-serif text-primary uppercase tracking-wide">
                {t('luxuryOfTime')}
              </p>
              <p className="text-xl sm:text-2xl font-serif text-primary uppercase tracking-wide">
                {t('dailyFluidity')}
              </p>
              <p className="text-xl sm:text-2xl font-serif text-primary uppercase tracking-wide">
                {t('peaceOfMind')}
              </p>
            </div>
            
            <p className="text-base sm:text-lg text-foreground/80 mb-6 leading-relaxed">
              {t('conciergeHeroDesc')}
            </p>
            
            <p className="text-lg sm:text-xl font-serif text-primary mb-12">
              {t('singleContact')}
            </p>
            
            <Button 
              variant="premium" 
              size="lg" 
              onClick={handleContactConcierge}
              className="text-sm sm:text-base"
            >
              {t('contactYourConcierge')}
            </Button>
          </div>
        </section>

        {/* Notre rôle */}
        <section className="container mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <div className="max-w-[800px] mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-serif text-primary mb-6">
              {t('ourWayToServe')}
            </h2>
            
            <div className="text-foreground/80 leading-relaxed">
              <p className="text-sm sm:text-base">
                {t('noServiceCatalog')}
              </p>
            </div>
          </div>
        </section>

        {/* Domaines d'expertise */}
        <section className="container mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <div className="max-w-[900px] mx-auto">
            <h2 className="text-xl sm:text-2xl font-serif text-primary text-center mb-12">
              {t('expertiseDomains')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
              {domaines.map((domaine, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center">
                      <domaine.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-sans font-medium text-foreground mb-3">
                      {domaine.title}
                    </h3>
                    <ul className="space-y-2">
                      {domaine.points.map((point, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground leading-relaxed flex items-start">
                          <span className="text-primary/60 mr-2 mt-1.5 w-1 h-1 rounded-full bg-primary/60 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Projets familiaux - centré en bas */}
            <div className="flex justify-center">
              <div className="flex gap-4 max-w-md">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-sans font-medium text-foreground mb-3">
                    {t('familyProjects')}
                  </h3>
                  <ul className="space-y-2">
                    <li className="text-sm text-muted-foreground leading-relaxed flex items-start">
                      <span className="text-primary/60 mr-2 mt-1.5 w-1 h-1 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>{t('familyProjectsP1')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nos engagements */}
        <section className="container mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-xl sm:text-2xl font-serif text-primary text-center mb-12">
              {t('fourCommitments')}
            </h2>
            
            <div className="max-w-[800px] mx-auto space-y-10 text-foreground/80 leading-relaxed">
              <div>
                <p className="font-sans font-medium text-foreground text-base sm:text-lg mb-2">
                  {t('availability247')}
                </p>
                <p className="text-sm sm:text-base">
                  {t('availability247Desc')}
                </p>
              </div>
              
              <div>
                <p className="font-sans font-medium text-foreground text-base sm:text-lg mb-2">
                  {t('globalNetworkEngagement')}
                </p>
                <p className="text-sm sm:text-base">
                  {t('globalNetworkEngagementDesc')}
                </p>
              </div>
              
              <div>
                <p className="font-sans font-medium text-foreground text-base sm:text-lg mb-2">
                  {t('absoluteConfidentialityEngagement')}
                </p>
                <p className="text-sm sm:text-base">
                  {t('absoluteConfidentialityEngagementDesc')}
                </p>
              </div>
              
              <div>
                <p className="font-sans font-medium text-foreground text-base sm:text-lg mb-2">
                  {t('realBespoke')}
                </p>
                <p className="text-sm sm:text-base">
                  {t('realBespokeDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-[700px] mx-auto text-center">
            <Button 
              variant="premium" 
              size="lg" 
              onClick={handleContactConcierge}
              className="text-sm sm:text-base px-10 py-6"
            >
              {t('contactYourConcierge')}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

const Concierge = () => {
  return (
    <LinkedAccountGuard section="concierge">
      <ConciergeContent />
    </LinkedAccountGuard>
  );
};

export default Concierge;
