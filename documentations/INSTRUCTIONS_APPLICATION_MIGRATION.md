# Instructions - Application de la Migration Network Content

**Projet Supabase** : `snxhqxsbncmlusymvkwo`  
**Date** : Décembre 2024

---

## 🎯 Méthode Rapide (Recommandée)

### Via Supabase Dashboard

1. **Ouvrir Supabase Dashboard**
   - Aller sur : https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Menu de gauche → **SQL Editor**
   - Cliquer sur **"New query"**

3. **Copier-coller le SQL**
   - Ouvrir le fichier : `supabase/migrations/20241203000000_create_network_content.sql`
   - **Copier TOUT le contenu**
   - **Coller dans l'éditeur SQL**

4. **Exécuter**
   - Cliquer sur **"Run"** (ou `Ctrl+Enter` / `Cmd+Enter`)
   - Attendre le message "Success"

5. **Vérifier**
   - Menu → **Table Editor** → Vérifier que `network_content` existe
   - Menu → **Storage** → Vérifier que `network-content` existe

---

## ✅ Vérification Rapide

Après exécution, tester avec ces requêtes SQL :

```sql
-- Vérifier la table
SELECT * FROM network_content LIMIT 1;

-- Vérifier le bucket
SELECT * FROM storage.buckets WHERE id = 'network-content';

-- Vérifier les policies RLS
SELECT policyname FROM pg_policies 
WHERE tablename = 'network_content';
```

Vous devriez voir :
- ✅ La table existe
- ✅ Le bucket existe
- ✅ 5 policies RLS actives

---

## 🚨 En cas d'erreur

Si vous avez une erreur, consultez `documentations/GUIDE_SETUP_SUPABASE_NETWORK.md` section "Dépannage".

Les erreurs courantes :
- `function update_updated_at_column() does not exist` → La fonction sera créée automatiquement
- `bucket already exists` → Normal, le script utilise `ON CONFLICT DO NOTHING`
- `policy already exists` → Normal si vous réexécutez, le script utilise `DROP POLICY IF EXISTS`

---

**C'est tout !** Une fois appliqué, la fonctionnalité Network sera opérationnelle.

