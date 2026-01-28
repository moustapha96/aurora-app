import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketplaceItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  currency: string;
  main_image_url: string | null;
  additional_images: string[];
  offer_end_date: string | null;
  reservation_until_date: string | null;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MarketplaceItemFormData {
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  main_image_url: string | null;
  additional_images: string[];
  offer_end_date: string | null;
  reservation_until_date: string | null;
}

export const MARKETPLACE_CATEGORIES = [
  'immobilier',
  'automobile',
  'art',
  'horlogerie',
  'joaillerie',
  'vin',
  'jets_yachts',
  'rare_objects',
  'investissements',
  'mode_luxe',
  'autres'
];

export const useMarketplace = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchItems = async (category?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Cast the data to ensure proper typing
      const typedData = (data || []).map(item => ({
        ...item,
        additional_images: item.additional_images || [],
        reservation_until_date: null,
        status: item.status as 'active' | 'sold' | 'expired' | 'cancelled'
      }));
      
      setItems(typedData);
    } catch (error: any) {
      console.error('Error fetching marketplace items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyItems = async () => {
    if (!currentUserId) return;
    
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        additional_images: item.additional_images || [],
        reservation_until_date: null,
        status: item.status as 'active' | 'sold' | 'expired' | 'cancelled'
      }));
      
      setMyItems(typedData);
    } catch (error: any) {
      console.error('Error fetching my items:', error);
    }
  };

  const createItem = async (formData: MarketplaceItemFormData): Promise<boolean> => {
    if (!currentUserId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return false;
    }

    console.log('[Marketplace] Creating item with data:', {
      title: formData.title,
      category: formData.category,
      main_image_url: formData.main_image_url,
      additional_images: formData.additional_images,
      price: formData.price
    });

    try {
      // Clean image URLs (remove cache busters for storage)
      const cleanMainImageUrl = formData.main_image_url 
        ? formData.main_image_url.split('?')[0] 
        : null;
      const cleanAdditionalImages = formData.additional_images.map(url => url.split('?')[0]);

      console.log('[Marketplace] Cleaned URLs:', { cleanMainImageUrl, cleanAdditionalImages });

      const { data, error } = await supabase
        .from('marketplace_items')
        .insert({
          user_id: currentUserId,
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          price: formData.price,
          currency: formData.currency,
          main_image_url: cleanMainImageUrl,
          additional_images: cleanAdditionalImages,
          offer_end_date: formData.offer_end_date
        })
        .select()
        .single();

      if (error) {
        console.error('[Marketplace] Insert error:', error);
        throw error;
      }

      console.log('[Marketplace] Item created successfully:', data);

      toast({
        title: "Succès",
        description: "Article ajouté avec succès"
      });

      await fetchItems();
      await fetchMyItems();
      return true;
    } catch (error: any) {
      console.error('[Marketplace] Error creating item:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'article",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateItem = async (id: string, formData: Partial<MarketplaceItemFormData>): Promise<boolean> => {
    if (!currentUserId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return false;
    }

    console.log('[Marketplace] Updating item:', id, formData);

    try {
      // First, verify that the item belongs to the current user
      const { data: item, error: fetchError } = await supabase
        .from('marketplace_items')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (!item || item.user_id !== currentUserId) {
        toast({
          title: "Erreur",
          description: "Vous n'êtes pas autorisé à modifier cet article",
          variant: "destructive"
        });
        return false;
      }

      // Clean image URLs (remove cache busters for storage)
      const updateData: Record<string, any> = {
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      if (formData.main_image_url !== undefined) {
        updateData.main_image_url = formData.main_image_url 
          ? formData.main_image_url.split('?')[0] 
          : null;
      }
      
      if (formData.additional_images !== undefined) {
        updateData.additional_images = formData.additional_images.map(url => url.split('?')[0]);
      }

      console.log('[Marketplace] Update data:', updateData);

      const { error } = await supabase
        .from('marketplace_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', currentUserId); // Additional security check

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Article mis à jour"
      });

      await fetchItems();
      await fetchMyItems();
      return true;
    } catch (error: any) {
      console.error('[Marketplace] Error updating item:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'article",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    if (!currentUserId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return false;
    }

    try {
      // First, verify that the item belongs to the current user
      const { data: item, error: fetchError } = await supabase
        .from('marketplace_items')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (!item || item.user_id !== currentUserId) {
        toast({
          title: "Erreur",
          description: "Vous n'êtes pas autorisé à supprimer cet article",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId); // Additional security check

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Article supprimé"
      });

      await fetchItems();
      await fetchMyItems();
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

  const markAsSold = async (id: string): Promise<boolean> => {
    if (!currentUserId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return false;
    }

    try {
      // First, verify that the item belongs to the current user
      const { data: item, error: fetchError } = await supabase
        .from('marketplace_items')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (!item || item.user_id !== currentUserId) {
        toast({
          title: "Erreur",
          description: "Vous n'êtes pas autorisé à marquer cet article comme vendu",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('marketplace_items')
        .update({ status: 'sold' })
        .eq('id', id)
        .eq('user_id', currentUserId); // Additional security check

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Article marqué comme vendu"
      });

      await fetchItems();
      await fetchMyItems();
      return true;
    } catch (error: any) {
      console.error('Error marking as sold:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer l'article comme vendu",
        variant: "destructive"
      });
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!currentUserId) {
      console.error('[Marketplace] No user ID for upload');
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader une image",
        variant: "destructive"
      });
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;
      
      // Get correct MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'heif': 'image/heif'
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      
      console.log('[Marketplace] Uploading image:', { filePath, contentType, size: file.size });
      
      // Create a properly typed Blob to ensure content-type is set correctly
      const typedBlob = new Blob([file], { type: contentType });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(filePath, typedBlob, { 
          contentType,
          upsert: true
        });

      if (uploadError) {
        console.error('[Marketplace] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[Marketplace] Upload success:', uploadData);

      const { data } = supabase.storage
        .from('marketplace-images')
        .getPublicUrl(filePath);

      // Add cache buster for immediate visibility
      const publicUrl = data.publicUrl + '?t=' + Date.now();
      console.log('[Marketplace] Public URL:', publicUrl);

      return publicUrl;
    } catch (error: any) {
      console.error('[Marketplace] Error uploading image:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'uploader l'image",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMyItems();
    }
  }, [currentUserId]);

  return {
    items,
    myItems,
    loading,
    currentUserId,
    fetchItems,
    fetchMyItems,
    createItem,
    updateItem,
    deleteItem,
    markAsSold,
    uploadImage,
    categories: MARKETPLACE_CATEGORIES
  };
};
