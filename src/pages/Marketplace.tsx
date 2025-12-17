import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Watch, Palette, Plane, Gem, Home, Wine, Package, Crown, Sparkles, ArrowLeft, Shield, Lock, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Marketplace = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const productCategories = [
    {
      icon: Home,
      name: "Immobilier d'Exception",
      description: "Propriétés rares et off-market",
      itemCount: "Domaines privés, îles, hôtels"
    },
    {
      icon: Plane,
      name: "Jets, Yachts & Véhicules Rares",
      description: "Aviation privée et nautisme de prestige",
      itemCount: "Sélection exclusive"
    },
    {
      icon: Palette,
      name: "Art",
      description: "Œuvres d'art et pièces de collection",
      itemCount: "Sélection authentifiée"
    },
    {
      icon: Watch,
      name: "Montres de Prestige",
      description: "Pièces rares et éditions limitées",
      itemCount: "Collections exclusives"
    },
    {
      icon: Gem,
      name: "Joaillerie",
      description: "Créations uniques et pierres précieuses",
      itemCount: "Haute joaillerie"
    },
    {
      icon: Wine,
      name: "Vins & Domaines Viticoles",
      description: "Millésimes exceptionnels et propriétés",
      itemCount: "Sélection premium"
    },
    {
      icon: Crown,
      name: "Investissements Privés",
      description: "Opportunités exclusives entre membres",
      itemCount: "Club deals"
    },
    {
      icon: Package,
      name: "Objets Rares",
      description: "Pièces uniques et éditions limitées",
      itemCount: "Sélection confidentielle"
    }
  ];

  const featuredProducts = [
    {
      category: "Horlogerie",
      name: "Patek Philippe Nautilus 5711/1A",
      price: "€180,000",
      badge: "Rare",
      description: "Édition limitée, état neuf avec certificat d'authenticité"
    },
    {
      category: "Art",
      name: "Jean-Michel Basquiat - Untitled",
      price: "€2,400,000",
      badge: "Exclusif",
      description: "Œuvre originale 1982, provenance vérifiée"
    },
    {
      category: "Automobile",
      name: "Ferrari LaFerrari Aperta",
      price: "€4,200,000",
      badge: "1 sur 209",
      description: "Seulement 350 km, configuration unique"
    },
    {
      category: "Joaillerie",
      name: "Diamant rose 5.12 carats",
      price: "€5,800,000",
      badge: "Certifié GIA",
      description: "Couleur Fancy Vivid Pink, pureté VVS1"
    },
    {
      category: "Immobilier",
      name: "Penthouse Monaco - Monte Carlo",
      price: "€28,000,000",
      badge: "Vue mer",
      description: "450m², terrasse 200m², accès privé"
    },
    {
      category: "Vin",
      name: "Château Lafite Rothschild 1945",
      price: "€42,000",
      badge: "Millésime légendaire",
      description: "Provenance parfaite, cave climatisée"
    }
  ];

  const marketplaceFeatures = [
    {
      icon: CheckCircle,
      title: "Sélectionné",
      description: "Chaque actif est rigoureusement vérifié et authentifié"
    },
    {
      icon: Lock,
      title: "Documenté",
      description: "Traçabilité complète et provenance certifiée"
    },
    {
      icon: Shield,
      title: "Sécurisé",
      description: "Transactions confidentielles et garanties"
    },
    {
      icon: Sparkles,
      title: "Présenté avec sobriété",
      description: "Le rare n'est pas exposé, il se transmet entre membres"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 pt-24 pb-16">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Marketplace Privée
          </Badge>
          <h1 className="text-5xl md:text-6xl font-serif text-foreground mb-6">
            Accès discret à des actifs rares
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Une marketplace privée réservée aux membres, dédiée à la transaction d'actifs rares et off-market.
          </p>
          <p className="text-lg text-muted-foreground/70 max-w-2xl mx-auto mb-8 italic">
            Le rare n'est pas affiché. Il se transmet.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {marketplaceFeatures.map((feature, index) => (
            <Card key={index} className="border-border bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif text-foreground mb-8">Catégories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productCategories.map((category, index) => (
              <Card 
                key={index}
                className="group cursor-pointer border-border hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors w-fit">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">{category.itemCount}</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif text-foreground">Sélection du Moment</h2>
            <Button variant="outline" className="border-primary/30 hover:border-primary">
              Voir tout
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product, index) => (
              <Card 
                key={index}
                className="group cursor-pointer border-border hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-xl"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {product.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {product.description}
                  </CardDescription>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-2xl font-serif text-primary">{product.price}</p>
                    <Button size="sm" variant="ghost" className="group-hover:text-primary">
                      Détails →
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center py-12">
            <CardTitle className="text-3xl font-serif mb-4">
              Une demande particulière ?
            </CardTitle>
            <CardDescription className="text-lg mb-6 max-w-2xl mx-auto">
              Notre équipe de sourcing est à votre disposition pour rechercher et acquérir les pièces les plus rares selon vos critères
            </CardDescription>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Contacter le Service de Sourcing
            </Button>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
};

export default Marketplace;
