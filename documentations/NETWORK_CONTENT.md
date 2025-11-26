# Documentation - Page Network avec Contenu Dynamique

**Date de création** : Décembre 2024  
**Version** : 1.0.0  
**Statut** : ✅ Implémenté

---

## Vue d'ensemble

La page Network permet aux utilisateurs de gérer et personnaliser leur contenu d'influence et de réseau social. Le contenu est maintenant sauvegardé dynamiquement en base de données, permettant une personnalisation complète par utilisateur.

## Architecture

### 1. Base de données

**Table : `network_content`**

Structure de la table :
```sql
CREATE TABLE network_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL CHECK (section_id IN ('social', 'media', 'philanthropy')),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);
```

**Sections disponibles :**
- `social` - Réseaux Sociaux
- `media` - Médias & Couverture Presse
- `philanthropy` - Philanthropie & Engagement

**Champs :**
- `user_id` : ID de l'utilisateur propriétaire
- `section_id` : Identifiant de la section (social, media, philanthropy)
- `title` : Titre de la section
- `content` : Contenu textuel de la section
- `image_url` : URL de l'image de la section
- `social_links` : JSONB contenant les liens sociaux :
  ```json
  {
    "instagram": "@username ou URL",
    "linkedin": "URL LinkedIn",
    "twitter": "@username ou URL",
    "facebook": "URL Facebook",
    "website": "https://..."
  }
  ```

**Migration :** `supabase/migrations/20241203000000_create_network_content.sql`

### 2. Row Level Security (RLS)

**Policies :**
1. **Users can view their own network content** - Les utilisateurs peuvent voir leur propre contenu
2. **Users can view friends network content** - Les utilisateurs peuvent voir le contenu de leurs amis si `network_access = true`
3. **Users can insert their own network content** - Les utilisateurs peuvent créer leur propre contenu
4. **Users can update their own network content** - Les utilisateurs peuvent modifier leur propre contenu
5. **Users can delete their own network content** - Les utilisateurs peuvent supprimer leur propre contenu

### 3. Interface Utilisateur

**Fichier :** `src/pages/Network.tsx`

**Fonctionnalités :**
- ✅ Chargement du contenu depuis la base de données
- ✅ Édition du contenu textuel
- ✅ Upload et modification d'images
- ✅ Gestion des liens sociaux (Instagram, LinkedIn, Twitter, Facebook, Website)
- ✅ Sauvegarde automatique en base de données
- ✅ Indication visuelle des modifications non sauvegardées
- ✅ Gestion des permissions d'accès (propre profil vs profil d'ami)
- ✅ Support des profils publics/privés via `friendships.network_access`

## Utilisation

### Pour l'utilisateur

1. **Accéder à la page Network :**
   - Navigation depuis le profil : `/network`
   - Ou directement : `/network/{user_id}` pour voir le profil d'un autre utilisateur

2. **Éditer une section :**
   - Cliquer sur le bouton "Modifier" dans une section
   - Modifier le contenu textuel dans le textarea
   - Ajouter/modifier les liens sociaux dans le formulaire dédié
   - Uploader une nouvelle image (si propriétaire)
   - Cliquer sur "Enregistrer" pour sauvegarder

3. **Voir les modifications :**
   - Les sections modifiées affichent un indicateur "Modifié"
   - Les champs modifiés sont visuellement différenciés

### Pour le développeur

**Charger le contenu :**
```typescript
const { data: networkData } = await supabase
  .from('network_content')
  .select('*')
  .eq('user_id', userId);
```

**Sauvegarder le contenu :**
```typescript
await supabase
  .from('network_content')
  .upsert({
    user_id: user.id,
    section_id: 'social',
    title: 'Réseaux Sociaux',
    content: 'Contenu...',
    image_url: 'https://...',
    social_links: {
      instagram: '@username',
      linkedin: 'https://linkedin.com/...',
    }
  }, {
    onConflict: 'user_id,section_id'
  });
```

## Gestion des Liens Sociaux

Les liens sociaux sont stockés en JSONB et supportent :
- **Instagram** : `@username` ou URL complète
- **LinkedIn** : URL complète
- **Twitter/X** : `@username` ou URL complète
- **Facebook** : URL complète
- **Website** : URL complète

**Format de stockage :**
```json
{
  "instagram": "@alexandre_duroche",
  "linkedin": "https://linkedin.com/in/alexandre-du-roche",
  "twitter": "@aduroche",
  "facebook": "https://facebook.com/alexandre.duroche",
  "website": "https://alexandreduroche.com"
}
```

**Affichage :**
- Les liens sont automatiquement formatés pour l'affichage
- Les usernames Instagram/Twitter sont convertis en URLs cliquables
- Tous les liens s'ouvrent dans un nouvel onglet (`target="_blank"`)

## Upload d'Images

**Storage :** `network-content` bucket dans Supabase Storage

**Composant utilisé :** `EditableImage`

**Fonctionnalités :**
- Upload d'images depuis l'interface
- Remplacement d'image existante
- Stockage dans le dossier `network-content/{user_id}/`
- Génération automatique d'URL publique
- Édition désactivée pour les profils d'autres utilisateurs

## Permissions d'Accès

### Propriétaire du profil
- ✅ Accès complet (lecture/écriture)
- ✅ Édition de toutes les sections
- ✅ Upload d'images
- ✅ Modification des liens sociaux

### Ami avec `network_access = true`
- ✅ Accès en lecture seule
- ❌ Pas d'édition
- ❌ Pas d'upload d'images

### Autres utilisateurs
- ❌ Pas d'accès
- Message : "Vous n'avez pas accès à cette section du profil"

## Traductions

La page utilise le système de traduction avec les clés suivantes :
- `networkPage` - Titre de la page
- `edit` - Bouton modifier
- `save` - Bouton enregistrer
- `cancel` - Bouton annuler
- `loading` - Chargement
- `error` - Erreur
- `success` - Succès
- `backToProfile` - Retour au profil

**Fichier :** `src/contexts/LanguageContext.tsx`

## Fichiers modifiés/créés

### Nouveaux fichiers

1. `supabase/migrations/20241203000000_create_network_content.sql`
   - Table `network_content`
   - RLS policies
   - Index pour performance

2. `documentations/NETWORK_CONTENT.md`
   - Cette documentation

### Fichiers modifiés

1. `src/pages/Network.tsx`
   - Refactor complet pour charger/sauvegarder depuis la base
   - Ajout de la gestion des liens sociaux
   - Amélioration de l'interface d'édition
   - Gestion des permissions d'accès

## Améliorations futures

### Priorité MOYENNE

1. **Validation des URLs**
   - Valider le format des URLs avant sauvegarde
   - Vérifier que les liens sont accessibles

2. **Prévisualisation des liens**
   - Afficher des aperçus (Open Graph) des liens
   - Icônes pour chaque plateforme sociale

3. **Historique des modifications**
   - Sauvegarder l'historique des changements
   - Permettre la restauration d'une version précédente

### Priorité BASSE

4. **Sections personnalisables**
   - Permettre aux utilisateurs d'ajouter leurs propres sections
   - Gestion dynamique des sections

5. **Intégration avec les APIs sociales**
   - Récupération automatique des données depuis les APIs
   - Synchronisation des followers/abonnés

6. **Analytics**
   - Statistiques de vues par section
   - Tracking des clics sur les liens

## Tests

### Test manuel

1. **Test de base :**
   - Créer un compte et accéder à `/network`
   - Vérifier que les sections sont vides par défaut
   - Ajouter du contenu et sauvegarder
   - Recharger la page et vérifier que le contenu est conservé

2. **Test d'édition :**
   - Modifier le contenu d'une section
   - Vérifier l'indicateur "Modifié"
   - Sauvegarder et vérifier que les modifications sont persistées

3. **Test des liens sociaux :**
   - Ajouter des liens sociaux dans chaque section
   - Vérifier que les liens sont cliquables
   - Vérifier que les usernames sont convertis en URLs

4. **Test des permissions :**
   - Créer deux comptes
   - Vérifier l'accès au profil d'un autre utilisateur
   - Vérifier que l'édition est désactivée pour les autres profils

5. **Test d'upload d'images :**
   - Uploader une image dans une section
   - Vérifier que l'image s'affiche correctement
   - Remplacer l'image et vérifier la mise à jour

## Dépannage

### Problème : Le contenu ne se charge pas

**Vérifications :**
1. La migration a-t-elle été appliquée ?
   ```bash
   npx supabase migration up
   ```

2. L'utilisateur est-il authentifié ?
   - Vérifier dans les logs de la console

3. Y a-t-il des erreurs RLS ?
   - Vérifier les policies dans Supabase Dashboard

### Problème : Impossible de sauvegarder

**Vérifications :**
1. L'utilisateur est-il le propriétaire du profil ?
   - Vérifier `isOwnProfile` dans les logs

2. Y a-t-il des erreurs de validation ?
   - Vérifier que `section_id` est valide (social, media, philanthropy)

3. Le format JSON des `social_links` est-il correct ?
   - Vérifier dans les logs de la console

### Problème : Les images ne s'affichent pas

**Vérifications :**
1. Le bucket `network-content` existe-t-il ?
   - Créer dans Supabase Dashboard > Storage

2. Les permissions du bucket sont-elles correctes ?
   - Vérifier les policies de storage

3. L'URL de l'image est-elle valide ?
   - Vérifier dans les logs de la console

## Déploiement

### 1. Appliquer la migration

```bash
npx supabase migration up
```

### 2. Créer le bucket de storage

Dans Supabase Dashboard :
1. Aller dans Storage
2. Créer un nouveau bucket : `network-content`
3. Configurer les permissions :
   - Public : Non
   - Authenticated users can upload : Oui
   - Authenticated users can view : Oui

### 3. Vérifier les RLS policies

Dans Supabase Dashboard :
1. Aller dans Table Editor > `network_content`
2. Vérifier que les policies sont actives
3. Tester avec un utilisateur authentifié

## Références

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Dernière mise à jour** : Décembre 2024  
**Auteur** : Équipe de développement Aurora Society

