import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Plus, Trash2, Star, Crown, Sparkles, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface SubscriptionTier {
  id: string;
  tier_key: string;
  name_fr: string;
  name_en: string;
  name_es: string;
  name_de: string;
  name_it: string;
  name_pt: string;
  name_ar: string;
  name_zh: string;
  name_ja: string;
  name_ru: string;
  price: number;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  icon_type: string;
  color_class: string;
  bg_color_class: string;
  border_color_class: string;
  display_order: number;
  is_active: boolean;
}

const ICON_OPTIONS = [
  { value: 'star', label: 'Star', icon: Star },
  { value: 'crown', label: 'Crown', icon: Crown },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
];

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { value: 'gold', label: 'Gold', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30' },
  { value: 'purple', label: 'Purple', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { value: 'green', label: 'Green', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { value: 'red', label: 'Red', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
];

const AdminSubscriptions = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewTier, setIsNewTier] = useState(false);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTiers(data || []);
    } catch (error: any) {
      console.error("Error loading tiers:", error);
      toast.error(t('errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;

    setSaving(editingTier.id || 'new');
    try {
      if (isNewTier) {
        const { error } = await supabase
          .from('subscription_tiers')
          .insert({
            tier_key: editingTier.tier_key,
            name_fr: editingTier.name_fr,
            name_en: editingTier.name_en,
            name_es: editingTier.name_es,
            name_de: editingTier.name_de,
            name_it: editingTier.name_it,
            name_pt: editingTier.name_pt,
            name_ar: editingTier.name_ar,
            name_zh: editingTier.name_zh,
            name_ja: editingTier.name_ja,
            name_ru: editingTier.name_ru,
            price: editingTier.price,
            currency: editingTier.currency,
            stripe_product_id: editingTier.stripe_product_id,
            stripe_price_id: editingTier.stripe_price_id,
            icon_type: editingTier.icon_type,
            color_class: editingTier.color_class,
            bg_color_class: editingTier.bg_color_class,
            border_color_class: editingTier.border_color_class,
            display_order: editingTier.display_order,
            is_active: editingTier.is_active,
          });

        if (error) throw error;
        toast.success(t('tierCreated'));
      } else {
        const { error } = await supabase
          .from('subscription_tiers')
          .update({
            tier_key: editingTier.tier_key,
            name_fr: editingTier.name_fr,
            name_en: editingTier.name_en,
            name_es: editingTier.name_es,
            name_de: editingTier.name_de,
            name_it: editingTier.name_it,
            name_pt: editingTier.name_pt,
            name_ar: editingTier.name_ar,
            name_zh: editingTier.name_zh,
            name_ja: editingTier.name_ja,
            name_ru: editingTier.name_ru,
            price: editingTier.price,
            currency: editingTier.currency,
            stripe_product_id: editingTier.stripe_product_id,
            stripe_price_id: editingTier.stripe_price_id,
            icon_type: editingTier.icon_type,
            color_class: editingTier.color_class,
            bg_color_class: editingTier.bg_color_class,
            border_color_class: editingTier.border_color_class,
            display_order: editingTier.display_order,
            is_active: editingTier.is_active,
          })
          .eq('id', editingTier.id);

        if (error) throw error;
        toast.success(t('tierUpdated'));
      }

      setIsDialogOpen(false);
      setEditingTier(null);
      loadTiers();
    } catch (error: any) {
      console.error("Error saving tier:", error);
      toast.error(t('errorSavingData'));
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm(t('confirmDeleteTier'))) return;

    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;
      toast.success(t('tierDeleted'));
      loadTiers();
    } catch (error: any) {
      console.error("Error deleting tier:", error);
      toast.error(t('errorDeletingData'));
    }
  };

  const openNewTierDialog = () => {
    setIsNewTier(true);
    setEditingTier({
      id: '',
      tier_key: '',
      name_fr: '',
      name_en: '',
      name_es: '',
      name_de: '',
      name_it: '',
      name_pt: '',
      name_ar: '',
      name_zh: '',
      name_ja: '',
      name_ru: '',
      price: 0,
      currency: 'EUR',
      stripe_product_id: null,
      stripe_price_id: null,
      icon_type: 'star',
      color_class: 'text-blue-500',
      bg_color_class: 'bg-blue-500/10',
      border_color_class: 'border-blue-500/30',
      display_order: tiers.length + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditTierDialog = (tier: SubscriptionTier) => {
    setIsNewTier(false);
    setEditingTier({ ...tier });
    setIsDialogOpen(true);
  };

  const handleColorChange = (colorValue: string) => {
    const colorOption = COLOR_OPTIONS.find(c => c.value === colorValue);
    if (colorOption && editingTier) {
      setEditingTier({
        ...editingTier,
        color_class: colorOption.color,
        bg_color_class: colorOption.bg,
        border_color_class: colorOption.border,
      });
    }
  };

  const getCurrentColorValue = () => {
    if (!editingTier) return 'blue';
    const found = COLOR_OPTIONS.find(c => c.color === editingTier.color_class);
    return found?.value || 'blue';
  };

  const getIconComponent = (iconType: string) => {
    const iconOption = ICON_OPTIONS.find(i => i.value === iconType);
    return iconOption?.icon || Star;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif text-gold">{t('adminSubscriptions')}</h1>
                <p className="text-muted-foreground mt-1">{t('adminSubscriptionsDescription')}</p>
              </div>
              <Button onClick={openNewTierDialog} className="bg-gold hover:bg-gold/90">
                <Plus className="w-4 h-4 mr-2" />
                {t('addTier')}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiers.map((tier) => {
                  const IconComponent = getIconComponent(tier.icon_type);
                  return (
                    <Card key={tier.id} className={`relative ${tier.border_color_class} border-2 ${tier.bg_color_class}`}>
                      {!tier.is_active && (
                        <div className="absolute top-2 right-2">
                          <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded">{t('inactiveTier')}</span>
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <div className={`mx-auto p-4 rounded-full ${tier.bg_color_class} mb-2`}>
                          <IconComponent className={`h-8 w-8 ${tier.color_class}`} />
                        </div>
                        <CardTitle className="text-foreground">{tier.name_fr}</CardTitle>
                        <p className="text-muted-foreground text-sm">{tier.tier_key}</p>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                        <div>
                          <span className="text-3xl font-bold text-foreground">{tier.price}€</span>
                          <span className="text-muted-foreground">/{t('month')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Product ID: {tier.stripe_product_id || '-'}</p>
                          <p>Price ID: {tier.stripe_price_id || '-'}</p>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => openEditTierDialog(tier)}>
                            {t('edit')}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTier(tier.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isNewTier ? t('addTier') : t('editTier')}</DialogTitle>
                </DialogHeader>
                {editingTier && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('tierKey')}</Label>
                        <Input
                          value={editingTier.tier_key}
                          onChange={(e) => setEditingTier({ ...editingTier, tier_key: e.target.value })}
                          placeholder="basic, premium, elite..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('price')} (€)</Label>
                        <Input
                          type="number"
                          value={editingTier.price}
                          onChange={(e) => setEditingTier({ ...editingTier, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stripe Product ID</Label>
                        <Input
                          value={editingTier.stripe_product_id || ''}
                          onChange={(e) => setEditingTier({ ...editingTier, stripe_product_id: e.target.value })}
                          placeholder="prod_..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stripe Price ID</Label>
                        <Input
                          value={editingTier.stripe_price_id || ''}
                          onChange={(e) => setEditingTier({ ...editingTier, stripe_price_id: e.target.value })}
                          placeholder="price_..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('iconLabel')}</Label>
                        <Select value={editingTier.icon_type} onValueChange={(v) => setEditingTier({ ...editingTier, icon_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="w-4 h-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('colorLabel')}</Label>
                        <Select value={getCurrentColorValue()} onValueChange={handleColorChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLOR_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded ${option.color.replace('text-', 'bg-')}`} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('displayOrder')}</Label>
                        <Input
                          type="number"
                          value={editingTier.display_order}
                          onChange={(e) => setEditingTier({ ...editingTier, display_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingTier.is_active}
                        onCheckedChange={(checked) => setEditingTier({ ...editingTier, is_active: checked })}
                      />
                      <Label>{t('active')}</Label>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">{t('translatedNames')}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">🇫🇷 Français</Label>
                          <Input
                            value={editingTier.name_fr}
                            onChange={(e) => setEditingTier({ ...editingTier, name_fr: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇬🇧 English</Label>
                          <Input
                            value={editingTier.name_en}
                            onChange={(e) => setEditingTier({ ...editingTier, name_en: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇪🇸 Español</Label>
                          <Input
                            value={editingTier.name_es}
                            onChange={(e) => setEditingTier({ ...editingTier, name_es: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇩🇪 Deutsch</Label>
                          <Input
                            value={editingTier.name_de}
                            onChange={(e) => setEditingTier({ ...editingTier, name_de: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇮🇹 Italiano</Label>
                          <Input
                            value={editingTier.name_it}
                            onChange={(e) => setEditingTier({ ...editingTier, name_it: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇵🇹 Português</Label>
                          <Input
                            value={editingTier.name_pt}
                            onChange={(e) => setEditingTier({ ...editingTier, name_pt: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇸🇦 العربية</Label>
                          <Input
                            value={editingTier.name_ar}
                            onChange={(e) => setEditingTier({ ...editingTier, name_ar: e.target.value })}
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇨🇳 中文</Label>
                          <Input
                            value={editingTier.name_zh}
                            onChange={(e) => setEditingTier({ ...editingTier, name_zh: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇯🇵 日本語</Label>
                          <Input
                            value={editingTier.name_ja}
                            onChange={(e) => setEditingTier({ ...editingTier, name_ja: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">🇷🇺 Русский</Label>
                          <Input
                            value={editingTier.name_ru}
                            onChange={(e) => setEditingTier({ ...editingTier, name_ru: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveTier} disabled={saving !== null} className="bg-gold hover:bg-gold/90">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminSubscriptions;
