"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { Users, UserPlus, Link2, Activity, TrendingUp, AlertCircle, ShieldCheck, ShieldX } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "@/contexts/LanguageContext"

interface DashboardStats {
  totalMembers: number
  newMembersThisMonth: number
  totalConnections: number
  activeToday: number
  pendingRequests: number
  adminCount: number
  verifiedIdentities: number
  unverifiedIdentities: number
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    newMembersThisMonth: 0,
    totalConnections: 0,
    activeToday: 0,
    pendingRequests: 0,
    adminCount: 0,
    verifiedIdentities: 0,
    unverifiedIdentities: 0,
  })
  const [recentMembers, setRecentMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get total members
      const { count: totalMembers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      // Get new members this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: newMembersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString())

      // Get total connections
      const { count: totalConnections } = await supabase.from("friendships").select("*", { count: "exact", head: true })

      // Get pending connection requests
      const { count: pendingRequests } = await supabase
        .from("connection_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      // Get admin count
      const { count: adminCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")

      // Get verified identities count
      const { count: verifiedIdentities } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("identity_verified", true)

      // Get unverified identities count
      const { count: unverifiedIdentities } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .or("identity_verified.is.null,identity_verified.eq.false")

      // Get recent members
      const { data: recent } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

      setStats({
        totalMembers: totalMembers || 0,
        newMembersThisMonth: newMembersThisMonth || 0,
        totalConnections: Math.floor((totalConnections || 0) / 2), // Divide by 2 for bidirectional
        activeToday: 0, // Would need activity tracking
        pendingRequests: pendingRequests || 0,
        adminCount: adminCount || 0,
        verifiedIdentities: verifiedIdentities || 0,
        unverifiedIdentities: unverifiedIdentities || 0,
      })

      setRecentMembers(recent || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: t("adminTotalMembers"),
      value: stats.totalMembers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("adminNewThisMonth"),
      value: stats.newMembersThisMonth,
      icon: UserPlus,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: t("adminConnections"),
      value: stats.totalConnections,
      icon: Link2,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: t("adminPendingRequests"),
      value: stats.pendingRequests,
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: t("adminAdministrators"),
      value: stats.adminCount,
      icon: Activity,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: t("adminVerifiedIdentities"),
      value: stats.verifiedIdentities,
      icon: ShieldCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: t("adminUnverifiedIdentities"),
      value: stats.unverifiedIdentities,
      icon: ShieldX,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ]

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("adminDashboard")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("adminDashboardDescription")}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardContent className="p-4 sm:pt-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                        {isLoading ? "..." : stat.value}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("adminNewMembers")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t("adminLast5Members")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm sm:text-base text-muted-foreground">{t("loading")}</p>
              ) : recentMembers.length === 0 ? (
                <p className="text-sm sm:text-base text-muted-foreground">{t("adminNoMembers")}</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => navigate(`/profile/${member.id}`)}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url || "/placeholder.svg"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-medium text-primary">
                            {member.first_name?.[0]}
                            {member.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("adminQuickActions")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t("adminQuickActionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => navigate("/admin/members")}
                  className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2" />
                  <p className="font-medium text-foreground text-sm sm:text-base">{t("adminManageMembers")}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t("adminViewAllMembers")}</p>
                </button>

                <button
                  onClick={() => navigate("/admin/roles")}
                  className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-2" />
                  <p className="font-medium text-foreground text-sm sm:text-base">{t("adminManageRoles")}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t("adminAssignRoles")}</p>
                </button>

                <button
                  onClick={() => navigate("/admin/moderation")}
                  className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mb-2" />
                  <p className="font-medium text-foreground text-sm sm:text-base">{t("adminModeration")}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t("adminContentToReview")}</p>
                </button>

                <button
                  onClick={() => navigate("/admin/analytics")}
                  className="p-3 sm:p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mb-2" />
                  <p className="font-medium text-foreground text-sm sm:text-base">{t("adminAnalytics")}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t("adminDetailedStats")}</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
