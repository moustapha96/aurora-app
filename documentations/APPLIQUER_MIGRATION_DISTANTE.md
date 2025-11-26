# Appliquer la Migration sur Supabase Distant

**Date** : Décembre 2024

---

## 🚀 Méthode 1 : Via Supabase Dashboard (Recommandé)

### Étapes :

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet : `snxhqxsbncmlusymvkwo`

2. **Ouvrir SQL Editor**
   - Dans le menu de gauche, cliquer sur "SQL Editor"
   - Cliquer sur "New query"

3. **Copier le contenu de la migration**
   - Ouvrir le fichier : `supabase/migrations/20241203000000_create_network_content.sql`
   - Copier tout le contenu

4. **Coller et exécuter**
   - Coller le SQL dans l'éditeur
   - Cliquer sur "Run" ou appuyer sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

5. **Vérifier le résultat**
   - Vous devriez voir "Success. No rows returned"
   - Vérifier dans "Table Editor" que la table `network_content` existe
   - Vérifier dans "Storage" que le bucket `network-content` existe

---

## 🔧 Méthode 2 : Via Supabase CLI (Linking)

### Étapes :

1. **Lier le projet local au projet distant**
   ```bash
   npx supabase link --project-ref snxhqxsbncmlusymvkwo
   ```
   - Vous devrez entrer votre access token (trouvable dans Supabase Dashboard > Settings > Access Tokens)

2. **Appliquer la migration**
   ```bash
   npx supabase db push
   ```

---

## 📋 Méthode 3 : Script SQL Direct

Si vous préférez utiliser le script SQL complet :

1. **Ouvrir Supabase Dashboard > SQL Editor**

2. **Copier le contenu de** : `documentations/SCRIPT_SETUP_NETWORK.sql`

3. **Exécuter le script**

---

## ✅ Vérification

Après avoir appliqué la migration, vérifiez :

### 1. Table créée
```sql
SELECT * FROM network_content LIMIT 1;
```

### 2. Bucket créé
```sql
SELECT * FROM storage.buckets WHERE id = 'network-content';
```

### 3. Policies actives
```sql
-- RLS Policies
SELECT * FROM pg_policies 
WHERE tablename = 'network_content';

-- Storage Policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%network content%';
```

---

## 🎯 Prochaines étapes

Une fois la migration appliquée :

1. ✅ Tester la création de contenu dans `/network`
2. ✅ Tester l'upload d'images
3. ✅ Vérifier les permissions d'accès

---

**Note** : Si vous avez des erreurs, consultez `documentations/GUIDE_SETUP_SUPABASE_NETWORK.md` pour le dépannage.

