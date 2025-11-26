# Documentation Technique - Aurora Society

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Stack Technologique](#stack-technologique)
4. [Structure du Projet](#structure-du-projet)
5. [Base de Données](#base-de-données)
6. [Fonctionnalités Principales](#fonctionnalités-principales)
7. [Configuration et Installation](#configuration-et-installation)
8. [Déploiement](#déploiement)
9. [API et Intégrations](#api-et-intégrations)
10. [Sécurité](#sécurité)
11. [Internationalisation](#internationalisation)
12. [Guide de Développement](#guide-de-développement)

---

## Vue d'ensemble

**Aurora Society** est une plateforme de réseau social exclusive conçue pour les membres distingués de l'élite mondiale. L'application offre un espace privé et sécurisé où les personnalités influentes peuvent se connecter, partager leurs profils professionnels et personnels, et accéder à des services premium.

### Objectifs du Projet

- Créer un réseau social exclusif pour l'élite mondiale
- Offrir une plateforme de networking haut de gamme
- Fournir des services intégrés (conciergerie, marketplace, metaverse)
- Gérer les permissions d'accès granulaires entre membres
- Maintenir un design premium et élégant

### Public Cible

- Personnalités influentes
- Dirigeants d'entreprise
- Investisseurs et entrepreneurs
- Collectionneurs d'art
- Mécènes et philanthropes

---

## Architecture Technique

### Architecture Frontend

L'application utilise une architecture **Single Page Application (SPA)** basée sur React avec :

- **React Router** pour la navigation côté client
- **React Query** pour la gestion des données et du cache
- **Context API** pour la gestion de l'état global (langue, authentification)
- **Composants modulaires** avec shadcn/ui

### Architecture Backend

- **Supabase** comme Backend-as-a-Service (BaaS)
- **PostgreSQL** pour la base de données relationnelle
- **Edge Functions** (Deno) pour les fonctions serveur
- **Row Level Security (RLS)** pour la sécurité des données

### Flux de Données

```
Frontend (React) 
    ↓
Supabase Client
    ↓
Supabase API
    ↓
PostgreSQL Database
```

---

## Stack Technologique

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 18.3.1 | Framework UI |
| **TypeScript** | 5.8.3 | Typage statique |
| **Vite** | 5.4.19 | Build tool et dev server |
| **React Router** | 6.30.1 | Routing |
| **TanStack Query** | 5.83.0 | Gestion des données |
| **Tailwind CSS** | 3.4.17 | Styling |
| **shadcn/ui** | Latest | Composants UI |
| **Radix UI** | Various | Primitives UI accessibles |
| **Lucide React** | 0.462.0 | Icônes |
| **Sonner** | 1.7.4 | Notifications toast |
| **React Hook Form** | 7.61.1 | Gestion de formulaires |
| **Zod** | 3.25.76 | Validation de schémas |

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| **Supabase** | 2.58.0 | Backend-as-a-Service |
| **PostgreSQL** | 13.0.5 | Base de données |
| **Deno** | Latest | Edge Functions runtime |

### Outils de Développement

| Outil | Usage |
|-------|-------|
| **ESLint** | Linting |
| **TypeScript ESLint** | Linting TypeScript |
| **PostCSS** | Traitement CSS |
| **Autoprefixer** | Préfixes CSS |

---

## Structure du Projet

```
aurora-react-superbase/
├── public/                    # Assets statiques
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── assets/               # Images et médias
│   │   ├── *.jpg
│   │   └── *.png
│   │
│   ├── components/           # Composants React
│   │   ├── ui/              # Composants UI de base (shadcn)
│   │   ├── AccessPermissionsDialog.tsx
│   │   ├── ArtworkEditor.tsx
│   │   ├── AuroraLogo.tsx
│   │   ├── BusinessContentEditor.tsx
│   │   ├── ConnectionRequests.tsx
│   │   ├── CuratedSportEditor.tsx
│   │   ├── EditableImage.tsx
│   │   ├── EditableText.tsx
│   │   ├── FamilyContentEditor.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── NewConversationDialog.tsx
│   │   ├── PersonalContentEditor.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── SocialInfluenceEditor.tsx
│   │   ├── SportsHobbiesEditor.tsx
│   │   └── WealthBadge.tsx
│   │
│   ├── contexts/            # Contextes React
│   │   └── LanguageContext.tsx
│   │
│   ├── hooks/              # Hooks personnalisés
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useOptimizedAvatar.tsx
│   │   └── useProfileAccess.tsx
│   │
│   ├── integrations/       # Intégrations externes
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── lib/                # Utilitaires et helpers
│   │   ├── countries.ts
│   │   ├── currencyConverter.ts
│   │   ├── currencySymbols.ts
│   │   ├── imageOptimization.ts
│   │   ├── industries.ts
│   │   └── utils.ts
│   │
│   ├── pages/             # Pages de l'application
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Profile.tsx
│   │   ├── EditProfile.tsx
│   │   ├── Business.tsx
│   │   ├── Personal.tsx
│   │   ├── Family.tsx
│   │   ├── Members.tsx
│   │   ├── Network.tsx
│   │   ├── Messages.tsx
│   │   ├── Concierge.tsx
│   │   ├── Metaverse.tsx
│   │   ├── Marketplace.tsx
│   │   ├── Payment.tsx
│   │   ├── MemberCard.tsx
│   │   ├── MemberDashboard.tsx
│   │   ├── CreateTestMembers.tsx
│   │   ├── Terms.tsx
│   │   └── NotFound.tsx
│   │
│   ├── App.tsx            # Composant racine
│   ├── App.css
│   ├── index.css          # Styles globaux
│   ├── main.tsx           # Point d'entrée
│   └── vite-env.d.ts
│
├── supabase/
│   ├── config.toml        # Configuration Supabase
│   ├── functions/         # Edge Functions
│   │   ├── _shared/
│   │   │   └── cors.ts
│   │   ├── analyze-id-card/
│   │   │   └── index.ts
│   │   ├── create-test-members/
│   │   │   └── index.ts
│   │   └── migrate-base64-avatars/
│   │       └── index.ts
│   │
│   └── migrations/        # Migrations SQL
│       └── *.sql
│
├── .gitignore
├── components.json        # Configuration shadcn/ui
├── eslint.config.js       # Configuration ESLint
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts     # Configuration Tailwind
├── tsconfig.json          # Configuration TypeScript
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts         # Configuration Vite
```

---

## Base de Données

### Schéma de Base de Données

La base de données PostgreSQL est gérée par Supabase et contient les tables suivantes :

#### Tables Principales

##### `profiles`
Table principale des profils utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique (référence auth.users) |
| `first_name` | TEXT | Prénom |
| `last_name` | TEXT | Nom de famille |
| `username` | TEXT | Nom d'utilisateur (optionnel) |
| `avatar_url` | TEXT | URL de l'avatar |
| `mobile_phone` | TEXT | Téléphone mobile |
| `country` | TEXT | Pays |
| `honorific_title` | TEXT | Titre honorifique |
| `job_function` | TEXT | Fonction professionnelle |
| `activity_domain` | TEXT | Domaine d'activité |
| `personal_quote` | TEXT | Citation personnelle |
| `wealth_amount` | TEXT | Montant de la fortune |
| `wealth_billions` | TEXT | Fortune en milliards |
| `wealth_currency` | TEXT | Devise |
| `wealth_unit` | TEXT | Unité (millions/milliards) |
| `is_founder` | BOOLEAN | Est fondateur |
| `is_patron` | BOOLEAN | Est mécène |
| `biometric_enabled` | BOOLEAN | Authentification biométrique |
| `referral_code` | TEXT | Code de parrainage |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `business_content`
Contenu professionnel des membres.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `company_name` | TEXT | Nom de l'entreprise |
| `position_title` | TEXT | Titre du poste |
| `company_description` | TEXT | Description de l'entreprise |
| `company_logo_url` | TEXT | URL du logo |
| `company_photos` | TEXT[] | Tableau d'URLs de photos |
| `portfolio_text` | TEXT | Texte du portfolio |
| `achievements_text` | TEXT | Réalisations |
| `vision_text` | TEXT | Vision |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `family_content`
Contenu familial et personnel.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `bio` | TEXT | Biographie |
| `family_text` | TEXT | Texte sur la famille |
| `residences_text` | TEXT | Résidences |
| `philanthropy_text` | TEXT | Philanthropie |
| `network_text` | TEXT | Réseau |
| `anecdotes_text` | TEXT | Anecdotes |
| `personal_quote` | TEXT | Citation personnelle |
| `portrait_url` | TEXT | URL du portrait |
| `gallery_photos` | JSON | Photos de galerie |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `artwork_collection`
Collection d'œuvres d'art.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `title` | TEXT | Titre de l'œuvre |
| `artist` | TEXT | Artiste |
| `year` | TEXT | Année |
| `medium` | TEXT | Medium |
| `price` | TEXT | Prix |
| `acquisition` | TEXT | Acquisition |
| `description` | TEXT | Description |
| `image_url` | TEXT | URL de l'image |
| `display_order` | INTEGER | Ordre d'affichage |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `sports_hobbies`
Sports et loisirs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `title` | TEXT | Titre |
| `description` | TEXT | Description |
| `badge_text` | TEXT | Texte du badge |
| `display_order` | INTEGER | Ordre d'affichage |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `curated_sports`
Sports organisés avec statistiques.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `sport_type` | TEXT | Type de sport |
| `title` | TEXT | Titre |
| `subtitle` | TEXT | Sous-titre |
| `description` | TEXT | Description |
| `image_url` | TEXT | URL de l'image |
| `badge_text` | TEXT | Texte du badge |
| `stat1_label` | TEXT | Label statistique 1 |
| `stat1_value` | TEXT | Valeur statistique 1 |
| `stat2_label` | TEXT | Label statistique 2 |
| `stat2_value` | TEXT | Valeur statistique 2 |
| `stat3_label` | TEXT | Label statistique 3 |
| `stat3_value` | TEXT | Valeur statistique 3 |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `social_influence`
Influence sociale et réseaux.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `platform` | TEXT | Plateforme |
| `metric` | TEXT | Métrique |
| `value` | TEXT | Valeur |
| `description` | TEXT | Description |
| `image_url` | TEXT | URL de l'image |
| `display_order` | INTEGER | Ordre d'affichage |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `destinations`
Destinations de voyage.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `lieu` | TEXT | Lieu |
| `saison` | TEXT | Saison |
| `type` | TEXT | Type |
| `display_order` | INTEGER | Ordre d'affichage |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `exhibitions`
Expositions et événements.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `title` | TEXT | Titre |
| `location` | TEXT | Localisation |
| `year` | TEXT | Année |
| `role` | TEXT | Rôle |
| `display_order` | INTEGER | Ordre d'affichage |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

#### Tables de Relations

##### `friendships`
Relations d'amitié entre membres avec permissions d'accès.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | ID de l'utilisateur |
| `friend_id` | UUID | ID de l'ami |
| `personal_access` | BOOLEAN | Accès au profil personnel |
| `family_access` | BOOLEAN | Accès au profil familial |
| `business_access` | BOOLEAN | Accès au profil professionnel |
| `influence_access` | BOOLEAN | Accès à l'influence |
| `created_at` | TIMESTAMP | Date de création |

##### `connection_requests`
Demandes de connexion entre membres.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `requester_id` | UUID | ID du demandeur |
| `recipient_id` | UUID | ID du destinataire |
| `status` | TEXT | Statut (pending, accepted, rejected) |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

#### Tables de Messagerie

##### `conversations`
Conversations entre membres.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `type` | TEXT | Type (private, group) |
| `title` | TEXT | Titre (optionnel) |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |

##### `conversation_members`
Membres des conversations.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `conversation_id` | UUID | Référence conversations.id |
| `user_id` | UUID | Référence profiles.id |
| `joined_at` | TIMESTAMP | Date d'adhésion |

##### `messages`
Messages dans les conversations.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `conversation_id` | UUID | Référence conversations.id |
| `sender_id` | UUID | Référence profiles.id |
| `content` | TEXT | Contenu du message |
| `is_read` | BOOLEAN | Message lu |
| `created_at` | TIMESTAMP | Date de création |

#### Tables de Rôles

##### `user_roles`
Rôles des utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | ID unique |
| `user_id` | UUID | Référence profiles.id |
| `role` | ENUM | Rôle (admin, member) |

### Fonctions de Base de Données

#### `create_private_conversation(other_user_id: UUID)`
Crée une conversation privée entre deux utilisateurs.

#### `has_role(_user_id: UUID, _role: app_role)`
Vérifie si un utilisateur a un rôle spécifique.

#### `is_conversation_member(conv_id: UUID, user_id: UUID)`
Vérifie si un utilisateur est membre d'une conversation.

### Row Level Security (RLS)

Les politiques RLS sont configurées pour :
- Restreindre l'accès aux profils selon les permissions
- Protéger les données personnelles
- Gérer les demandes de connexion
- Sécuriser les messages

---

## Fonctionnalités Principales

### 1. Authentification et Inscription

- **Inscription** : Code d'invitation requis
- **Connexion** : Email et mot de passe
- **Gestion de session** : Persistance via localStorage
- **Authentification biométrique** : Support optionnel

### 2. Profils Utilisateurs

#### Profil Personnel
- Informations de base (nom, prénom, titre)
- Photo de profil
- Citation personnelle
- Biographie
- Informations de contact

#### Profil Professionnel (Business)
- Nom et description de l'entreprise
- Logo et photos
- Titre et fonction
- Portfolio et réalisations
- Vision

#### Profil Familial et Social
- Biographie détaillée
- Informations familiales
- Résidences
- Philanthropie
- Réseau social
- Anecdotes
- Galerie de photos

### 3. Collections et Contenu

#### Collection d'Art
- Gestion d'œuvres d'art
- Informations détaillées (artiste, année, medium, prix)
- Images et descriptions
- Ordre d'affichage personnalisable

#### Sports et Loisirs
- Sports organisés avec statistiques
- Hobbies et passions
- Badges et distinctions

#### Influence Sociale
- Métriques de plateformes sociales
- Classements et reconnaissances
- Descriptions d'influence

#### Destinations
- Lieux de voyage préférés
- Saisons et types de destinations

#### Expositions
- Participation à des événements
- Rôles et localisations

### 4. Réseau et Connexions

- **Liste des membres** : Parcourir tous les membres
- **Demandes de connexion** : Envoyer et gérer les demandes
- **Gestion des amis** : Accepter/refuser les connexions
- **Permissions d'accès** : Contrôle granulaire par section
- **Recherche et filtres** : Par nom, titre, secteur

### 5. Messagerie

- **Conversations privées** : Messages 1-à-1
- **Conversations de groupe** : Messages de groupe
- **Notifications** : Indicateurs de messages non lus
- **Historique** : Conservation des messages

### 6. Services Intégrés

#### Conciergerie
- Services de conciergerie de luxe
- Réservations et organisation

#### Marketplace
- Marketplace exclusif
- Produits et services premium

#### Metaverse
- Accès au metaverse
- Expériences virtuelles

### 7. Système de Niveaux

- **Niveaux d'adhésion** : Système de niveaux (à implémenter)
- **Upgrade** : Mise à niveau de l'adhésion
- **Accès restreint** : Membres de niveau supérieur

### 8. Paiement

- **Abonnements mensuels** : Gestion des abonnements
- **Paiement sécurisé** : Intégration de paiement (à compléter)

### 9. Internationalisation

- **10 langues supportées** : FR, EN, ES, DE, IT, PT, AR, ZH, JA, RU
- **Sélection de langue** : Changer la langue à tout moment
- **Traductions complètes** : Toutes les interfaces traduites

---

## Configuration et Installation

### Prérequis

- **Node.js** : Version 18 ou supérieure
- **npm** ou **bun** : Gestionnaire de paquets
- **Compte Supabase** : Pour le backend
- **Git** : Pour le contrôle de version

### Installation

1. **Cloner le dépôt**
```bash
git clone <repository-url>
cd aurora-react-superbase
```

2. **Installer les dépendances**
```bash
npm install
# ou
bun install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

4. **Configurer Supabase**

- Créer un projet sur [supabase.com](https://supabase.com)
- Exécuter les migrations SQL dans l'ordre :
```bash
supabase db push
```

5. **Démarrer le serveur de développement**
```bash
npm run dev
# ou
bun dev
```

L'application sera accessible sur `http://localhost:8080`

### Scripts Disponibles

```json
{
  "dev": "vite",                    // Serveur de développement
  "build": "vite build",            // Build de production
  "build:dev": "vite build --mode development",  // Build dev
  "lint": "eslint .",               // Linter le code
  "preview": "vite preview"         // Prévisualiser le build
}
```

### Configuration Vite

Le projet utilise Vite avec :
- **Port** : 8080
- **Host** : `::` (toutes les interfaces)
- **Plugin React SWC** : Compilation rapide
- **Alias `@`** : Pointe vers `./src`

### Configuration TypeScript

- **Strict mode** : Désactivé pour plus de flexibilité
- **Path aliases** : `@/*` pour les imports
- **Type checking** : Configuré pour React et Node

### Configuration Tailwind

- **Thème personnalisé** : Couleurs Aurora (or, noir)
- **Fonts** : Playfair Display (serif), Inter (sans-serif)
- **Animations** : Accordion et transitions

---

## Déploiement

### Build de Production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

### Déploiement sur Lovable

1. Ouvrir le projet sur [Lovable](https://lovable.dev)
2. Aller dans **Share → Publish**
3. Suivre les instructions

### Déploiement sur Vercel

```bash
npm install -g vercel
vercel
```

### Déploiement sur Netlify

1. Connecter le dépôt GitHub
2. Configurer le build :
   - Build command : `npm run build`
   - Publish directory : `dist`

### Variables d'Environnement en Production

Assurez-vous de configurer :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## API et Intégrations

### Supabase Client

Le client Supabase est initialisé dans `src/integrations/supabase/client.ts` :

```typescript
import { supabase } from "@/integrations/supabase/client";
```

### Edge Functions

Les Edge Functions sont déployées dans `supabase/functions/` :

#### `create-test-members`
Crée des membres de test pour le développement.

**Endpoint** : `POST /functions/v1/create-test-members`

**Usage** :
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/create-test-members`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }
);
```

#### `analyze-id-card`
Analyse de carte d'identité (à implémenter).

#### `migrate-base64-avatars`
Migration des avatars en base64.

### Requêtes Typées

Toutes les requêtes sont typées avec TypeScript via `src/integrations/supabase/types.ts` :

```typescript
import type { Database } from "@/integrations/supabase/types";

const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

---

## Sécurité

### Authentification

- **Supabase Auth** : Gestion sécurisée de l'authentification
- **JWT Tokens** : Tokens sécurisés pour les sessions
- **Row Level Security** : Protection au niveau de la base de données

### Permissions

- **Permissions granulaires** : Contrôle d'accès par section de profil
- **Vérification côté serveur** : RLS policies dans Supabase
- **Vérification côté client** : Hooks `useProfileAccess`

### Données Sensibles

- **Pas de stockage local** : Données sensibles uniquement en session
- **Chiffrement** : Communication HTTPS uniquement
- **Validation** : Validation Zod pour les formulaires

### Bonnes Pratiques

1. Ne jamais exposer les clés API dans le code client
2. Utiliser les variables d'environnement
3. Valider toutes les entrées utilisateur
4. Implémenter des rate limits (à faire)
5. Logger les actions sensibles (à faire)

---

## Internationalisation

### Système de Traduction

Le système d'internationalisation est géré par `LanguageContext` :

```typescript
import { useLanguage } from "@/contexts/LanguageContext";

const { t, language, setLanguage } = useLanguage();
```

### Langues Supportées

- 🇫🇷 Français (fr) - Par défaut
- 🇬🇧 English (en)
- 🇪🇸 Español (es)
- 🇩🇪 Deutsch (de)
- 🇮🇹 Italiano (it)
- 🇵🇹 Português (pt)
- 🇸🇦 العربية (ar)
- 🇨🇳 中文 (zh)
- 🇯🇵 日本語 (ja)
- 🇷🇺 Русский (ru)

### Utilisation

```typescript
// Dans un composant
const { t } = useLanguage();

<h1>{t('welcome')}</h1>
```

### Ajouter une Traduction

1. Ajouter la langue dans `LanguageContext.tsx`
2. Ajouter toutes les clés de traduction
3. Ajouter la langue dans la liste `languages`

---

## Guide de Développement

### Structure des Composants

Les composants suivent cette structure :

```typescript
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

export const MyComponent: React.FC = () => {
  const { t } = useLanguage();
  
  // Logique du composant
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Hooks Personnalisés

#### `useProfileAccess`
Vérifie si l'utilisateur peut éditer un profil.

```typescript
const { canEdit, isLoading } = useProfileAccess(profileUserId);
```

#### `useOptimizedAvatar`
Optimise le chargement des avatars.

```typescript
const avatarUrl = useOptimizedAvatar(profile.avatar_url);
```

### Gestion des Images

Les images sont optimisées via :
- **Lazy loading** : Chargement différé
- **Optimisation** : Compression et redimensionnement
- **CDN** : Supabase Storage pour le stockage

### Styles

- **Tailwind CSS** : Utilisation de classes utilitaires
- **Thème Aurora** : Couleurs or et noir
- **Responsive** : Mobile-first design
- **Dark mode** : Support du mode sombre

### Formulaires

Utilisation de **React Hook Form** avec **Zod** :

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

### Gestion d'État

- **React Query** : Pour les données serveur
- **Context API** : Pour l'état global (langue)
- **Local State** : `useState` pour l'état local

### Tests

Les tests ne sont pas encore implémentés. Recommandations :
- **Vitest** : Pour les tests unitaires
- **React Testing Library** : Pour les tests de composants
- **Playwright** : Pour les tests E2E

### Linting

```bash
npm run lint
```

Configuration ESLint :
- Règles React
- Règles TypeScript
- Règles de hooks React

---

## Architecture des Pages

### Routes Principales

| Route | Page | Description |
|-------|------|-------------|
| `/` | Index | Page d'accueil |
| `/login` | Login | Connexion |
| `/register` | Register | Inscription |
| `/profile` | Profile | Profil utilisateur |
| `/profile/:id` | Profile | Profil d'un autre membre |
| `/edit-profile` | EditProfile | Édition du profil |
| `/business` | Business | Profil professionnel |
| `/business/:id` | Business | Profil professionnel d'un autre |
| `/personal` | Personal | Profil personnel |
| `/personal/:id` | Personal | Profil personnel d'un autre |
| `/family` | Family | Profil familial |
| `/family/:id` | Family | Profil familial d'un autre |
| `/members` | Members | Liste des membres |
| `/network` | Network | Réseau et connexions |
| `/messages` | Messages | Messagerie |
| `/concierge` | Concierge | Services de conciergerie |
| `/metaverse` | Metaverse | Accès metaverse |
| `/marketplace` | Marketplace | Marketplace |
| `/payment` | Payment | Paiement et abonnements |
| `/member-card` | MemberCard | Carte de membre |
| `/create-test-members` | CreateTestMembers | Création de membres test |
| `/terms` | Terms | Conditions générales |
| `*` | NotFound | Page 404 |

---

## Composants UI

### Composants shadcn/ui

Le projet utilise les composants de base de shadcn/ui :
- Button, Input, Textarea
- Dialog, Alert Dialog
- Select, Checkbox, Radio
- Card, Badge, Avatar
- Tabs, Accordion
- Toast, Sonner
- Et plus...

### Composants Personnalisés

#### `AuroraLogo`
Logo de l'application avec différentes tailles.

#### `WealthBadge`
Badge affichant la fortune d'un membre.

#### `EditableText`
Texte éditable en ligne.

#### `EditableImage`
Image éditable avec upload.

#### `ServiceCard`
Carte pour les services (Concierge, Metaverse, Marketplace).

#### `ConnectionRequests`
Gestion des demandes de connexion.

---

## Utilitaires

### `lib/utils.ts`
Fonction `cn()` pour fusionner les classes CSS.

### `lib/countries.ts`
Liste des pays avec codes.

### `lib/currencyConverter.ts`
Conversion de devises.

### `lib/currencySymbols.ts`
Symboles de devises.

### `lib/industries.ts`
Liste des industries/domaines d'activité.

### `lib/imageOptimization.ts`
Optimisation des images.

---

## Migrations de Base de Données

Les migrations sont dans `supabase/migrations/` et sont exécutées dans l'ordre chronologique.

Pour appliquer les migrations :
```bash
supabase db push
```

Pour créer une nouvelle migration :
```bash
supabase migration new migration_name
```

---

## Troubleshooting

### Problèmes Courants

#### Erreur de connexion Supabase
- Vérifier les variables d'environnement
- Vérifier que l'URL et la clé sont correctes

#### Erreurs TypeScript
- Exécuter `npm run build` pour voir les erreurs
- Vérifier les types dans `types.ts`

#### Problèmes de styles
- Vérifier que Tailwind est bien configuré
- Vérifier les classes CSS

#### Erreurs de build
- Nettoyer le cache : `rm -rf node_modules .vite dist`
- Réinstaller : `npm install`

---

## Roadmap et Améliorations Futures

### À Implémenter

- [ ] Système de notifications en temps réel
- [ ] Recherche avancée avec filtres
- [ ] Export de données membres
- [ ] Intégration de paiement complète (Stripe)
- [ ] Authentification biométrique
- [ ] Application mobile (React Native)
- [ ] Tests unitaires et E2E
- [ ] Analytics et tracking
- [ ] Système de recommandations
- [ ] Événements et calendrier
- [ ] Blog/Actualités
- [ ] API REST publique
- [ ] Webhooks
- [ ] Rate limiting
- [ ] Logging et monitoring

---

## Contribution

### Workflow

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code

- Utiliser TypeScript
- Suivre les conventions ESLint
- Documenter le code complexe
- Tester les nouvelles fonctionnalités

---

## Licence

Ce projet est propriétaire et confidentiel.

---

## Contact et Support

Pour toute question ou support :
- Email : support@aurora-society.com
- Documentation : Cette documentation
- Issues : Utiliser le système d'issues du dépôt

---

**Dernière mise à jour** : 2024
**Version** : 1.0.0

