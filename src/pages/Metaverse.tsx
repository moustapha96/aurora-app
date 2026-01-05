import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Layers, Zap, Users, Palette } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageNavigation } from "@/components/BackButton";

const Metaverse = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const partners = [
    {
      name: t('metaversePartner1Name'),
      description: t('metaversePartner1Desc'),
      services: [t('metaversePartner1Service1'), t('metaversePartner1Service2'), t('metaversePartner1Service3')]
    },
    {
      name: t('metaversePartner2Name'),
      description: t('metaversePartner2Desc'),
      services: [t('metaversePartner2Service1'), t('metaversePartner2Service2'), t('metaversePartner2Service3')]
    },
    {
      name: t('metaversePartner3Name'),
      description: t('metaversePartner3Desc'),
      services: [t('metaversePartner3Service1'), t('metaversePartner3Service2'), t('metaversePartner3Service3')]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Header />
      <PageNavigation to="/member-card" />
      <main className="container mx-auto px-6 pt-32 sm:pt-36">
        <h1 className="text-9xl font-serif text-primary text-center">
          {t('metaversePage')}
        </h1>
      </main>
    </div>
  );
};

export default Metaverse;
