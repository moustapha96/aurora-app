# Instructions de Déploiement - Correction CORS

## Problème
L'erreur CORS persiste car la fonction Edge `create-admin` n'a pas été redéployée après les modifications.

## Solution

### Option 1 : Via Supabase CLI (Recommandé)

1. **Lier le projet** (si pas déjà fait) :
```bash
npx supabase link --project-ref lwfqselpqlliaxduxihu
```

2. **Redéployer la fonction** :
```bash
npx supabase functions deploy create-admin
```

### Option 2 : Via Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Edge Functions**
4. Trouvez la fonction `create-admin`
5. Cliquez sur **Deploy** ou **Redeploy**
6. Copiez le contenu de `supabase/functions/create-admin/index.ts` dans l'éditeur

### Option 3 : Via Supabase CLI avec credentials

Si vous avez les credentials :
```bash
npx supabase functions deploy create-admin --project-ref lwfqselpqlliaxduxihu
```

## Vérification

Après le déploiement :

1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Ou testez en navigation privée
3. Essayez de créer un admin à nouveau

## Modifications Apportées

1. **Statut OPTIONS** : Changé de 200 à 204 (No Content) - standard pour OPTIONS
2. **Headers CORS** : Ajout de `Access-Control-Allow-Credentials`
3. **Headers complets** : Tous les headers CORS nécessaires sont inclus

## Si l'erreur persiste

1. Vérifiez que la fonction est bien déployée
2. Vérifiez les logs de la fonction dans le dashboard Supabase
3. Vérifiez que l'URL de la fonction est correcte
4. Testez avec un outil comme Postman ou curl pour isoler le problème

