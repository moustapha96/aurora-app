import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronRight, Building2, Globe, Handshake, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type CategoryType = 'offmarket' | 'immobilier' | 'participations' | 'clubdeals';

const CATEGORIES: { key: CategoryType; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'offmarket', label: 'Deals off-market', icon: TrendingUp, description: 'Accès à des transactions confidentielles avant mise sur le marché' },
  { key: 'immobilier', label: 'Immobilier international', icon: Building2, description: 'Propriétés de prestige et investissements immobiliers à travers le monde' },
  { key: 'participations', label: 'Participations privées', icon: Globe, description: 'Entrées au capital de sociétés non cotées à fort potentiel' },
  { key: 'clubdeals', label: 'Club deals entre membres', icon: Handshake, description: 'Co-investissements exclusifs avec d\'autres membres du club' },
];

export const BusinessOpportunities = () => {
  const [expandedCategory, setExpandedCategory] = useState<CategoryType | null>(null);
  const [userDescriptions, setUserDescriptions] = useState<Record<CategoryType, string>>({
    offmarket: '',
    immobilier: '',
    participations: '',
    clubdeals: ''
  });
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCategoryClick = (category: CategoryType) => {
    setExpandedCategory(prev => prev === category ? null : category);
    if (editingCategory && editingCategory !== category) {
      setEditingCategory(null);
    }
  };

  const handleStartEdit = (category: CategoryType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setEditValue(userDescriptions[category]);
  };

  const handleSave = (category: CategoryType) => {
    setUserDescriptions(prev => ({ ...prev, [category]: editValue }));
    setEditingCategory(null);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  return (
    <div className="module-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
          <TrendingUp className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gold">Opportunités d'affaires</h3>
          <p className="text-sm text-gold/60">Accès privilégié aux investissements</p>
        </div>
      </div>

      <p className="text-gold/80 text-sm mb-4">Un accès privilégié à des opportunités d'investissement filtrées, hors des circuits publics.</p>

      <div className="space-y-2">
        {CATEGORIES.map(({ key, label, icon: Icon, description }) => (
          <div key={key}>
            <button 
              onClick={() => handleCategoryClick(key)}
              className="flex items-center gap-2 text-gold/70 hover:text-gold transition-colors w-full group py-1.5"
            >
              {expandedCategory === key ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </button>
            {expandedCategory === key && (
              <div className="ml-6 mt-1 mb-2 p-3 bg-gold/5 rounded-lg border border-gold/10 space-y-3">
                <p className="text-sm text-gold/70">{description}</p>
                
                {editingCategory === key ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Décrivez vos intérêts ou projets pour cette catégorie..."
                      className="min-h-[80px] bg-black/20 border-gold/20 text-gold placeholder:text-gold/40 text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCancel}
                        className="text-gold/60 hover:text-gold hover:bg-gold/10"
                      >
                        Annuler
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(key)}
                        className="bg-gold text-black hover:bg-gold/90"
                      >
                        Valider
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={(e) => handleStartEdit(key, e)}
                    className="cursor-pointer group/edit"
                  >
                    {userDescriptions[key] ? (
                      <p className="text-sm text-gold/80 hover:text-gold transition-colors">
                        {userDescriptions[key]}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gold/40 hover:text-gold/60 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-xs">Ajouter votre description...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-gold/50 italic text-xs pt-3 mt-2 border-t border-gold/10">
        👉 Le bon projet, au bon moment, avec les bonnes personnes.
      </p>
    </div>
  );
};
