import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MarketplaceCountdown } from './MarketplaceCountdown';
import { StripeCheckout } from './StripeCheckout';
import { MarketplaceItem } from '@/hooks/useMarketplace';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Eye, ChevronLeft, ChevronRight, Package, MapPin, CreditCard, Maximize2, User, Phone, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SellerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  account_number: string | null;
  mobile_phone?: string | null;
}

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkSold?: () => void;
  onPurchaseSuccess?: () => void;
}

export const MarketplaceItemCard = ({ 
  item, 
  isOwner = false,
  onEdit,
  onDelete,
  onMarkSold,
  onPurchaseSuccess
}: MarketplaceItemCardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descriptionFullscreen, setDescriptionFullscreen] = useState(false);
  const [requestedReservationUntil, setRequestedReservationUntil] = useState<string>('');
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);

  const offerEnded = item.offer_end_date ? new Date(item.offer_end_date) <= new Date() : false;
  const maxReservationDate = item.reservation_until_date || item.offer_end_date || null;

  useEffect(() => {
    if (!showDetails) {
      setRequestedReservationUntil('');
      return;
    }
    
    // Fetch seller profile when dialog opens
    const fetchSellerProfile = async () => {
      if (!item.user_id || isOwner) return;
      
      setLoadingSeller(true);
      try {
        // Get public profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, account_number')
          .eq('id', item.user_id)
          .single();
        
        if (profileError || !profileData) {
          console.error('Error fetching seller profile:', profileError);
          return;
        }
        
        // Try to get phone from profiles_private (may fail due to RLS)
        const { data: privateData } = await supabase
          .from('profiles_private')
          .select('mobile_phone')
          .eq('user_id', item.user_id)
          .single();
        
        setSellerProfile({
          ...profileData,
          mobile_phone: privateData?.mobile_phone || null
        });
      } catch (err) {
        console.error('Error fetching seller profile:', err);
      } finally {
        setLoadingSeller(false);
      }
    };
    
    fetchSellerProfile();
  }, [showDetails, item.user_id, isOwner]);

  const allImages = [
    item.main_image_url,
    ...(item.additional_images || [])
  ].filter(Boolean) as string[];

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
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

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <>
      <Card 
        className="group overflow-hidden border-border/30 hover:border-primary/30 transition-all duration-300 cursor-pointer bg-card/50 hover:bg-card"
        onClick={() => setShowDetails(true)}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[0]}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center absolute inset-0 bg-muted">
                <Package className="w-12 h-12 text-muted-foreground/30" />
              </div>
              {allImages.length > 1 && (
                <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  +{allImages.length - 1}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Status badges */}
          {item.status === 'sold' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-red-500 text-white text-sm px-3 py-1.5">{t('sold')}</Badge>
            </div>
          )}
          
          {/* Category badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-1.5 left-1.5 bg-black/60 text-white border-0 text-[10px] px-1.5 py-0"
          >
            {getCategoryLabel(item.category)}
          </Badge>
        </div>

        <CardContent className="p-3 sm:p-4">
          <h3 className="font-serif font-semibold text-base sm:text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors leading-tight">
            {item.title}
          </h3>
          
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-base sm:text-lg font-serif font-bold text-primary">
              {formatPrice(item.price, item.currency)}
            </p>
            <MarketplaceCountdown endDate={item.offer_end_date} compact />
          </div>
          
          {!offerEnded && maxReservationDate && (
            <div className="mt-1.5 pt-1.5 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {t('youCanReserveUntil') || 'Vous pouvez réserver ce bien jusqu\'au'}{' '}
                <span className="text-foreground font-semibold">
                  {new Date(maxReservationDate).toLocaleDateString()}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="font-serif font-semibold text-lg sm:text-xl text-foreground leading-tight">
              {item.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Image Gallery */}
            {allImages.length > 0 && (
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${item.title} - ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('[Marketplace] Image load error:', allImages[currentImageIndex]);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Thumbnails */}
                    <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                            idx === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          onClick={() => setCurrentImageIndex(idx)}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <Badge variant="outline" className="text-xs">{getCategoryLabel(item.category)}</Badge>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t('price')}</p>
                  <p className="text-xl font-serif font-bold text-primary">
                    {formatPrice(item.price, item.currency)}
                  </p>
                </div>

                {item.description && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{t('description')}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDescriptionFullscreen(true)}
                        className="h-7 w-7 p-0 shrink-0 border-gold/30 text-gold hover:bg-gold/10"
                        title={t('fullscreen') || 'Plein écran'}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <MarketplaceCountdown endDate={item.offer_end_date} />
                
                {/* Seller Contact Info - Only for buyers */}
                {!isOwner && sellerProfile && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      {t('sellerContact')}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={sellerProfile.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {sellerProfile.first_name?.[0]}{sellerProfile.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {sellerProfile.first_name} {sellerProfile.last_name}
                        </p>
                        {sellerProfile.account_number && (
                          <p className="text-xs text-muted-foreground">
                            #{sellerProfile.account_number}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {sellerProfile.mobile_phone && (
                      <a 
                        href={`tel:${sellerProfile.mobile_phone}`}
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{sellerProfile.mobile_phone}</span>
                      </a>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-primary/30 hover:bg-primary/10"
                      onClick={() => navigate(`/messages?userId=${sellerProfile.id}`)}
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      {t('contactSeller')}
                    </Button>
                  </div>
                )}
                
                {!isOwner && loadingSeller && (
                  <div className="p-3 bg-muted/30 rounded-lg border border-border animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                )}
                
                {!offerEnded && maxReservationDate && (
                  <div className="p-2.5 bg-muted/30 rounded-lg border border-border space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{t('youCanReserveUntil') || 'Vous pouvez réserver ce bien jusqu\'au'}</p>
                    <p className="text-sm text-foreground font-medium">
                      {new Date(maxReservationDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('reservationInfo')}</p>
                  </div>
                )}

                {/* Champ : on demande à l'acheteur de donner sa date de réservation */}
                {!isOwner && item.status === 'active' && !offerEnded && maxReservationDate && (
                  <div className="space-y-1.5">
                    <Label htmlFor="requestedReservationUntil" className="text-sm font-semibold text-foreground">
                      {t('giveYourReservationDate') || 'Indiquez jusqu\'à quelle date vous souhaitez réserver'}
                    </Label>
                    <Input
                      id="requestedReservationUntil"
                      type="date"
                      value={requestedReservationUntil}
                      onChange={(e) => setRequestedReservationUntil(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      max={maxReservationDate ? new Date(maxReservationDate).toISOString().split('T')[0] : undefined}
                      className="h-9 text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('giveYourReservationDateHint') || 'Donnez la date jusqu\'à laquelle vous souhaitez réserver ce bien.'}
                    </p>
                  </div>
                )}
                
                {/* Boutons alignés, même position, plus petits */}
                {isOwner ? (
                  <div className="flex flex-row flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit} className="h-7 text-xs px-2.5 min-w-[4rem]">
                      {t('edit')}
                    </Button>
                    {item.status === 'active' && (
                      <Button variant="secondary" size="sm" onClick={onMarkSold} className="h-7 text-xs px-2.5 min-w-[4rem]">
                        {t('markAsSold')}
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={onDelete} className="h-7 text-xs px-2.5 min-w-[4rem]">
                      {t('delete')}
                    </Button>
                  </div>
                ) : item.status === 'active' ? (
                  <div className="flex flex-row justify-end">
                    <Button 
                      onClick={() => setShowCheckout(true)}
                      size="sm"
                      className="h-7 text-xs px-2.5 min-w-[4rem]"
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      {t('buyNow')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog plein écran pour la description */}
      <Dialog open={descriptionFullscreen} onOpenChange={setDescriptionFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-3 border-b border-border flex-shrink-0">
            <DialogTitle className="text-base font-serif font-semibold text-foreground">
              {item.title} – {t('description')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6">
            <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
              {item.description || t('noDescription') || 'Aucune description'}
            </p>
          </div>
          <div className="px-6 py-3 border-t border-border flex-shrink-0 flex flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDescriptionFullscreen(false)}
              className="h-7 text-xs px-2.5"
            >
              {t('close') || 'Fermer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stripe Checkout */}
      <StripeCheckout
        open={showCheckout}
        onOpenChange={setShowCheckout}
        itemId={item.id}
        itemTitle={item.title}
        amount={item.price}
        currency={item.currency}
        onSuccess={() => {
          onPurchaseSuccess?.();
          setShowDetails(false);
        }}
      />
    </>
  );
};
