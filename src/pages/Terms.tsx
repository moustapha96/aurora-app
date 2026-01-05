"use client"

import { Header } from "@/components/Header"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageNavigation } from "@/components/BackButton"
import { useLanguage } from "@/contexts/LanguageContext"

const Terms = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageNavigation />

      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 max-w-4xl">
        <Card className="border-primary/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl font-serif text-primary">{t("termsTitle")}</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {t("lastUpdated")}: {new Date().toLocaleDateString(t("locale") || "fr-FR")}
            </p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none space-y-6 sm:space-y-8 p-4 sm:p-6">
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                1. {t("termsSection1Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection1Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                2. {t("termsSection2Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-2">
                {t("termsSection2Intro")}
              </p>
              <ul className="list-disc pl-4 sm:pl-6 text-sm sm:text-base text-muted-foreground space-y-1">
                <li>{t("termsSection2Item1")}</li>
                <li>{t("termsSection2Item2")}</li>
                <li>{t("termsSection2Item3")}</li>
                <li>{t("termsSection2Item4")}</li>
                <li>{t("termsSection2Item5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                3. {t("termsSection3Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-2">
                {t("termsSection3Intro")}
              </p>
              <ul className="list-disc pl-4 sm:pl-6 text-sm sm:text-base text-muted-foreground space-y-1">
                <li>{t("termsSection3Item1")}</li>
                <li>{t("termsSection3Item2")}</li>
                <li>{t("termsSection3Item3")}</li>
                <li>{t("termsSection3Item4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                4. {t("termsSection4Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-2">
                {t("termsSection4Intro")}
              </p>
              <ul className="list-disc pl-4 sm:pl-6 text-sm sm:text-base text-muted-foreground space-y-1">
                <li>{t("termsSection4Item1")}</li>
                <li>{t("termsSection4Item2")}</li>
                <li>{t("termsSection4Item3")}</li>
                <li>{t("termsSection4Item4")}</li>
                <li>{t("termsSection4Item5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                5. {t("termsSection5Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection5Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                6. {t("termsSection6Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection6Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                7. {t("termsSection7Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection7Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                8. {t("termsSection8Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection8Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                9. {t("termsSection9Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection9Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                10. {t("termsSection10Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection10Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                11. {t("termsSection11Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection11Content")}</p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">
                12. {t("termsSection12Title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t("termsSection12Content")}</p>
              <div className="mt-3 text-sm sm:text-base text-muted-foreground">
                <p>{t("email")}: contact@aurorasociety.ch</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default Terms
