import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MarketplaceCountdown } from './MarketplaceCountdown';
import { StripeCheckout } from './StripeCheckout';
import { MarketplaceItem } from '@/hooks/useMarketplace';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, ChevronLeft, ChevronRight, Package, MapPin, CreditCard } from 'lucide-react';

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
  const [showDetails, setShowDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
              />
              {allImages.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
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
              <Badge className="bg-red-500 text-white text-lg px-4 py-2">{t('sold')}</Badge>
            </div>
          )}
          
          {/* Category badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-black/60 text-white border-0 text-xs"
          >
            {getCategoryLabel(item.category)}
          </Badge>
        </div>

        <CardContent className="p-4">
          <h3 className="font-serif text-base text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-lg font-serif text-primary">
              {formatPrice(item.price, item.currency)}
            </p>
            <MarketplaceCountdown endDate={item.offer_end_date} compact />
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{item.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image Gallery */}
            {allImages.length > 0 && (
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${item.title} - ${currentImageIndex + 1}`}
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
                    
                    {/* Thumbnails */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('price')}</p>
                  <p className="text-2xl font-serif text-primary">
                    {formatPrice(item.price, item.currency)}
                  </p>
                </div>

                {item.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('description')}</p>
                    <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <MarketplaceCountdown endDate={item.offer_end_date} />
                
                {isOwner ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={onEdit}>
                      {t('edit')}
                    </Button>
                    {item.status === 'active' && (
                      <Button variant="secondary" onClick={onMarkSold}>
                        {t('markAsSold')}
                      </Button>
                    )}
                    <Button variant="destructive" onClick={onDelete}>
                      {t('delete')}
                    </Button>
                  </div>
                ) : item.status === 'active' ? (
                  <Button 
                    onClick={() => setShowCheckout(true)}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('buyNow')}
                  </Button>
                ) : null}
              </div>
            </div>
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
