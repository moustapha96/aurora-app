-- Rendre le bucket personal-content public pour que les photos soient accessibles
UPDATE storage.buckets 
SET public = true 
WHERE id = 'personal-content';