# Documentation du Système de Parrainage

## Vue d'ensemble

Le système de parrainage permet aux membres de la plateforme Aurora Society de parrainer d'autres membres et de suivre leurs parrainages. Le système respecte une limite configurable de parrainages par membre, définie dans les paramètres administrateur.

## Fonctionnalités

### Pour les Membres

1. **Visualisation des parrainages**
   - Liste de tous les membres parrainés
   - Statut de chaque parrainage (confirmé, en attente, rejeté)
   - Date de parrainage
   - Statistiques (nombre parrainé, limite, restants)

2. **Code de parrainage**
   - Code unique généré automatiquement
   - Fonction de copie pour partage facile
   - Format : `AURORA-XXXXXX`

3. **Liens de partage personnalisés**
   - Création de liens personnalisés pour suivre les invitations
   - Chaque lien a un code unique : `AURORA-LINK-XXXXXX`
   - Statistiques par lien (nombre de clics, inscriptions)
   - Activation/désactivation des liens
   - Nom personnalisable pour identifier chaque lien
   - Limite configurable par administrateur

4. **Ajout de nouveaux parrainages**
   - Recherche de membres par username, prénom ou nom
   - Ajout manuel de parrainages
   - Vérification automatique des limites

5. **Contrôles de sécurité**
   - Empêche le parrainage de soi-même
   - Empêche les doublons de parrainage
   - Respect de la limite configurée

### Pour les Administrateurs

1. **Configuration**
   - Paramètre `max_referrals_per_user` dans `admin_settings`
   - Valeur par défaut : 10 parrainages par membre
   - Paramètre `max_referral_links_per_user` dans `admin_settings`
   - Valeur par défaut : 5 liens de partage par membre
   - Modifiable via l'interface d'administration

## Structure de la Base de Données

### Table `referral_links`

```sql
CREATE TABLE public.referral_links (
  id UUID PRIMARY KEY,
  sponsor_id UUID NOT NULL,        -- ID du membre qui crée le lien
  link_code TEXT NOT NULL UNIQUE,  -- Code unique du lien (AURORA-LINK-XXXXXX)
  link_name TEXT,                  -- Nom optionnel pour identifier le lien
  referral_code TEXT NOT NULL,     -- Code de parrainage associé
  click_count INTEGER DEFAULT 0,   -- Nombre de clics sur le lien
  registration_count INTEGER DEFAULT 0, -- Nombre d'inscriptions via ce lien
  is_active BOOLEAN DEFAULT true,  -- Activer/désactiver le lien
  expires_at TIMESTAMPTZ,          -- Date d'expiration optionnelle
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

**Index créés :**
- `idx_referral_links_sponsor_id` : Pour les requêtes par sponsor
- `idx_referral_links_link_code` : Pour les recherches par code de lien
- `idx_referral_links_referral_code` : Pour les recherches par code de parrainage
- `idx_referral_links_is_active` : Pour filtrer par statut actif

**Politiques de Sécurité (RLS) :**
- Les utilisateurs peuvent voir, créer, modifier et supprimer leurs propres liens
- Les admins peuvent tout voir

### Table `referral_link_clicks`

```sql
CREATE TABLE public.referral_link_clicks (
  id UUID PRIMARY KEY,
  link_id UUID NOT NULL,           -- ID du lien cliqué
  ip_address INET,                 -- Adresse IP du visiteur
  user_agent TEXT,                 -- User agent du navigateur
  referer TEXT,                    -- Page d'origine
  clicked_at TIMESTAMPTZ NOT NULL  -- Date et heure du clic
);
```

Cette table permet de tracker les clics sur les liens pour les statistiques et analytics.

### Table `referrals`

```sql
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY,
  sponsor_id UUID NOT NULL,        -- ID du membre qui parraine
  referred_id UUID NOT NULL,        -- ID du membre parrainé
  referral_code TEXT NOT NULL,      -- Code de parrainage utilisé
  status TEXT NOT NULL DEFAULT 'pending', -- Statut: 'pending', 'confirmed', 'rejected'
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(referred_id)               -- Un utilisateur ne peut être parrainé qu'une fois
);
```

**Index créés :**
- `idx_referrals_sponsor_id` : Pour les requêtes par sponsor
- `idx_referrals_referred_id` : Pour les requêtes par membre parrainé
- `idx_referrals_referral_code` : Pour les recherches par code
- `idx_referrals_status` : Pour filtrer par statut

### Politiques de Sécurité (RLS)

1. **Lecture (SELECT)**
   - Les utilisateurs peuvent voir leurs propres parrainages (en tant que sponsor)
   - Les utilisateurs peuvent voir qui les a parrainés
   - Les admins peuvent tout voir

2. **Insertion (INSERT)**
   - Les utilisateurs peuvent créer leurs propres parrainages (en tant que sponsor)

3. **Modification/Suppression (UPDATE/DELETE)**
   - Seuls les admins peuvent modifier ou supprimer des parrainages

### Paramètre de Configuration

**Table : `admin_settings`**

| Clé | Valeur par défaut | Description |
|-----|-------------------|-------------|
| `max_referrals_per_user` | `10` | Nombre maximum de parrainages possibles par membre |

## Utilisation

### Accès au Module de Parrainage

1. Naviguer vers `/family`
2. Le module "Parrainage" apparaît dans la grille des modules familiaux
3. Accessible uniquement en mode édition pour le propriétaire du profil

### Ajouter un Parrainage

1. Cliquer sur le bouton "Parrainer un nouveau membre"
2. Rechercher un membre par :
   - Username
   - Prénom
   - Nom
3. Sélectionner le membre trouvé
4. Cliquer sur "Ajouter le parrainage"

**Vérifications automatiques :**
- ✅ Limite de parrainages non atteinte
- ✅ L'utilisateur n'est pas déjà parrainé
- ✅ L'utilisateur ne se parraine pas lui-même

### Consulter les Statistiques

Le module affiche automatiquement :
- **Membres parrainés** : Nombre total de parrainages actifs
- **Parrainages restants** : Nombre de parrainages encore disponibles
- **Limite totale** : Limite configurée dans les paramètres admin

### Copier le Code de Parrainage

1. Le code de parrainage est affiché dans le module
2. Cliquer sur le bouton "Copier"
3. Le code est copié dans le presse-papiers

### Créer et Gérer des Liens de Partage

1. **Créer un nouveau lien**
   - Cliquer sur "Créer un lien" dans la section "Liens de Partage Personnalisés"
   - Optionnellement, donner un nom au lien (ex: "Invitation LinkedIn", "Email famille")
   - Le lien est généré automatiquement avec un code unique

2. **Utiliser un lien**
   - Chaque lien génère une URL : `https://votresite.com/register?link=AURORA-LINK-XXXXXX`
   - Partager cette URL avec vos contacts
   - Les clics et inscriptions sont automatiquement trackés

3. **Gérer les liens**
   - **Activer/Désactiver** : Utiliser le switch pour activer ou désactiver un lien
   - **Copier** : Cliquer sur l'icône de copie pour copier l'URL du lien
   - **Partager** : Utiliser le bouton "Partager" pour partager via l'API native
   - **Supprimer** : Cliquer sur l'icône de suppression pour supprimer un lien

4. **Statistiques**
   - **Clics** : Nombre de fois que le lien a été cliqué
   - **Inscriptions** : Nombre d'inscriptions réussies via ce lien

## Composants Techniques

### `FamilyParrainage.tsx`

Composant React principal pour la gestion des parrainages.

**Props :**
- `isEditable` : Boolean - Active le mode édition
- `onUpdate` : Function - Callback après mise à jour
- `userId` : String (optionnel) - ID de l'utilisateur (pour voir d'autres profils)

**Fonctions principales :**
- `loadData()` : Charge les parrainages et la configuration
- `searchUserByEmail()` : Recherche un membre
- `addReferral()` : Ajoute un nouveau parrainage

### Intégration dans `Family.tsx`

Le module est intégré comme 7ème module dans la page Family :

```tsx
<FamilyModule
  title="Parrainage"
  icon={<Gift className="w-5 h-5" />}
  moduleType="parrainage"
  content=""
  isEditable={isOwnProfile}
  onUpdate={loadAllContent}
  renderContent={() => (
    <FamilyParrainage 
      isEditable={isOwnProfile} 
      onUpdate={loadAllContent}
      userId={id}
    />
  )}
/>
```

## Migration

Le fichier de migration `20251225140000_add_referrals_system.sql` contient :

1. Création de la table `referrals`
2. Création des index
3. Configuration des politiques RLS
4. Création du trigger pour `updated_at`
5. Insertion du paramètre par défaut dans `admin_settings`

**Pour appliquer la migration :**

```bash
# Via Supabase CLI
supabase migration up

# Ou via l'interface Supabase
# Importer le fichier SQL dans l'éditeur SQL
```

## Configuration Administrateur

### Modifier les Limites

1. Accéder à l'interface d'administration
2. Aller dans les paramètres (`/admin/settings`)
3. Modifier les valeurs :
   - `max_referrals_per_user` : Limite de parrainages
   - `max_referral_links_per_user` : Limite de liens de partage
4. Sauvegarder

**Via SQL direct :**

```sql
-- Modifier la limite de parrainages
UPDATE admin_settings 
SET setting_value = '20' 
WHERE setting_key = 'max_referrals_per_user';

-- Modifier la limite de liens de partage
UPDATE admin_settings 
SET setting_value = '10' 
WHERE setting_key = 'max_referral_links_per_user';
```

## Statuts de Parrainage

| Statut | Description |
|--------|-------------|
| `pending` | Parrainage en attente de confirmation |
| `confirmed` | Parrainage confirmé et actif |
| `rejected` | Parrainage rejeté |

## Gestion des Erreurs

### Messages d'Erreur Courants

1. **"Vous avez atteint la limite de X parrainages"**
   - Solution : La limite configurée est atteinte
   - Action : Modifier la limite dans les paramètres admin si nécessaire

2. **"Cet utilisateur a déjà été parrainé"**
   - Solution : Un utilisateur ne peut être parrainé qu'une seule fois
   - Action : Vérifier la liste des parrainages existants

3. **"Vous ne pouvez pas vous parrainer vous-même"**
   - Solution : Auto-parrainage interdit
   - Action : Sélectionner un autre membre

4. **"Aucun utilisateur trouvé"**
   - Solution : Le membre recherché n'existe pas
   - Action : Vérifier l'orthographe ou utiliser le username

## API et Requêtes

### Récupérer les Parrainages d'un Utilisateur

```typescript
const { data, error } = await supabase
  .from('referrals')
  .select(`
    id,
    referred_id,
    status,
    created_at
  `)
  .eq('sponsor_id', userId)
  .order('created_at', { ascending: false });
```

### Ajouter un Parrainage

```typescript
const { error } = await supabase
  .from('referrals')
  .insert({
    sponsor_id: sponsorId,
    referred_id: referredId,
    referral_code: referralCode,
    status: 'confirmed'
  });
```

### Récupérer la Limite Configurée

```typescript
const { data } = await supabase
  .from('admin_settings')
  .select('setting_value')
  .eq('setting_key', 'max_referrals_per_user')
  .single();
```

## Bonnes Pratiques

1. **Vérification des Limites**
   - Toujours vérifier la limite avant d'ajouter un parrainage
   - Afficher clairement le nombre de parrainages restants

2. **Gestion des Erreurs**
   - Afficher des messages d'erreur clairs et informatifs
   - Logger les erreurs pour le débogage

3. **Performance**
   - Utiliser les index créés pour les requêtes
   - Limiter le nombre de résultats lors de la recherche

4. **Sécurité**
   - Respecter les politiques RLS
   - Valider les données côté client et serveur
   - Empêcher les actions malveillantes (auto-parrainage, doublons)

## Liens de Partage Personnalisés

### Avantages

Les liens de partage personnalisés offrent plusieurs avantages :

1. **Suivi Granulaire**
   - Chaque lien peut être nommé et identifié
   - Statistiques détaillées par lien
   - Permet de savoir quelle source d'invitation fonctionne le mieux

2. **Flexibilité**
   - Créer différents liens pour différents canaux (LinkedIn, Email, WhatsApp, etc.)
   - Activer/désactiver des liens selon les besoins
   - Dates d'expiration optionnelles

3. **Analytics**
   - Nombre de clics par lien
   - Taux de conversion (clics → inscriptions)
   - Identification des meilleures sources d'invitation

### Format des Liens

Les liens générés suivent le format :
```
https://votresite.com/register?link=AURORA-LINK-XXXXXX
```

Où `XXXXXX` est une combinaison unique de 6 caractères alphanumériques.

### Traitement des Liens lors de l'Inscription

Lorsqu'un utilisateur clique sur un lien de partage :

1. Le système vérifie que le lien existe et est actif
2. Le système vérifie la date d'expiration si définie
3. Le code de parrainage associé est automatiquement rempli
4. Un clic est enregistré dans `referral_link_clicks`
5. Lors de l'inscription réussie, le compteur `registration_count` est incrémenté

## Évolutions Futures Possibles

1. **Système de Récompenses**
   - Points ou badges pour les parrains actifs
   - Niveaux de parrainage (Bronze, Silver, Gold)

2. **Statistiques Avancées**
   - Graphiques de progression
   - Historique détaillé
   - Export des données
   - Analytics par canal de partage

3. **Notifications**
   - Notification lors de l'ajout d'un parrainage
   - Rappels pour les parrainages en attente
   - Alertes lors de nouveaux clics sur les liens

4. **Intégration avec l'Inscription**
   - Création automatique de parrainage lors de l'inscription avec code
   - Vérification de la limite lors de l'inscription
   - Attribution automatique des inscriptions aux liens de partage

## Support

Pour toute question ou problème concernant le système de parrainage :

1. Vérifier cette documentation
2. Consulter les logs d'erreur dans la console
3. Vérifier les politiques RLS dans Supabase
4. Contacter l'équipe de développement

---

**Dernière mise à jour :** 25 décembre 2024  
**Version :** 1.0.0

