import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketplaceItem, MarketplaceItemFormData, MARKETPLACE_CATEGORIES } from '@/hooks/useMarketplace';
import { Upload, X, Plus, Loader2, ImageIcon, Maximize2 } from 'lucide-react';

interface MarketplaceItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MarketplaceItem | null;
  onSubmit: (data: MarketplaceItemFormData) => Promise<boolean>;
  onUploadImage: (file: File) => Promise<string | null>;
}

const getInitialFormData = (item?: MarketplaceItem | null): MarketplaceItemFormData => ({
  title: item?.title || '',
  description: item?.description || '',
  category: item?.category || '',
  price: item?.price || 0,
  currency: item?.currency || 'EUR',
  main_image_url: item?.main_image_url || null,
  additional_images: item?.additional_images || [],
  offer_end_date: item?.offer_end_date || null,
  reservation_until_date: item?.reservation_until_date || null
});

export const MarketplaceItemForm = ({
  open,
  onOpenChange,
  item,
  onSubmit,
  onUploadImage
}: MarketplaceItemFormProps) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFilesRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<MarketplaceItemFormData>(getInitialFormData(item));
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [descriptionFullscreen, setDescriptionFullscreen] = useState(false);

  // Sync form data when item changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(item));
    }
  }, [item, open]);

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

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('[MarketplaceForm] Uploading main image:', file.name);
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      console.log('[MarketplaceForm] Main image URL received:', url);
      if (url) {
        setFormData(prev => {
          const updated = { ...prev, main_image_url: url };
          console.log('[MarketplaceForm] Updated formData with main image:', updated.main_image_url);
          return updated;
        });
      }
    } catch (error) {
      console.error('[MarketplaceForm] Main image upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    console.log('[MarketplaceForm] Uploading additional images:', files.length);
    setUploading(true);
    const newImages: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await onUploadImage(files[i]);
        console.log('[MarketplaceForm] Additional image URL received:', url);
        if (url) {
          newImages.push(url);
        }
      }
      
      setFormData(prev => {
        const updated = {
          ...prev,
          additional_images: [...prev.additional_images, ...newImages]
        };
        console.log('[MarketplaceForm] Updated additional_images count:', updated.additional_images.length);
        return updated;
      });
    } catch (error) {
      console.error('[MarketplaceForm] Additional images upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || formData.price <= 0) {
      console.warn('[MarketplaceForm] Validation failed:', { 
        title: !!formData.title, 
        category: !!formData.category, 
        price: formData.price 
      });
      return;
    }
    
    console.log('[MarketplaceForm] Submitting form:', {
      title: formData.title,
      main_image_url: formData.main_image_url,
      additional_images_count: formData.additional_images.length
    });
    
    setSubmitting(true);
    const success = await onSubmit(formData);
    setSubmitting(false);
    
    if (success) {
      console.log('[MarketplaceForm] Submit successful, closing dialog');
      onOpenChange(false);
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        price: 0,
        currency: 'EUR',
        main_image_url: null,
        additional_images: [],
        offer_end_date: null,
        reservation_until_date: null
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="font-serif font-semibold text-lg sm:text-xl text-foreground leading-tight">
            {item ? t('editItem') : t('addItem')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Image */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">{t('mainImage')}</Label>
            <div className="flex items-center gap-3">
              {formData.main_image_url ? (
                <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border">
                  <img 
                    src={formData.main_image_url} 
                    alt="Main" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                    onClick={() => setFormData(prev => ({ ...prev, main_image_url: null }))}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-28 h-28 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{t('addImage')}</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Additional Images */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">{t('additionalImages')}</Label>
            <div className="flex flex-wrap gap-2">
              {formData.additional_images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                    onClick={() => removeAdditionalImage(idx)}
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => additionalFilesRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 border-2 border-dashed border-border rounded-md flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              <input
                ref={additionalFilesRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground">{t('itemTitle')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('itemTitlePlaceholder')}
              required
              className="h-9 text-base placeholder:text-muted-foreground/70"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">{t('category')} *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-sm font-medium text-foreground">{t('price')} *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                required
                className="h-9 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">{t('marketplaceCurrency')}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">{t('description')}</Label>
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
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onFocus={() => setDescriptionFocused(true)}
              onBlur={() => setDescriptionFocused(false)}
              placeholder={t('descriptionPlaceholder')}
              rows={descriptionFocused ? 8 : 4}
              className={`text-base leading-relaxed placeholder:text-muted-foreground/70 transition-all duration-300 ease-in-out ${
                descriptionFocused 
                  ? 'min-h-[200px] sm:min-h-[250px] md:min-h-[300px]' 
                  : 'min-h-[100px]'
              }`}
            />
          </div>

          {/* Dialog plein écran pour la description */}
          <Dialog open={descriptionFullscreen} onOpenChange={setDescriptionFullscreen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col p-0 gap-0">
              <DialogHeader className="px-6 py-3 border-b border-border flex-shrink-0">
                <DialogTitle className="text-base font-serif font-semibold text-foreground">
                  {t('description')} – {t('fullscreen') || 'Plein écran'}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto p-6">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('descriptionPlaceholder')}
                  className="w-full min-h-[50vh] resize-none text-base leading-relaxed"
                />
              </div>
              <DialogFooter className="px-6 py-3 border-t border-border flex-shrink-0 flex flex-row justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDescriptionFullscreen(false)} className="h-7 text-xs px-2.5">
                  {t('close') || 'Fermer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Offer End Date */}
          <div className="space-y-1.5">
            <Label htmlFor="endDate" className="text-sm font-medium text-foreground">{t('endofOffer')}</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.offer_end_date ? new Date(formData.offer_end_date).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                offer_end_date: e.target.value ? new Date(e.target.value + 'T00:00:00').toISOString() : null
              }))}
              className="h-9 text-base"
            />
            <p className="text-xs text-muted-foreground">{t('offerEndDateHint')}</p>
          </div>

          {/* Reservation Until Date */}
          <div className="space-y-1.5">
            <Label htmlFor="reservationDate" className="text-sm font-semibold text-foreground">{t('reservationUntilDate')}</Label>
            <Input
              id="reservationDate"
              type="date"
              value={formData.reservation_until_date ? new Date(formData.reservation_until_date).toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                reservation_until_date: e.target.value ? new Date(e.target.value + 'T00:00:00').toISOString() : null
              }))}
              className="h-9 text-base"
            />
            <p className="text-xs text-muted-foreground">{t('reservationUntilDateHint')}</p>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-7 text-xs px-2.5 min-w-[4rem]">
              {t('cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={submitting || uploading} className="h-7 text-xs px-2.5 min-w-[4rem]">
              {submitting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                t('save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
