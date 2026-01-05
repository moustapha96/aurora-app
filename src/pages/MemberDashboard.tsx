"use client"

import type React from "react"
import { AuroraLogo } from "@/components/AuroraLogo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import {
  Briefcase,
  Users,
  Palette,
  Trophy,
  ShoppingBag,
  Sparkles,
  LogOut,
  Settings,
  MessageSquare,
  Layout,
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface DashboardCardProps {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
  onClick: () => void
}

const DashboardCard = ({ icon: Icon, title, description, gradient, onClick }: DashboardCardProps) => (
  <Card
    className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-premium border-gold/20 bg-gradient-to-br ${gradient} backdrop-blur-sm`}
    onClick={onClick}
  >
    <CardContent className="p-4 sm:p-6 h-36 sm:h-40 flex flex-col justify-between">
      <div className="space-y-2 sm:space-y-3">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gold group-hover:text-gold-light transition-colors" />
        <div>
          <h3 className="font-serif text-base sm:text-lg text-gold-light group-hover:text-gold transition-colors">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gold-light/70 mt-1 line-clamp-2">{description}</p>
        </div>
      </div>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
    </CardContent>
  </Card>
)

const MemberDashboard = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const dashboardItems = [
    {
      icon: Briefcase,
      title: t("dashboardBusinessCareer"),
      description: t("dashboardBusinessDesc"),
      gradient: "from-black-deep/80 via-black-medium/60 to-gold/10",
      route: "/member/business",
    },
    {
      icon: Users,
      title: t("dashboardFamilyNetwork"),
      description: t("dashboardFamilyDesc"),
      gradient: "from-black-deep/80 via-blue-950/40 to-black-medium/60",
      route: "/member/network",
    },
    {
      icon: Palette,
      title: t("dashboardPassionsArts"),
      description: t("dashboardPassionsDesc"),
      gradient: "from-black-deep/80 via-red-950/40 to-black-medium/60",
      route: "/member/arts",
    },
    {
      icon: Trophy,
      title: t("dashboardSportsLifestyle"),
      description: t("dashboardSportsDesc"),
      gradient: "from-black-deep/80 via-green-950/40 to-black-medium/60",
      route: "/member/lifestyle",
    },
    {
      icon: ShoppingBag,
      title: t("dashboardConciergeMarketplace"),
      description: t("dashboardConciergeDesc"),
      gradient: "from-black-deep/80 via-black-light/40 to-gold/10",
      route: "/member/concierge",
    },
    {
      icon: Sparkles,
      title: t("dashboardMetaverse"),
      description: t("dashboardMetaverseDesc"),
      gradient: "from-black-deep/80 via-purple-950/40 to-black-medium/60",
      route: "/member/metaverse",
    },
    {
      icon: MessageSquare,
      title: t("messaging"),
      description: t("dashboardMessagingDesc"),
      gradient: "from-black-deep/80 via-cyan-950/40 to-black-medium/60",
      route: "/messages",
    },
    {
      icon: Layout,
      title: t("landingPages"),
      description: t("dashboardLandingDesc"),
      gradient: "from-black-deep/80 via-amber-950/40 to-gold/10",
      route: "/landing-preview",
    },
  ]

  const handleLogout = () => {
    navigate("/login")
  }

  return (
    <div className="min-h-screen gradient-dark">
      <div className="absolute inset-0 aurora-glow opacity-20"></div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-gold/20">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <AuroraLogo className="h-8 sm:h-10 w-auto" />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button variant="ghost" size="icon" className="text-gold-light hover:text-gold h-9 w-9 sm:h-10 sm:w-10">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-gold-light border-gold/30 hover:bg-gold/10 h-9 text-xs sm:text-sm bg-transparent"
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{t("logout")}</span>
            <span className="sm:hidden">Exit</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {dashboardItems.map((item, index) => (
              <DashboardCard
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                gradient={item.gradient}
                onClick={() => navigate(item.route)}
              />
            ))}
          </div>

          {/* Status Tags */}
          <div className="mt-8 sm:mt-12 flex flex-wrap gap-2 sm:gap-3 justify-center px-4">
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gold/20 text-gold text-xs sm:text-sm font-medium rounded-full border border-gold/30">
              {t("influencer")}
            </span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gold/20 text-gold text-xs sm:text-sm font-medium rounded-full border border-gold/30">
              {t("patronLabel")}
            </span>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gold/20 text-gold text-xs sm:text-sm font-medium rounded-full border border-gold/30">
              {t("visionary")}
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MemberDashboard
