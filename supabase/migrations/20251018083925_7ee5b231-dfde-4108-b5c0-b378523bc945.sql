-- Ajouter les colonnes pour stocker la monnaie et l'unité d'origine du patrimoine
ALTER TABLE public.profiles 
ADD COLUMN wealth_currency text,
ADD COLUMN wealth_unit text,
ADD COLUMN wealth_amount text;