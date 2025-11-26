import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Terms = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 pb-16 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl font-serif text-primary">
              {t('terms')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t('lastUpdated')}: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-sm max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptation des Conditions</h2>
              <p className="text-muted-foreground leading-relaxed">
                En accédant et en utilisant Aurora, vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Description du Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Aurora est un réseau professionnel exclusif qui permet à ses membres de :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Créer et maintenir un profil professionnel</li>
                <li>Se connecter avec d'autres membres du réseau</li>
                <li>Accéder à des services de conciergerie haut de gamme</li>
                <li>Participer à une marketplace de produits d'exception</li>
                <li>Échanger via messagerie sécurisée</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Éligibilité et Compte</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Pour utiliser Aurora, vous devez :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Avoir au moins 18 ans</li>
                <li>Fournir des informations exactes et complètes lors de votre inscription</li>
                <li>Maintenir la sécurité de votre compte et de votre mot de passe</li>
                <li>Nous informer immédiatement de toute utilisation non autorisée de votre compte</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Utilisation Acceptable</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Vous vous engagez à :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Ne pas publier de contenu illégal, diffamatoire ou offensant</li>
                <li>Respecter les droits de propriété intellectuelle d'autrui</li>
                <li>Ne pas utiliser le service à des fins de spam ou de harcèlement</li>
                <li>Ne pas tenter d'accéder de manière non autorisée à nos systèmes</li>
                <li>Maintenir un comportement professionnel et respectueux</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Propriété Intellectuelle</h2>
              <p className="text-muted-foreground leading-relaxed">
                Tout le contenu présent sur Aurora, incluant mais ne se limitant pas aux textes, graphiques, logos, 
                icônes, images, clips audio et vidéo, reste la propriété d'Aurora ou de ses concédants de licence. 
                Vous conservez la propriété du contenu que vous publiez, mais vous nous accordez une licence mondiale, 
                non exclusive, pour utiliser, reproduire et distribuer ce contenu dans le cadre de nos services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Confidentialité</h2>
              <p className="text-muted-foreground leading-relaxed">
                Votre utilisation d'Aurora est également régie par notre Politique de Confidentialité. 
                Nous nous engageons à protéger vos données personnelles conformément aux réglementations en vigueur, 
                notamment le RGPD pour les utilisateurs européens.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Services Payants</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certains services d'Aurora peuvent être soumis à des frais. Les modalités de paiement, 
                les tarifs et les conditions d'annulation seront clairement indiqués avant toute transaction. 
                Tous les paiements sont sécurisés et traités conformément aux normes de l'industrie.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Résiliation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vous pouvez résilier votre compte à tout moment. Aurora se réserve le droit de suspendre ou 
                résilier votre compte en cas de violation de ces conditions, sans préavis et sans responsabilité.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitation de Responsabilité</h2>
              <p className="text-muted-foreground leading-relaxed">
                Aurora est fourni "tel quel" sans garantie d'aucune sorte. Nous ne serons pas responsables 
                des dommages directs, indirects, accessoires ou consécutifs résultant de votre utilisation 
                ou de votre incapacité à utiliser nos services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Modifications des Conditions</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications 
                seront effectives dès leur publication sur cette page. Votre utilisation continue du service 
                après de telles modifications constitue votre acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Droit Applicable</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ces conditions sont régies par le droit français. Tout litige relatif à ces conditions 
                sera soumis à la compétence exclusive des tribunaux français.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pour toute question concernant ces Conditions Générales d'Utilisation, veuillez nous contacter à :
              </p>
              <div className="mt-3 text-muted-foreground">
                <p>Email : legal@aurora-network.com</p>
                <p>Adresse : [Adresse de l'entreprise]</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;
