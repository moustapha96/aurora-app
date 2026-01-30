import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, ExternalLink, User, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { MemberSubscription } from "@/pages/admin/AdminSubscriptions";
import { format, type Locale } from "date-fns";
import { fr, enUS, es, de, it, ptBR, ar, zhCN, ja, ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const localeMap: Record<string, Locale> = {
  fr, en: enUS, es, de, it, pt: ptBR, ar, zh: zhCN, ja, ru,
};

interface SubscriptionMembersTabProps {
  subscriptions: MemberSubscription[];
  onRefresh: () => void;
}

export const SubscriptionMembersTab = ({ subscriptions, onRefresh }: SubscriptionMembersTabProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const dateLocale = localeMap[language] ?? fr;

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
          <Clock className="w-3 h-3 mr-1" />
          {t('adminSubscriptionCancelingAtEnd')}
        </Badge>
      );
    }
    
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t('adminSubscriptionActive')}
          </Badge>
        );
      case 'trialing':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {t('adminSubscriptionTrialing')}
          </Badge>
        );
      case 'past_due':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('adminSubscriptionPastDue')}
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            {t('adminSubscriptionCanceled')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: dateLocale });
    } catch {
      return '–';
    }
  };

  const getMemberName = (sub: MemberSubscription) => {
    if (sub.profile_first_name || sub.profile_last_name) {
      return `${sub.profile_first_name || ''} ${sub.profile_last_name || ''}`.trim();
    }
    if (sub.customer_name) return sub.customer_name;
    return t('adminSubscriptionUnknownMember');
  };

  const getMemberInitials = (sub: MemberSubscription) => {
    const name = getMemberName(sub);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('adminMemberSubscriptionsTitle')}</CardTitle>
          <CardDescription>{t('adminMemberSubscriptionsDesc')}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('refresh')}
        </Button>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('adminNoSubscriptions')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminSubscriptionMember')}</TableHead>
                  <TableHead>{t('adminSubscriptionPlan')}</TableHead>
                  <TableHead>{t('adminSubscriptionAmount')}</TableHead>
                  <TableHead>{t('adminSubscriptionStatus')}</TableHead>
                  <TableHead>{t('adminSubscriptionStartDate')}</TableHead>
                  <TableHead>{t('adminSubscriptionEndDate')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sub.profile_avatar_url || undefined} />
                          <AvatarFallback className="bg-gold/10 text-gold text-xs">
                            {getMemberInitials(sub)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{getMemberName(sub)}</p>
                          <p className="text-xs text-muted-foreground">{sub.customer_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sub.product_name}</p>
                        <p className="text-xs text-muted-foreground">{sub.interval}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{sub.amount} {sub.currency}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sub.status, sub.cancel_at_period_end)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(sub.current_period_start)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(sub.current_period_end)}
                    </TableCell>
                    <TableCell>
                      {sub.profile_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/profile/${sub.profile_id}`)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
