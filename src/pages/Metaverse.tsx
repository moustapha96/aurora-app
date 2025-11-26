import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Layers, Zap, Users, Palette } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Metaverse = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const partners = [
    {
      name: "MetaLux Environments",
      description: "Créateurs d'espaces virtuels immersifs de luxe pour événements exclusifs",
      services: ["Galeries d'art virtuelles", "Salons privés 3D", "Événements immersifs"]
    },
    {
      name: "VirtuElite Experiences",
      description: "Plateforme premium pour rencontres et networking dans le métavers",
      services: ["Espaces de networking", "Conférences VR", "Showrooms virtuels"]
    },
    {
      name: "Digital Prestige Worlds",
      description: "Conception d'univers virtuels personnalisés pour membres d'élite",
      services: ["Propriétés virtuelles", "Collections NFT", "Expériences sur-mesure"]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <main className="container mx-auto px-6">
        <h1 className="text-9xl font-serif text-primary text-center">
          {t('metaversePage')}
        </h1>
      </main>
    </div>
  );
};

export default Metaverse;
