import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminMarketplace, AdminMarketplaceItem } from "@/hooks/useAdminMarketplace";
import { MARKETPLACE_CATEGORIES } from "@/hooks/useMarketplace";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShoppingBag, Eye, Trash2, Loader2, Package, ChevronLeft, ChevronRight,
  User, Calendar, DollarSign, CreditCard, ArrowRightLeft
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  stripe_payment_intent_id: string;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  buyer_name?: string;
  buyer_email?: string;
  seller_name?: string;
  seller_email?: string;
  item_title?: string;
}

const AdminMarketplace = () => {
  const { t } = useLanguage();
  const { allItems, loading, fetchAllItems, updateItemStatus, deleteItem } = useAdminMarketplace();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewingItem, setViewingItem] = useState<AdminMarketplaceItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('items');
  
  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  const fetchPayments = async (status?: string) => {
    setPaymentsLoading(true);
    try {
      let query = supabase
        .from('marketplace_payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data: paymentsData, error } = await query;
      
      if (error) throw error;
      
      if (paymentsData && paymentsData.length > 0) {
        // Fetch buyer and seller profiles
        const buyerIds = [...new Set(paymentsData.map(p => p.buyer_id))];
        const sellerIds = [...new Set(paymentsData.map(p => p.seller_id))];
        const itemIds = [...new Set(paymentsData.map(p => p.item_id))];
        const allUserIds = [...new Set([...buyerIds, ...sellerIds])];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', allUserIds);
        
        // Get emails from auth function
        const { data: emailsData } = await supabase.rpc('get_user_emails_for_admin');
        
        const { data: items } = await supabase
          .from('marketplace_items')
          .select('id, title')
          .in('id', itemIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]) || []);
        const emailMap = new Map(emailsData?.map((e: any) => [e.user_id, e.email]) || []);
        const itemMap = new Map(items?.map(i => [i.id, i.title]) || []);
        
        const enrichedPayments: Payment[] = paymentsData.map(p => ({
          ...p,
          buyer_name: profileMap.get(p.buyer_id) || t('unknownUser'),
          buyer_email: emailMap.get(p.buyer_id) || '',
          seller_name: profileMap.get(p.seller_id) || t('unknownUser'),
          seller_email: emailMap.get(p.seller_id) || '',
          item_title: itemMap.get(p.item_id) || t('unknownItem'),
        }));
        
        setPayments(enrichedPayments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments(paymentStatusFilter);
    }
  }, [activeTab, paymentStatusFilter]);

  const handleFilterChange = (category: string, status: string) => {
    fetchAllItems(category === 'all' ? undefined : category, status === 'all' ? undefined : status);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'immobilier': t('categoryImmobilier'),
      'automobile': t('categoryAutomobile'),
      'art': t('categoryArt'),
      'horlogerie': t('categoryHorlogerie'),
      'joaillerie': t('categoryJoaillerie'),
      'vin': t('categoryVin'),
      'jets_yachts': t('categoryJetsYachts'),
      'rare_objects': t('categoryRareObjects'),
      'investissements': t('categoryInvestments'),
      'mode_luxe': t('categoryModeLuxe'),
      'autres': t('categoryOthers')
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">{t('paymentStatusActive')}</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500 text-white">{t('paymentStatusSold')}</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-500 text-white">{t('paymentStatusExpired')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('paymentStatusCancelled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">{t('paymentStatusCompleted')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">{t('paymentStatusPending')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('paymentStatusFailed')}</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-500 text-white">{t('paymentStatusRefunded')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const allImages = viewingItem ? [
    viewingItem.main_image_url,
    ...(viewingItem.additional_images || [])
  ].filter(Boolean) as string[] : [];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              {t('adminMarketplaceTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('adminMarketplaceDesc')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('marketplaceItems')} ({allItems.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t('marketplacePayments')} ({payments.length})
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('marketplaceFilters')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <div className="w-48">
                  <label className="text-sm font-medium mb-2 block">{t('marketplaceCategory')}</label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={(v) => {
                      setSelectedCategory(v);
                      handleFilterChange(v, selectedStatus);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('marketplaceAllCategories')}</SelectItem>
                      {MARKETPLACE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium mb-2 block">{t('marketplaceStatus')}</label>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={(v) => {
                      setSelectedStatus(v);
                      handleFilterChange(selectedCategory, v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('marketplaceAllStatuses')}</SelectItem>
                      <SelectItem value="active">{t('marketplaceStatusActive')}</SelectItem>
                      <SelectItem value="sold">{t('marketplaceStatusSold')}</SelectItem>
                      <SelectItem value="expired">{t('marketplaceStatusExpired')}</SelectItem>
                      <SelectItem value="cancelled">{t('marketplaceStatusCancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : allItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">{t('marketplaceNoItems')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{t('marketplaceImage')}</TableHead>
                          <TableHead>{t('marketplaceTitle')}</TableHead>
                          <TableHead>{t('marketplaceCategory')}</TableHead>
                          <TableHead>{t('marketplacePrice')}</TableHead>
                          <TableHead>{t('marketplaceStatus')}</TableHead>
                          <TableHead>{t('marketplaceOwner')}</TableHead>
                          <TableHead>{t('marketplaceDate')}</TableHead>
                          <TableHead className="text-right">{t('marketplaceActions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.main_image_url ? (
                                <img 
                                  src={item.main_image_url} 
                                  alt={item.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground/30" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {item.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatPrice(item.price, item.currency)}
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{item.owner_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{item.owner_email}</div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setViewingItem(item);
                                    setCurrentImageIndex(0);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {/* Payment Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('marketplaceFilters')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <div className="w-48">
                  <label className="text-sm font-medium mb-2 block">{t('paymentStatus')}</label>
                  <Select 
                    value={paymentStatusFilter} 
                    onValueChange={setPaymentStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('paymentAllStatuses')}</SelectItem>
                      <SelectItem value="pending">{t('paymentStatusPending')}</SelectItem>
                      <SelectItem value="completed">{t('paymentStatusCompleted')}</SelectItem>
                      <SelectItem value="failed">{t('paymentStatusFailed')}</SelectItem>
                      <SelectItem value="refunded">{t('paymentStatusRefunded')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardContent className="p-0">
                {paymentsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">{t('noPaymentsFound')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('paymentItem')}</TableHead>
                          <TableHead>{t('paymentAmount')}</TableHead>
                          <TableHead>{t('paymentBuyer')}</TableHead>
                          <TableHead>{t('paymentSeller')}</TableHead>
                          <TableHead>{t('paymentStatus')}</TableHead>
                          <TableHead>{t('paymentDate')}</TableHead>
                          <TableHead>{t('paymentCompletedAt')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {payment.item_title}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatPrice(payment.amount, payment.currency)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <User className="w-3 h-3 text-blue-500" />
                                <span className="truncate max-w-[120px]">{payment.buyer_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{payment.buyer_email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <User className="w-3 h-3 text-green-500" />
                                <span className="truncate max-w-[120px]">{payment.seller_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{payment.seller_email}</div>
                            </TableCell>
                            <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {payment.completed_at 
                                ? format(new Date(payment.completed_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                                : '-'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Item Detail Dialog */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {viewingItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">{viewingItem.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Image Gallery */}
                  {allImages.length > 0 && (
                    <div className="relative">
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={allImages[currentImageIndex]}
                          alt={`${viewingItem.title} - ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {allImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                            onClick={nextImage}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">{formatPrice(viewingItem.price, viewingItem.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{viewingItem.owner_name}</span>
                        <span className="text-muted-foreground">({viewingItem.owner_email})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(viewingItem.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('marketplaceCategory')}:</span>
                        <Badge variant="outline">{getCategoryLabel(viewingItem.category)}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('marketplaceStatus')}:</span>
                        {getStatusBadge(viewingItem.status)}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingItem.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{t('description')}</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{viewingItem.description}</p>
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateItemStatus(viewingItem.id, 'active');
                        setViewingItem(null);
                      }}
                      disabled={viewingItem.status === 'active'}
                    >
                      {t('marketplaceStatusActive')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateItemStatus(viewingItem.id, 'sold');
                        setViewingItem(null);
                      }}
                      disabled={viewingItem.status === 'sold'}
                    >
                      {t('marketplaceStatusSold')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateItemStatus(viewingItem.id, 'cancelled');
                        setViewingItem(null);
                      }}
                      disabled={viewingItem.status === 'cancelled'}
                    >
                      {t('marketplaceStatusCancelled')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deleteItem(viewingItem.id);
                        setViewingItem(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('delete')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketplace;
