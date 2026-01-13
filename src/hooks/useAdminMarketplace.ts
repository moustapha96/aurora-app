import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MarketplaceItem } from './useMarketplace';

export interface AdminMarketplaceItem extends MarketplaceItem {
  owner_name?: string;
  owner_email?: string;
}

export const useAdminMarketplace = () => {
  const [allItems, setAllItems] = useState<AdminMarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllItems = async (category?: string, status?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles!marketplace_items_user_id_fkey(
            first_name,
            last_name,
            account_number
          )
        `)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []).map(item => {
        const profile = item.profiles as any;
        return {
          ...item,
          additional_images: item.additional_images || [],
          status: item.status as 'active' | 'sold' | 'expired' | 'cancelled',
          owner_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Inconnu',
          owner_email: profile?.account_number || 'N/A'
        };
      });
      
      setAllItems(typedData);
    } catch (error: any) {
      console.error('Error fetching all marketplace items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (id: string, status: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut mis à jour"
      });

      await fetchAllItems();
      return true;
    } catch (error: any) {
      console.error('Error updating item status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Article supprimé"
      });

      await fetchAllItems();
      return true;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  return {
    allItems,
    loading,
    fetchAllItems,
    updateItemStatus,
    deleteItem
  };
};
