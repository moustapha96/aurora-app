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
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section1_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section1_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section2_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                {t('terms_section2_intro')}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>{t('terms_section2_point1')}</li>
                <li>{t('terms_section2_point2')}</li>
                <li>{t('terms_section2_point3')}</li>
                <li>{t('terms_section2_point4')}</li>
                <li>{t('terms_section2_point5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section3_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                {t('terms_section3_intro')}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>{t('terms_section3_point1')}</li>
                <li>{t('terms_section3_point2')}</li>
                <li>{t('terms_section3_point3')}</li>
                <li>{t('terms_section3_point4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section4_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                {t('terms_section4_intro')}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>{t('terms_section4_point1')}</li>
                <li>{t('terms_section4_point2')}</li>
                <li>{t('terms_section4_point3')}</li>
                <li>{t('terms_section4_point4')}</li>
                <li>{t('terms_section4_point5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section5_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section5_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section6_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section6_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section7_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section7_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section8_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section8_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section9_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section9_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section10_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section10_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section11_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section11_body')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t('terms_section12_title')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('terms_section12_body')}
              </p>
              <div className="mt-3 text-muted-foreground">
                <p>Email : contact@aurorasociety.ch</p>
                <p>Adresse : 123 Rue de la Paix, 75000 Paris, France</p>
                <p>Téléphone : +33 1 XX XX XX XX</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;
