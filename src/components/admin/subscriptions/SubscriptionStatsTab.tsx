import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, AlertCircle, XCircle, DollarSign } from "lucide-react";
import { SubscriptionStats, MemberSubscription } from "@/pages/admin/AdminSubscriptions";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SubscriptionStatsTabProps {
  stats: SubscriptionStats | null;
  subscriptions: MemberSubscription[];
}

export const SubscriptionStatsTab = ({ stats, subscriptions }: SubscriptionStatsTabProps) => {
  const { t } = useLanguage();

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('adminNoSubscriptions')}</p>
      </div>
    );
  }

  const pieData = [
    { name: t('adminSubscriptionStatsActive'), value: stats.active, color: '#22c55e' },
    { name: t('adminSubscriptionStatsTrialing'), value: stats.trialing, color: '#3b82f6' },
    { name: t('adminSubscriptionStatsPastDue'), value: stats.pastDue, color: '#ef4444' },
    { name: t('adminSubscriptionStatsCanceled'), value: stats.canceled, color: '#6b7280' },
  ].filter(item => item.value > 0);

  // Calculate revenue by product
  const revenueByProduct: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const sub of subscriptions) {
    if (sub.status === 'active' || sub.status === 'trialing') {
      if (!revenueByProduct[sub.product_id]) {
        revenueByProduct[sub.product_id] = {
          name: sub.product_name,
          revenue: 0,
          count: 0,
        };
      }
      revenueByProduct[sub.product_id].revenue += sub.amount;
      revenueByProduct[sub.product_id].count += 1;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('adminSubscriptionStatsTotal')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('adminSubscriptionStatsActive')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('adminSubscriptionStatsTrialing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">{stats.trialing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {t('adminSubscriptionStatsPastDue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{stats.pastDue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {t('adminSubscriptionStatsCanceled')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-500">{stats.canceled}</p>
          </CardContent>
        </Card>

        <Card className="bg-gold/5 border-gold/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('adminSubscriptionStatsRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gold">{stats.totalRevenue.toFixed(2)}€</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('adminSubscriptionStatsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {Object.keys(revenueByProduct).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('adminSubscriptionStatsRevenue')} par formule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.values(revenueByProduct).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.count} {t('adminSubscriptionStatsActive').toLowerCase()}</p>
                    </div>
                    <p className="text-lg font-bold text-gold">{product.revenue.toFixed(2)}€</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
