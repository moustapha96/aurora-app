# Base de Données et Relations - Aurora Society

**Version** : 1.0.0  
**Date** : Décembre 2024

---

## 1. Vue d'Ensemble

La base de données Aurora Society utilise **PostgreSQL** via Supabase avec :
- **21 tables principales**
- **Row Level Security (RLS)** sur toutes les tables
- **Relations** via clés étrangères
- **Functions SQL** pour la logique métier
- **Triggers** pour automatisation

---

## 2. Schéma de la Base de Données

### 2.1 Tables Principales

#### `profiles` - Profils Utilisateurs

**Description** : Table centrale contenant les informations de base de chaque membre

**Colonnes** :
| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | ID unique (PK) | FK → auth.users(id), ON DELETE CASCADE |
| `first_name` | TEXT | Prénom | NOT NULL |
| `last_name` | TEXT | Nom | NOT NULL |
| `honorific_title` | TEXT | Titre honorifique | NULL |
| `mobile_phone` | TEXT | Téléphone mobile | NOT NULL |
| `username` | TEXT | Nom d'utilisateur | UNIQUE |
| `avatar_url` | TEXT | URL de l'avatar | NULL |
| `job_function` | TEXT | Fonction professionnelle | NULL |
| `activity_domain` | TEXT | Domaine d'activité | NULL |
| `country` | TEXT | Pays | NULL |
| `personal_quote` | TEXT | Citation personnelle | NULL |
| `wealth_amount` | TEXT | Montant de la fortune | NULL |
| `wealth_billions` | TEXT | Fortune en milliards d'euros | NULL |
| `wealth_currency` | TEXT | Devise (EUR, USD, etc.) | NULL |
| `wealth_unit` | TEXT | Unité (M, Md) | NULL |
| `is_founder` | BOOLEAN | Est fondateur | DEFAULT false |
| `is_patron` | BOOLEAN | Est mécène | DEFAULT false |
| `biometric_enabled` | BOOLEAN | Auth biométrique activée | DEFAULT false |
| `referral_code` | TEXT | Code de parrainage | NULL, UNIQUE |
| `id_card_url` | TEXT | URL carte d'identité | NULL |
| `created_at` | TIMESTAMPTZ | Date de création | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour | DEFAULT now() |

**Relations** :
- `id` → `auth.users(id)` (1:1)
- `id` → `business_content(user_id)` (1:1)
- `id` → `family_content(user_id)` (1:1)
- `id` → `personal_content(user_id)` (1:1)
- `id` → `network_content(user_id)` (1:N)
- `id` → `friendships(user_id, friend_id)` (1:N)
- `id` → `user_roles(user_id)` (1:N)

**RLS Policies** :
- Users can view their own profile
- Users can view friends' profiles (via friendships)
- Admins can view all profiles
- Users can update their own profile
- Users can insert their own profile

---

#### `user_roles` - Rôles Utilisateurs

**Description** : Attribution des rôles aux utilisateurs

**Colonnes** :
| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | ID unique (PK) | DEFAULT gen_random_uuid() |
| `user_id` | UUID | ID utilisateur | FK → auth.users(id), NOT NULL |
| `role` | app_role | Rôle (admin, member) | NOT NULL |

**Contraintes** :
- UNIQUE(user_id, role)

**Relations** :
- `user_id` → `auth.users(id)` (N:1)

**RLS Policies** :
- Users can view their own roles
- Admins can view all roles
- System can insert roles via trigger
- Admins can update roles

---

#### `business_content` - Contenu Professionnel

**Description** : Informations professionnelles et d'entreprise

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `company_name` | TEXT | Nom de l'entreprise |
| `position_title` | TEXT | Titre du poste |
| `company_description` | TEXT | Description entreprise |
| `company_logo_url` | TEXT | URL du logo |
| `company_photos` | TEXT[] | Tableau d'URLs photos |
| `portfolio_text` | TEXT | Texte portfolio (HTML) |
| `achievements_text` | TEXT | Réalisations (HTML) |
| `vision_text` | TEXT | Vision (HTML) |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Relations** :
- `user_id` → `profiles(id)` (1:1)

**RLS Policies** :
- Users can view their own business content
- Users can view friends' business content if business_access = true
- Users can update their own business content
- Users can insert their own business content

---

#### `family_content` - Contenu Familial

**Description** : Informations familiales, résidences, philanthropie

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `bio` | TEXT | Biographie longue (HTML) |
| `family_text` | TEXT | Texte famille (HTML) |
| `residences_text` | TEXT | Résidences (HTML) |
| `philanthropy_text` | TEXT | Philanthropie (HTML) |
| `network_text` | TEXT | Réseau (HTML) |
| `anecdotes_text` | TEXT | Anecdotes (HTML) |
| `personal_quote` | TEXT | Citation personnelle |
| `portrait_url` | TEXT | URL portrait |
| `gallery_photos` | TEXT[] | Tableau URLs photos galerie |
| `pdf_documents` | TEXT[] | Tableau URLs documents PDF |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Relations** :
- `user_id` → `profiles(id)` (1:1)

**RLS Policies** :
- Users can view their own family content
- Users can view friends' family content if family_access = true
- Users can update their own family content
- Users can insert their own family content

---

#### `personal_content` - Contenu Personnel

**Description** : Contenu personnel général (non utilisé actuellement, remplacé par tables spécialisées)

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `content` | TEXT | Contenu (HTML) |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

---

#### `network_content` - Contenu Réseau/Influence

**Description** : Contenu d'influence sociale et réseau

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `section_id` | TEXT | Section (social, media, philanthropy) | CHECK |
| `title` | TEXT | Titre section |
| `content` | TEXT | Contenu (HTML) |
| `image_url` | TEXT | URL image |
| `social_links` | JSONB | Liens sociaux {instagram, linkedin, twitter, facebook, website} |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Contraintes** :
- UNIQUE(user_id, section_id)
- CHECK(section_id IN ('social', 'media', 'philanthropy'))

**Relations** :
- `user_id` → `profiles(id)` (1:N)

---

### 2.2 Tables de Collections

#### `artwork_collection` - Collection d'Art

**Description** : Œuvres d'art des membres

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `title` | TEXT | Titre œuvre |
| `artist` | TEXT | Artiste |
| `year` | TEXT | Année |
| `medium` | TEXT | Medium |
| `price` | TEXT | Prix |
| `acquisition` | TEXT | Acquisition |
| `description` | TEXT | Description |
| `image_url` | TEXT | URL image |
| `display_order` | INTEGER | Ordre affichage |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Relations** :
- `user_id` → `profiles(id)` (N:1)

---

#### `sports_hobbies` - Sports et Hobbies

**Description** : Sports et hobbies personnalisés

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `title` | TEXT | Titre |
| `description` | TEXT | Description |
| `badge_text` | TEXT | Texte badge |
| `display_order` | INTEGER | Ordre affichage |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

---

#### `curated_sports` - Sports Organisés

**Description** : Sports avec statistiques détaillées (Yachting, Polo, Chasse)

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `sport_type` | TEXT | Type (yachting, polo, chasse) |
| `title` | TEXT | Titre |
| `subtitle` | TEXT | Sous-titre |
| `description` | TEXT | Description |
| `image_url` | TEXT | URL image |
| `badge_text` | TEXT | Texte badge |
| `stat1_label` | TEXT | Label stat 1 |
| `stat1_value` | TEXT | Valeur stat 1 |
| `stat2_label` | TEXT | Label stat 2 |
| `stat2_value` | TEXT | Valeur stat 2 |
| `stat3_label` | TEXT | Label stat 3 |
| `stat3_value` | TEXT | Valeur stat 3 |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Contraintes** :
- UNIQUE(user_id, sport_type)

---

#### `destinations` - Destinations

**Description** : Destinations de voyage

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `lieu` | TEXT | Lieu |
| `type` | TEXT | Type |
| `saison` | TEXT | Saison |
| `display_order` | INTEGER | Ordre affichage |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

---

#### `exhibitions` - Expositions

**Description** : Expositions et événements

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `title` | TEXT | Titre |
| `location` | TEXT | Localisation |
| `year` | TEXT | Année |
| `role` | TEXT | Rôle |
| `display_order` | INTEGER | Ordre affichage |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

---

#### `social_influence` - Influence Sociale

**Description** : Métriques d'influence sociale

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `platform` | TEXT | Plateforme |
| `metric` | TEXT | Métrique |
| `value` | TEXT | Valeur |
| `description` | TEXT | Description |
| `image_url` | TEXT | URL image |
| `display_order` | INTEGER | Ordre affichage |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

---

### 2.3 Tables de Relations

#### `friendships` - Relations entre Membres

**Description** : Connexions entre membres avec permissions granulaires

**Colonnes** :
| Colonne | Type | Description | Contraintes |
|---------|------|-------------|-------------|
| `id` | UUID | ID unique (PK) | DEFAULT gen_random_uuid() |
| `user_id` | UUID | ID utilisateur | FK → profiles(id), NOT NULL |
| `friend_id` | UUID | ID ami | FK → profiles(id), NOT NULL |
| `business_access` | BOOLEAN | Accès business | DEFAULT true |
| `family_access` | BOOLEAN | Accès family | DEFAULT true |
| `personal_access` | BOOLEAN | Accès personal | DEFAULT true |
| `influence_access` | BOOLEAN | Accès influence | DEFAULT true |
| `network_access` | BOOLEAN | Accès network | DEFAULT true |
| `created_at` | TIMESTAMPTZ | Date création | DEFAULT now() |

**Contraintes** :
- UNIQUE(user_id, friend_id)
- CHECK(user_id != friend_id)

**Relations** :
- `user_id` → `profiles(id)` (N:1)
- `friend_id` → `profiles(id)` (N:1)

**Note** : Les relations sont bidirectionnelles (deux lignes par connexion)

---

#### `connection_requests` - Demandes de Connexion

**Description** : Demandes de connexion entre membres

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `requester_id` | UUID | ID demandeur (FK → profiles.id) |
| `recipient_id` | UUID | ID destinataire (FK → profiles.id) |
| `status` | TEXT | Statut (pending, accepted, rejected) |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Relations** :
- `requester_id` → `profiles(id)` (N:1)
- `recipient_id` → `profiles(id)` (N:1)

---

### 2.4 Tables de Messagerie

#### `conversations` - Conversations

**Description** : Conversations entre membres

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `type` | TEXT | Type (private, group) |
| `title` | TEXT | Titre (optionnel) |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

---

#### `conversation_members` - Membres Conversations

**Description** : Membres des conversations

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `conversation_id` | UUID | ID conversation (FK → conversations.id) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `joined_at` | TIMESTAMPTZ | Date adhésion |

**Relations** :
- `conversation_id` → `conversations(id)` (N:1)
- `user_id` → `profiles(id)` (N:1)

---

#### `messages` - Messages

**Description** : Messages dans les conversations

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `conversation_id` | UUID | ID conversation (FK → conversations.id) |
| `sender_id` | UUID | ID expéditeur (FK → profiles.id) |
| `content` | TEXT | Contenu message |
| `is_read` | BOOLEAN | Message lu | DEFAULT false |
| `created_at` | TIMESTAMPTZ | Date création |

**Relations** :
- `conversation_id` → `conversations(id)` (N:1)
- `sender_id` → `profiles(id)` (N:1)

---

### 2.5 Tables Système

#### `app_settings` - Paramètres Application

**Description** : Paramètres globaux de l'application

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `key` | TEXT | Clé paramètre | UNIQUE |
| `value` | TEXT | Valeur |
| `description` | TEXT | Description |
| `created_at` | TIMESTAMPTZ | Date création |
| `updated_at` | TIMESTAMPTZ | Date mise à jour |

**Paramètres courants** :
- `defaultRole` : Rôle par défaut pour nouveaux utilisateurs
- `maxReferralsPerUser` : Nombre max de parrainages par utilisateur

---

#### `referrals` - Système de Parrainage

**Description** : Relations de parrainage

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `referrer_id` | UUID | ID parrain (FK → profiles.id) |
| `referred_id` | UUID | ID filleul (FK → profiles.id) |
| `referral_code` | TEXT | Code utilisé |
| `created_at` | TIMESTAMPTZ | Date création |

**Relations** :
- `referrer_id` → `profiles(id)` (N:1)
- `referred_id` → `profiles(id)` (N:1)

---

#### `user_activities` - Activités Utilisateurs

**Description** : Historique des activités utilisateurs

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `activity_type` | TEXT | Type activité |
| `activity_data` | JSONB | Données activité |
| `created_at` | TIMESTAMPTZ | Date création |

---

#### `contact_messages` - Messages Contact

**Description** : Messages du formulaire de contact

**Colonnes** :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (PK) |
| `user_id` | UUID | ID utilisateur (FK → profiles.id) |
| `subject` | TEXT | Sujet |
| `message` | TEXT | Message |
| `status` | TEXT | Statut (new, read, replied) |
| `created_at` | TIMESTAMPTZ | Date création |

---

## 3. Relations entre Tables

### 3.1 Schéma Relationnel Principal

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ├──→ business_content (1:1)
    ├──→ family_content (1:1)
    ├──→ personal_content (1:1)
    ├──→ network_content (1:N)
    ├──→ artwork_collection (1:N)
    ├──→ sports_hobbies (1:N)
    ├──→ curated_sports (1:N)
    ├──→ destinations (1:N)
    ├──→ exhibitions (1:N)
    ├──→ social_influence (1:N)
    ├──→ friendships (1:N) [user_id]
    ├──→ friendships (1:N) [friend_id]
    ├──→ connection_requests (1:N) [requester_id]
    ├──→ connection_requests (1:N) [recipient_id]
    ├──→ conversation_members (1:N)
    ├──→ messages (1:N) [sender_id]
    ├──→ referrals (1:N) [referrer_id]
    ├──→ referrals (1:N) [referred_id]
    ├──→ user_activities (1:N)
    ├──→ contact_messages (1:N)
    └──→ user_roles (1:N)
```

### 3.2 Relations Bidirectionnelles

**friendships** :
- Relation bidirectionnelle : si A est ami avec B, il y a deux lignes :
  - (user_id=A, friend_id=B)
  - (user_id=B, friend_id=A)
- Les permissions sont identiques dans les deux sens

---

## 4. Functions SQL

### 4.1 `handle_new_user()`

**Description** : Trigger automatique lors de la création d'un utilisateur

**Actions** :
1. Crée un profil dans `profiles`
2. Attribue le rôle par défaut (`member` ou depuis `app_settings`)
3. Génère un code de parrainage unique

**Déclencheur** : `AFTER INSERT ON auth.users`

---

### 4.2 `has_role(_user_id UUID, _role app_role)`

**Description** : Vérifie si un utilisateur a un rôle spécifique

**Retour** : BOOLEAN

**Usage** :
```sql
SELECT has_role(user_id, 'admin');
```

---

### 4.3 `create_private_conversation(other_user_id UUID)`

**Description** : Crée une conversation privée entre deux utilisateurs

**Retour** : UUID (ID de la conversation)

---

### 4.4 `is_conversation_member(conv_id UUID, user_id UUID)`

**Description** : Vérifie si un utilisateur est membre d'une conversation

**Retour** : BOOLEAN

---

### 4.5 `validate_referral_code(code TEXT)`

**Description** : Valide un code de parrainage

**Retour** : BOOLEAN

---

## 5. Row Level Security (RLS)

### 5.1 Principes

- **Toutes les tables** ont RLS activé
- **Politiques par opération** : SELECT, INSERT, UPDATE, DELETE
- **Vérification basée sur** :
  - `auth.uid()` : ID de l'utilisateur connecté
  - Relations `friendships` : Pour l'accès aux profils d'amis
  - Permissions granulaires : Pour l'accès aux sections

### 5.2 Exemples de Policies

**profiles - SELECT** :
```sql
-- Users can view their own profile
USING (auth.uid() = id)

-- Users can view friends' profiles
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id = auth.uid() AND friend_id = profiles.id)
       OR (friend_id = auth.uid() AND user_id = profiles.id)
  )
)

-- Admins can view all profiles
USING (has_role(auth.uid(), 'admin'))
```

**business_content - SELECT** :
```sql
-- Users can view their own content
USING (auth.uid() = user_id)

-- Users can view friends' content if business_access = true
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE ((user_id = auth.uid() AND friend_id = business_content.user_id)
        OR (friend_id = auth.uid() AND user_id = business_content.user_id))
      AND business_access = true
  )
)
```

---

## 6. Indexes

### 6.1 Indexes Principaux

- `profiles.id` : PRIMARY KEY
- `profiles.referral_code` : UNIQUE INDEX
- `profiles.username` : UNIQUE INDEX
- `friendships(user_id, friend_id)` : UNIQUE INDEX
- `connection_requests(requester_id, recipient_id)` : INDEX
- `network_content(user_id, section_id)` : UNIQUE INDEX
- `curated_sports(user_id, sport_type)` : UNIQUE INDEX

---

## 7. Storage Buckets

### 7.1 Buckets Supabase Storage

1. **avatars** : Photos de profil
   - Chemin : `{user_id}/avatar.{ext}`

2. **business-content** : Images business
   - Chemin : `{user_id}/{filename}`

3. **family-content** : Images family
   - Chemin : `{user_id}/{filename}`

4. **personal-content** : Images personnelles
   - Chemin : `{user_id}/{filename}`

5. **network-content** : Images réseau
   - Chemin : `{user_id}/{filename}`

**Politiques Storage** :
- Les utilisateurs peuvent uploader dans leur propre dossier
- Les fichiers sont publics (URLs publiques)
- Taille max : Configurable via Supabase

---

**Document suivant** : [Guide Utilisateur - Membre](./05-GUIDE_UTILISATEUR_MEMBRE.md)

