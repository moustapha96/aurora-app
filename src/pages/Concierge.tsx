import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Plane, 
  Calendar, 
  ShoppingBag, 
  Home, 
  Utensils, 
  Gem,
  Clock,
  Globe,
  Shield,
  Sparkles,
  Car,
  Heart,
  Briefcase,
  ArrowLeft
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Concierge = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const serviceCategories = [
    {
      icon: Plane,
      title: "Voyages & Mobilité",
      description: "Jets privés, yachts, villas, hôtels rares",
      services: [
        "Jets privés",
        "Yachts et super-yachts",
        "Villas de prestige",
        "Voyages sur mesure ultra-discrets"
      ]
    },
    {
      icon: Home,
      title: "Immobilier de Prestige",
      description: "Propriétés d'exception hors des circuits publics",
      services: [
        "Villas off-market",
        "Domaines privés",
        "Pieds-à-terre internationaux",
        "Conseil en acquisition"
      ]
    },
    {
      icon: Utensils,
      title: "Art de Vivre",
      description: "Expériences culturelles et gastronomiques uniques",
      services: [
        "Dîners privés exclusifs",
        "Accès backstage",
        "Expériences culturelles uniques",
        "Tables étoilées réservées"
      ]
    },
    {
      icon: Heart,
      title: "Santé & Longévité Premium",
      description: "Services médicaux et bien-être de pointe",
      services: [
        "Médecins internationaux",
        "Bilans de santé premium",
        "Cliniques privées de pointe",
        "Médecine de prévention et anti-âge",
        "Retraites bien-être ultra haut de gamme",
        "Coaching santé discret"
      ]
    },
    {
      icon: Briefcase,
      title: "Éducation & Héritiers",
      description: "Accompagnement des nouvelles générations",
      services: [
        "Écoles et universités internationales",
        "Mentors d'excellence",
        "Orientation éducative haut de gamme",
        "Accès progressif à l'écosystème"
      ]
    },
    {
      icon: Calendar,
      title: "Événements Privés",
      description: "Organisation d'événements d'exception",
      services: [
        "Galas et soirées privées",
        "Mariages de prestige",
        "Anniversaires extraordinaires",
        "Événements corporatifs exclusifs"
      ]
    },
    {
      icon: ShoppingBag,
      title: "Shopping Privé",
      description: "Accès privilégié aux maisons de luxe",
      services: [
        "Personal shopper dédié",
        "Accès collections privées",
        "Ventes privées exclusives",
        "Stylisme personnel"
      ]
    },
    {
      icon: Gem,
      title: "Art & Collections",
      description: "Expertise et acquisitions d'œuvres d'art",
      services: [
        "Conseil en acquisition d'art",
        "Accès ventes privées et enchères",
        "Gestion de collections",
        "Expertise et authentification"
      ]
    },
    {
      icon: Car,
      title: "Automobile",
      description: "Véhicules d'exception et services",
      services: [
        "Location de véhicules de luxe",
        "Chauffeurs privés",
        "Acquisition de véhicules de collection",
        "Maintenance et entretien premium"
      ]
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "Disponibilité 24/7",
      description: "Notre équipe est à votre service jour et nuit, partout dans le monde"
    },
    {
      icon: Globe,
      title: "Réseau Mondial",
      description: "Accès à un réseau d'excellence dans plus de 100 villes"
    },
    {
      icon: Shield,
      title: "Confidentialité Absolue",
      description: "Discrétion et sécurité garanties pour tous vos services"
    },
    {
      icon: Sparkles,
      title: "Sur-Mesure",
      description: "Chaque demande est unique et mérite une attention personnalisée"
    }
  ];

  return (
    <div className="min-h-screen bg-background safe-area-all">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-16">
          <Badge className="mb-4 gradient-gold text-black-deep font-serif">
            Luxe, Art de Vivre & Santé Premium
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-primary mb-4 sm:mb-6">
            Le luxe du temps, de la fluidité et de la tranquillité
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Un service de conciergerie ultra haut de gamme pour organiser, simplifier et sublimer la vie de nos membres.
          </p>
          <p className="text-sm sm:text-lg text-muted-foreground/70 max-w-2xl mx-auto mb-6 sm:mb-8 italic">
            Un seul interlocuteur pour tout ce qui compte réellement.
          </p>
          <Button variant="premium" size="lg" className="text-base sm:text-lg">
            Contacter votre concierge
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="border-primary/20 aurora-glow hover:border-primary/50 transition-luxury">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full border border-primary/30">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg font-serif">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Services */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-serif text-primary text-center mb-8 sm:mb-12">
            Nos Services d'Excellence
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {serviceCategories.map((category, index) => (
              <Card key={index} className="group border-primary/20 aurora-glow hover:border-primary/50 transition-luxury cursor-pointer">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full border border-primary/30 group-hover:border-primary transition-luxury">
                      <category.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-2xl font-serif group-hover:text-primary transition-luxury">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.services.map((service, idx) => (
                      <li key={idx} className="flex items-start text-sm text-muted-foreground">
                        <span className="text-primary mr-2">•</span>
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card border border-primary/20 rounded-2xl p-6 sm:p-12 aurora-glow">
          <h2 className="text-2xl sm:text-3xl font-serif text-primary mb-4">
            Prêt à vivre une expérience d'exception ?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Notre équipe de concierges experts est à votre disposition pour concrétiser 
            vos demandes les plus exigeantes, où que vous soyez dans le monde.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button variant="premium" size="lg">
              Contactez votre concierge
            </Button>
            <Button variant="luxury" size="lg">
              En savoir plus
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Concierge;
