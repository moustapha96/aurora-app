import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeaderBackButton } from "@/components/BackButton";
import { LinkedAccountGuard } from "@/components/LinkedAccountGuard";
import { MarketplaceItemCard, MarketplaceItemForm } from "@/components/marketplace";
import { useMarketplace, MARKETPLACE_CATEGORIES } from "@/hooks/useMarketplace";
import { 
  Watch, Palette, Plane, Gem, Home, Wine, Package, Crown, 
  Plus, Loader2, ShoppingBag, Store
} from "lucide-react";

const MarketplaceContent = () => {
  const { t } = useLanguage();
  const { 
    items, 
    myItems, 
    loading, 
    currentUserId,
    fetchItems,
    createItem, 
    updateItem, 
    deleteItem, 
    markAsSold,
    uploadImage,
    categories 
  } = useMarketplace();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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
    fetchItems(category === 'all' ? undefined : category);
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

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
        
        {/* Tabs */}
        <Tabs defaultValue="browse" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList className="grid grid-cols-2 w-full sm:w-auto">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">{t('browseItems')}</span>
                <span className="sm:hidden">{t('browse')}</span>
              </TabsTrigger>
              <TabsTrigger value="myItems" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">{t('myItems')}</span>
                <span className="sm:hidden">{t('myItems')}</span>
              </TabsTrigger>
            </TabsList>

            <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t('sellItem')}
            </Button>
          </div>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange('all')}
                className="flex-shrink-0"
              >
                {t('allCategories')}
              </Button>
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] || Package;
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(cat)}
                    className="flex-shrink-0 flex items-center gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{getCategoryLabel(cat)}</span>
                  </Button>
                );
              })}
            </div>

            {/* Items Grid */}
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
                {filteredItems.map((item) => {
                  const isOwner = item.user_id === currentUserId;
                  return (
                    <MarketplaceItemCard
                      key={item.id}
                      item={item}
                      isOwner={isOwner}
                      onEdit={isOwner ? () => setEditingItem(item) : undefined}
                      onDelete={isOwner ? () => deleteItem(item.id) : undefined}
                      onMarkSold={isOwner ? () => markAsSold(item.id) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Items Tab */}
          <TabsContent value="myItems" className="space-y-6">
            {myItems.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">{t('noItemsYet')}</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addFirstItem')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {myItems.map((item) => (
                  <MarketplaceItemCard
                    key={item.id}
                    item={item}
                    isOwner={true}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => deleteItem(item.id)}
                    onMarkSold={() => markAsSold(item.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Form Dialog */}
        <MarketplaceItemForm
          open={showAddForm || !!editingItem}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddForm(false);
              setEditingItem(null);
            }
          }}
          item={editingItem}
          onSubmit={async (data) => {
            if (editingItem) {
              return await updateItem(editingItem.id, data);
            }
            return await createItem(data);
          }}
          onUploadImage={uploadImage}
        />
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
