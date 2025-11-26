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
      title: t('exceptionalTravel'),
      description: t('privateJetsYachts'),
      services: [
        t('privateJetCharter'),
        t('yachtRental'),
        t('ultraLuxuryHotels'),
        t('customTravel')
      ]
    },
    {
      icon: Calendar,
      title: t('privateEvents'),
      description: t('eventOrganization'),
      services: [
        t('galasPrivateParties'),
        t('prestigeWeddings'),
        t('extraordinaryBirthdays'),
        t('exclusiveCorporateEvents')
      ]
    },
    {
      icon: Utensils,
      title: t('gastronomy'),
      description: t('exceptionalCulinary'),
      services: [
        t('starredRestaurants'),
        t('privateChefs'),
        t('exclusiveTastings'),
        t('privateTables')
      ]
    },
    {
      icon: ShoppingBag,
      title: t('privateShopping'),
      description: t('privilegedAccess'),
      services: [
        t('dedicatedPersonalShopper'),
        t('privateCollections'),
        t('exclusivePrivateSales'),
        t('personalStyling')
      ]
    },
    {
      icon: Home,
      title: t('realEstateProperties'),
      description: t('residenceManagement'),
      services: [
        t('propertyManagement'),
        t('residentialConcierge'),
        t('maintenanceRenovation'),
        t('premiumDomesticServices')
      ]
    },
    {
      icon: Gem,
      title: t('artCollections'),
      description: t('artExpertise'),
      services: [
        t('artAcquisitionAdvice'),
        t('privateSalesAuctions'),
        t('collectionManagement'),
        t('expertiseAuthentication')
      ]
    },
    {
      icon: Car,
      title: t('automobile'),
      description: t('exceptionalVehicles'),
      services: [
        t('luxuryVehicleRental'),
        t('privateDrivers'),
        t('collectibleVehicleAcquisition'),
        t('premiumMaintenance')
      ]
    },
    {
      icon: Heart,
      title: t('wellnessHealth'),
      description: t('vipMedicalWellness'),
      services: [
        t('privateMedicalConsultations'),
        t('homeSpaWellness'),
        t('exclusivePersonalTraining'),
        t('customWellnessPrograms')
      ]
    },
    {
      icon: Briefcase,
      title: t('businessServices'),
      description: t('professionalExcellence'),
      services: [
        t('vipMeetingOrganization'),
        t('translationServices'),
        t('administrativeAssistance'),
        t('exclusiveNetworking')
      ]
    }
  ];

  const features = [
    {
      icon: Clock,
      title: t('availability247'),
      description: t('teamService')
    },
    {
      icon: Globe,
      title: t('globalNetwork'),
      description: t('excellenceNetwork')
    },
    {
      icon: Shield,
      title: t('absoluteConfidentiality'),
      description: t('discretionSecurity')
    },
    {
      icon: Sparkles,
      title: t('customMade'),
      description: t('uniqueAttention')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 pb-16">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 gradient-gold text-black-deep font-serif">
            {t('conciergePage')}
          </Badge>
          <h1 className="text-6xl md:text-7xl font-serif text-primary mb-6">
            {t('conciergePage')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('teamService')}
          </p>
          <Button variant="premium" size="lg" className="text-lg">
            {t('contactUs')}
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
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
        <div className="mb-16">
          <h2 className="text-4xl font-serif text-primary text-center mb-12">
            {t('conciergePage')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        <div className="text-center bg-card border border-primary/20 rounded-2xl p-12 aurora-glow">
          <h2 className="text-3xl font-serif text-primary mb-4">
            {t('uniqueAttention')}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('teamService')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="premium" size="lg">
              {t('contactUs')}
            </Button>
            <Button variant="luxury" size="lg">
              {t('continue')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Concierge;
