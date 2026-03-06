import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeaderBackButton } from "@/components/BackButton";
import { LinkedAccountGuard } from "@/components/LinkedAccountGuard";
import { MarketplaceItemCard, MarketplaceItemForm } from "@/components/marketplace";
import { useMarketplace, MARKETPLACE_CATEGORIES } from "@/hooks/useMarketplace";
import { toast } from "sonner";
import { 
  Watch, Palette, Plane, Gem, Home, Wine, Package, Crown, 
  Plus, Loader2, ShoppingBag, Store
} from "lucide-react";

const MarketplaceContent = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    items,
    loading,
    fetchItems,
    categories 
  } = useMarketplace();

  // Catégories qui ont au moins un article (ordre conservé) et effectifs
  const { categoriesWithItems, categoryCounts } = useMemo(() => {
    const counts = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    const withItems = categories.filter((cat) => (counts[cat] ?? 0) > 0);
    return { categoriesWithItems: withItems, categoryCounts: counts };
  }, [items, categories]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Au premier chargement, sélectionner par défaut une catégorie qui a des éléments
  useEffect(() => {
    if (loading || items.length === 0) return;
    const currentHasItems = selectedCategory && (categoryCounts[selectedCategory] ?? 0) > 0;
    if (!currentHasItems) {
      setSelectedCategory(categoriesWithItems[0] || categories[0] || "");
    }
  }, [loading, items.length, selectedCategory, categoriesWithItems, categories, categoryCounts]);

  // Handle payment success redirect (e.g., from 3D Secure)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success(t('paymentSuccess'));
      setSearchParams({}, { replace: true });
      fetchItems(undefined);
    }
  }, [searchParams, setSearchParams, t, fetchItems]);

  const categoryIcons: Record<string, any> = {
    'immobilier': Home,
    'automobile': Package,
    'art': Palette,
    'horlogerie': Watch,
    'joaillerie': Gem,
    'vin': Wine,
    'jets_yachts': Plane,
    'rare_objects': Package,
    'investissements': Crown,
    'mode_luxe': ShoppingBag,
    'autres': Package
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

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border p-4 sm:p-6 bg-card mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-2">
              {/* <PageHeaderBackButton to={id ? `/profile/${id}` : "/profile"} /> */}
              <PageHeaderBackButton to={"/member-card"} />
              <div>
              <h1 className="text-xl sm:text-2xl font-serif text-primary uppercase tracking-wide">
              {t('privateMarketplace')}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
            {t('privateMarketplaceDesc')}
          </p>  </div>
            </div>
          </div>
        </div>



      <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16">
        {/* Filtres de catégories (sans "Toutes" ; colorées celles qui ont des éléments) */}
        <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || Package;
            const hasItems = (categoryCounts[cat] ?? 0) > 0;
            const isSelected = selectedCategory === cat;
            return (
              <Button
                key={cat}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 ${
                  hasItems
                    ? isSelected
                      ? "bg-primary text-primary-foreground"
                      : "border-primary/50 text-primary hover:bg-primary/10"
                    : "opacity-50 text-muted-foreground hover:opacity-70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{getCategoryLabel(cat)}</span>
                {hasItems && (
                  <span className="text-[10px] opacity-80">({categoryCounts[cat]})</span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Liste des biens (achat uniquement, plus d'ajout par les membres) */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t('noItemsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item) => (
              <MarketplaceItemCard
                key={item.id}
                item={item}
                isOwner={false}
                onPurchaseSuccess={() => fetchItems()}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const Marketplace = () => (
  <LinkedAccountGuard section="marketplace">
    <MarketplaceContent />
  </LinkedAccountGuard>
);

export default Marketplace;
