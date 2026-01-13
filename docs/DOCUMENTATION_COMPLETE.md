# Aurora Society - Documentation Technique et Fonctionnelle Complète

**Version** : 1.0.0  
**Date** : Janvier 2025  
**Application** : Aurora Society - Plateforme Sociale Élite

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Technologies Utilisées](#technologies-utilisées)
4. [Structure du Projet](#structure-du-projet)
5. [Fonctionnalités Principales](#fonctionnalités-principales)
6. [Base de Données](#base-de-données)
7. [Authentification et Sécurité](#authentification-et-sécurité)
8. [Internationalisation](#internationalisation)
9. [Configuration et Déploiement](#configuration-et-déploiement)
10. [Guide de Développement](#guide-de-développement)
11. [API et Services](#api-et-services)
12. [Tests et Qualité](#tests-et-qualité)

---

## 🎯 Vue d'Ensemble

### Description

Aurora Society est une plateforme sociale exclusive conçue pour une communauté élite de membres distingués. L'application offre un espace privé et sécurisé pour la mise en réseau, le partage de contenu, la gestion de profils professionnels et personnels, ainsi que des services premium.

### Caractéristiques Principales

- **Plateforme Multi-plateforme** : Web (React) et Mobile (iOS/Android via Capacitor)
- **Système d'Authentification Avancé** : Biométrie, WebAuthn, Vérification d'identité Veriff
- **Gestion de Contenu Modulaire** : Business, Family, Personal, Network
- **Système de Parrainage** : Codes d'invitation et gestion de filleuls
- **Marketplace Intégré** : Vente et échange entre membres
- **Administration Complète** : Panel d'administration avec analytics et modération
- **Internationalisation** : Support de 10 langues

### Public Cible

Membres d'une communauté exclusive nécessitant :
- Confidentialité et sécurité élevées
- Outils de networking professionnel
- Gestion de patrimoine et héritage
- Services premium et conciergerie

---

## 🏗️ Architecture Technique

### Architecture Générale

```
┌─────────────────────────────────────────────────────────┐
│                    AURORA SOCIETY                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   Frontend   │    │   Backend    │    │  Mobile  │  │
│  │   (React)   │◄──►│  (Supabase)  │◄──►│(Capacitor)│  │
│  └──────────────┘    └──────────────┘    └──────────┘  │
│         │                   │                   │       │
│         └──────────────────┴───────────────────┘       │
│                          │                              │
│                    ┌─────▼─────┐                        │
│                    │  Services  │                        │
│                    │  Externes  │                        │
│                    └────────────┘                        │
│                    (Veriff, AI, etc.)                    │
└─────────────────────────────────────────────────────────┘
```

### Stack Technique

#### Frontend
- **Framework** : React 18.3.1
- **Build Tool** : Vite 5.4.19
- **Routing** : React Router DOM 6.30.1
- **State Management** : React Query (TanStack Query) 5.83.0
- **UI Components** : shadcn/ui (Radix UI)
- **Styling** : Tailwind CSS 3.4.17
- **Form Management** : React Hook Form 7.61.1 + Zod 3.25.76
- **Notifications** : Sonner 1.7.4

#### Backend & Services
- **BaaS** : Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentification** : Supabase Auth + Veriff (Vérification d'identité)
- **Storage** : Supabase Storage (Images, Documents)
- **API** : Supabase Edge Functions (TypeScript)

#### Mobile
- **Framework** : Capacitor 8.0.0
- **Plugins** :
  - `@capacitor/camera` : Accès caméra
  - `@capacitor/push-notifications` : Notifications push
  - `@capacitor/local-notifications` : Notifications locales
  - `@aparajita/capacitor-biometric-auth` : Authentification biométrique
  - `@capacitor/preferences` : Stockage sécurisé
  - `@capacitor/haptics` : Retour haptique

#### Internationalisation
- **Système** : Context API personnalisé
- **Langues Supportées** : FR, EN, ES, DE, IT, PT, AR, ZH, JA, RU
- **Format** : Fichiers TypeScript modulaires (`src/locales/`)

---

## 💻 Technologies Utilisées

### Dépendances Principales

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@supabase/supabase-js": "^2.58.0",
  "@tanstack/react-query": "^5.83.0",
  "react-router-dom": "^6.30.1",
  "react-hook-form": "^7.61.1",
  "zod": "^3.25.76",
  "@capacitor/core": "^8.0.0",
  "tailwindcss": "^3.4.17",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4"
}
```

### Outils de Développement

- **TypeScript** : 5.8.3
- **ESLint** : 9.32.0
- **Vite** : 5.4.19
- **PostCSS** : 8.5.6
- **Autoprefixer** : 10.4.21

---

## 📁 Structure du Projet

```
elite-sphere-nexus/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ui/             # Composants UI de base (shadcn)
│   │   ├── business/       # Modules Business
│   │   ├── family/         # Modules Family
│   │   ├── network/        # Modules Network
│   │   ├── personal/       # Modules Personal
│   │   ├── golf/           # Modules Golf
│   │   ├── polo/           # Modules Polo
│   │   └── marketplace/   # Modules Marketplace
│   ├── pages/              # Pages de l'application
│   │   ├── admin/         # Pages d'administration
│   │   └── ...            # Pages utilisateur
│   ├── contexts/           # Contextes React
│   │   ├── LanguageContext.tsx
│   │   ├── PlatformContext.tsx
│   │   └── SessionContext.tsx
│   ├── hooks/              # Hooks personnalisés
│   ├── lib/                # Utilitaires et helpers
│   ├── locales/            # Fichiers de traduction
│   ├── services/           # Services métier
│   ├── integrations/       # Intégrations externes
│   │   └── supabase/      # Configuration Supabase
│   └── types/              # Types TypeScript
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrations SQL
├── android/                # Projet Android natif
├── ios/                    # Projet iOS natif
├── public/                 # Assets statiques
└── docs/                   # Documentation
```

### Organisation des Composants

#### Composants UI (`src/components/ui/`)
Composants de base basés sur Radix UI et shadcn/ui :
- `button`, `card`, `dialog`, `input`, `select`, `switch`, etc.
- 55+ composants réutilisables

#### Modules Métier
Chaque module est organisé par domaine :
- **Business** : Opportunités, Timeline, Onboarding
- **Family** : Héritage, Documents, Arbre généalogique
- **Network** : Influence, Lifestyle, Clubs, Événements, Media
- **Personal** : Sports, Art, Destinations, Hobbies
- **Golf/Polo** : Profils, Parcours, Achievements, Galeries

---

## 🚀 Fonctionnalités Principales

### 1. Authentification et Sécurité

#### Authentification Multi-facteurs
- **Email/Mot de passe** : Authentification Supabase standard
- **Biométrie** : Face ID, Touch ID (iOS), Empreinte digitale (Android)
- **WebAuthn** : Authentification sans mot de passe
- **Vérification d'Identité** : Intégration Veriff (ISO/IEC 27001:2022, SOC 2 Type II)

#### Gestion des Sessions
- Sessions sécurisées avec Supabase Auth
- Refresh tokens automatiques
- Déconnexion automatique après inactivité
- Verrouillage d'application

#### Sécurité des Données
- Row Level Security (RLS) sur toutes les tables
- Chiffrement des données sensibles
- Stockage sécurisé des tokens (Keychain/Keystore)
- Validation côté client et serveur

### 2. Gestion de Profil

#### Profil Principal
- Informations personnelles (nom, titre honorifique, photo)
- Informations professionnelles (fonction, domaine d'activité)
- Citation personnelle
- Badge de patrimoine (optionnel)
- Numéro de compte unique (format : AU + séquentiel + mois + année)

#### Modules de Contenu

**Business**
- Opportunités d'affaires
- Timeline professionnelle
- Onboarding personnalisé

**Family**
- Héritage et valeurs familiales
- Documents familiaux
- Arbre généalogique
- Comptes liés (conjoint, enfants)

**Personal**
- Collection d'œuvres d'art
- Expositions
- Sports et hobbies (Golf, Polo)
- Destinations favorites

**Network**
- Influence sociale (médias, plateformes)
- Lifestyle (gastronomie, œnologie, mode)
- Clubs et associations
- Événements et médias
- Ambitions et projets

### 3. Système de Parrainage

#### Fonctionnalités
- Codes de parrainage uniques (format : AURORA-XXXXXX)
- Génération automatique lors de l'inscription
- Suivi des filleuls
- Statistiques de parrainage
- Liens de partage personnalisés

#### Gestion
- Validation des codes
- Historique des parrainages
- Tableau de bord des références
- Administration des codes

### 4. Messagerie et Connexions

#### Messagerie
- Conversations en temps réel
- Notifications push
- Envoi de messages texte
- Historique des conversations
- Indicateurs de statut (lu/non lu)

#### Connexions
- Demandes de connexion
- Gestion des amis/connexions
- Profils publics/privés
- Contrôle de visibilité

### 5. Marketplace

#### Fonctionnalités
- Publication d'annonces
- Catégorisation des produits
- Gestion des images multiples
- Système de prix et devises
- Statuts (actif/inactif)
- Dates d'expiration des offres

#### Administration
- Modération des annonces
- Gestion des catégories
- Analytics des ventes

### 6. Administration

#### Dashboard Administrateur
- Vue d'ensemble des statistiques
- Gestion des membres
- Modération de contenu
- Analytics et rapports
- Configuration système

#### Modules d'Administration
- **Membres** : Gestion, recherche, filtres
- **Sécurité** : Authentification, rôles, permissions
- **Vérification** : Documents, identité (Veriff)
- **Analytics** : Statistiques, graphiques
- **Modération** : Contenu, signalements
- **Logs** : Historique des actions
- **API Config** : Configuration des Edge Functions
- **Marketplace** : Gestion des annonces

### 7. Services Premium

#### Conciergerie
- Demandes de services
- Suivi des demandes
- Historique

#### Métavers
- Espace virtuel (à venir)

#### Paiements
- Intégration de paiement (à venir)

### 8. Notifications

#### Types de Notifications
- Messages
- Demandes de connexion
- Événements
- Notifications système

#### Canaux
- Notifications push (mobile)
- Notifications locales
- Notifications email
- Notifications in-app

### 9. Pages Publiques

#### Landing Pages
- Pages de présentation personnalisables
- Templates (Classic, Luxury, Minimal)
- Partage public avec URL unique
- Prévisualisation avant publication

---

## 🗄️ Base de Données

### Architecture Supabase

#### Tables Principales

**Profils et Utilisateurs**
- `profiles` : Profils utilisateurs principaux
- `profiles_private` : Données privées (téléphone, patrimoine)
- `user_roles` : Rôles utilisateurs (admin, member)
- `linked_accounts` : Comptes liés (famille)

**Authentification**
- `identity_verifications` : Vérifications d'identité Veriff
- `biometric_sessions` : Sessions biométriques

**Contenu Business**
- `business_content` : Contenu business
- `business_opportunities` : Opportunités

**Contenu Family**
- `family_content` : Contenu familial
- `family_documents` : Documents familiaux

**Contenu Personal**
- `artwork_collection` : Collection d'œuvres
- `exhibitions` : Expositions
- `sports_hobbies` : Sports et hobbies
- `destinations` : Destinations

**Golf**
- `golf_profiles` : Profils golf
- `golf_courses` : Parcours de golf
- `golf_achievements` : Réalisations golf
- `golf_gallery` : Galerie golf

**Polo**
- `polo_profiles` : Profils polo
- `polo_horses` : Chevaux
- `polo_achievements` : Réalisations polo
- `polo_gallery` : Galerie polo

**Network**
- `social_influence` : Influence sociale
- `network_media` : Médias réseau
- `network_events` : Événements
- `network_lifestyle` : Lifestyle
- `network_clubs` : Clubs et associations
- `network_ambitions` : Ambitions

**Social**
- `friendships` : Amitiés/connexions
- `connection_requests` : Demandes de connexion
- `conversations` : Conversations
- `messages` : Messages
- `conversation_members` : Membres de conversations

**Marketplace**
- `marketplace_items` : Articles marketplace

**Parrainage**
- `referral_codes` : Codes de parrainage
- `referrals` : Relations de parrainage

**Administration**
- `admin_logs` : Logs d'administration
- `admin_reports` : Rapports
- `admin_settings` : Paramètres système

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour :
- Restreindre l'accès aux données utilisateur
- Permettre la lecture publique des profils (selon visibilité)
- Protéger les données privées
- Gérer les permissions d'administration

### Indexes et Performance

- Index sur les colonnes fréquemment recherchées
- Index sur les clés étrangères
- Index sur les colonnes de tri
- Optimisation des requêtes avec `EXPLAIN`

---

## 🔐 Authentification et Sécurité

### Flux d'Authentification

#### Inscription
1. Saisie des informations de base
2. Upload de photo de profil (vérification IA)
3. Vérification d'identité Veriff
4. Génération du code de parrainage
5. Création du profil
6. Redirection vers login

#### Connexion
1. Email/Mot de passe ou WebAuthn
2. Vérification Supabase Auth
3. Proposition d'activation biométrique (première fois)
4. Chargement du profil et des données
5. Redirection vers Member Card

#### Authentification Biométrique
1. Vérification de la disponibilité
2. Demande de permission
3. Authentification native
4. Récupération du token depuis stockage sécurisé
5. Connexion automatique

### Vérification d'Identité Veriff

#### Processus
1. Initiation de session Veriff
2. Redirection vers interface Veriff
3. Upload de document d'identité
4. Vérification automatique
5. Webhook de callback
6. Mise à jour du statut de vérification

#### Certifications Veriff
- ISO/IEC 27001:2022 (incl. 27017/27018)
- SOC 2 Type II
- Conformité GDPR
- Cyber Essentials
- UKDIATF (identités digitales UK)

### Sécurité des Données

#### Chiffrement
- Données en transit : HTTPS/TLS
- Données au repos : Chiffrement Supabase
- Tokens : Stockage sécurisé (Keychain/Keystore)

#### Validation
- Validation côté client (Zod)
- Validation côté serveur (Edge Functions)
- Sanitization des entrées utilisateur

#### Permissions
- RLS sur toutes les tables
- Vérification des rôles
- Contrôle d'accès granulaire

---

## 🌍 Internationalisation

### Système de Traduction

#### Architecture
- Context API personnalisé (`LanguageContext`)
- Fichiers de traduction TypeScript
- Détection automatique de la langue du navigateur
- Persistance dans localStorage

#### Langues Supportées
1. **Français (fr)** : Langue par défaut
2. **Anglais (en)**
3. **Espagnol (es)**
4. **Allemand (de)**
5. **Italien (it)**
6. **Portugais (pt)**
7. **Arabe (ar)**
8. **Chinois (zh)**
9. **Japonais (ja)**
10. **Russe (ru)**

#### Structure des Traductions

```typescript
// src/locales/fr.ts
export const fr: Record<string, string> = {
  welcome: "Bienvenue",
  // ... 2300+ clés de traduction
}
```

#### Utilisation

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

const MyComponent = () => {
  const { t, language, setLanguage } = useLanguage();
  
  return <h1>{t('welcome')}</h1>;
};
```

#### Clés de Traduction

Plus de 2300 clés de traduction couvrant :
- Interface utilisateur
- Messages d'erreur
- Notifications
- Formulaires
- Modules métier
- Administration

---

## ⚙️ Configuration et Déploiement

### Configuration Environnement

#### Variables d'Environnement

```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Veriff
VERIFF_API_KEY=your-veriff-key
VERIFF_API_URL=https://stationapi.veriff.com

# Capacitor
CAPACITOR_APP_ID=app.lovable.e6cb71785bb7428786ce0e9ee3ec0082
```

### Build et Déploiement

#### Développement

```bash
# Installation
npm install

# Développement
npm run dev

# Build
npm run build

# Preview
npm run preview
```

#### Mobile

```bash
# Synchronisation Capacitor
npm run cap:android  # Android
npx cap sync ios     # iOS

# Build Android
cd android && ./gradlew assembleRelease

# Build iOS
# Ouvrir ios/App.xcworkspace dans Xcode
```

### Configuration Capacitor

```typescript
// capacitor.config.ts
{
  appId: 'app.lovable.e6cb71785bb7428786ce0e9ee3ec0082',
  appName: 'Aurora Society',
  webDir: 'dist',
  // Configuration iOS/Android
}
```

### Supabase Edge Functions

#### Fonctions Disponibles

- `veriff-verification` : Gestion vérification Veriff
- `veriff-webhook` : Webhook Veriff
- `analyze-id-card` : Analyse IA de documents
- `personal-ai-suggest` : Suggestions IA Personal
- `business-ai-suggest` : Suggestions IA Business
- `family-ai-suggest` : Suggestions IA Family
- `network-ai-suggest` : Suggestions IA Network
- `regenerate-account-numbers` : Régénération numéros de compte

---

## 👨‍💻 Guide de Développement

### Prérequis

- Node.js 18+
- npm ou yarn
- Git
- Supabase CLI (pour développement local)
- Android Studio (pour Android)
- Xcode (pour iOS, macOS uniquement)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd elite-sphere-nexus

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Démarrer le serveur de développement
npm run dev
```

### Structure du Code

#### Composants

```typescript
// Composant fonctionnel avec hooks
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const MyComponent = () => {
  const { t } = useLanguage();
  const [state, setState] = useState();
  
  return <div>{t('key')}</div>;
};
```

#### Hooks Personnalisés

```typescript
// src/hooks/useCustomHook.ts
import { useState, useEffect } from 'react';

export const useCustomHook = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    // Logique
  }, []);
  
  return { data };
};
```

#### Services

```typescript
// src/services/myService.ts
import { supabase } from '@/integrations/supabase/client';

export const myService = {
  async fetchData() {
    const { data, error } = await supabase
      .from('table')
      .select('*');
    return { data, error };
  }
};
```

### Conventions de Code

#### Nommage
- **Composants** : PascalCase (`MyComponent.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useMyHook.ts`)
- **Services** : camelCase (`myService.ts`)
- **Types** : PascalCase (`MyType.ts`)

#### Organisation
- Un composant par fichier
- Exports nommés pour les composants
- Exports par défaut pour les pages

#### Styling
- Tailwind CSS pour le styling
- Classes utilitaires
- Variables CSS pour les couleurs personnalisées
- Responsive design mobile-first

### Tests

#### Structure de Tests (à implémenter)
```
src/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   └── services/
```

### Linting

```bash
# Linter
npm run lint

# Auto-fix
npm run lint -- --fix
```

---

## 🔌 API et Services

### Supabase Client

```typescript
import { supabase } from '@/integrations/supabase/client';

// Requête simple
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Insertion
const { data, error } = await supabase
  .from('profiles')
  .insert({ ... })
  .select();

// Mise à jour
const { data, error } = await supabase
  .from('profiles')
  .update({ ... })
  .eq('id', userId);
```

### Edge Functions

```typescript
// Appel d'Edge Function
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
});
```

### Storage

```typescript
// Upload
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('path/file.jpg', file);

// Download
const { data, error } = await supabase.storage
  .from('bucket-name')
  .download('path/file.jpg');
```

### React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query
const { data, isLoading } = useQuery({
  queryKey: ['profiles', userId],
  queryFn: () => fetchProfile(userId)
});

// Mutation
const mutation = useMutation({
  mutationFn: updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries(['profiles']);
  }
});
```

---

## 📊 Tests et Qualité

### Outils de Qualité

- **ESLint** : Linting du code
- **TypeScript** : Typage statique
- **Prettier** : Formatage (à configurer)

### Bonnes Pratiques

1. **TypeScript** : Utiliser les types partout
2. **Error Handling** : Gérer toutes les erreurs
3. **Loading States** : Afficher les états de chargement
4. **Accessibility** : Respecter les standards WCAG
5. **Performance** : Optimiser les rendus et requêtes
6. **Security** : Valider toutes les entrées
7. **Internationalization** : Utiliser `t()` pour tous les textes

### Performance

#### Optimisations
- Code splitting avec lazy loading
- React Query pour le caching
- Optimisation des images
- Pagination des listes
- Debouncing des recherches

#### Métriques
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Bundle size

---

## 📚 Ressources et Documentation

### Documentation Externe

- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

### Documentation Interne

- `BIOMETRIC-AUTH-GUIDE.md` : Guide authentification biométrique
- `MOBILE-BUILD-GUIDE.md` : Guide build mobile
- `DEPLOIEMENT-ANDROID.md` : Déploiement Android
- `FIREBASE-IOS-CONFIG.md` : Configuration iOS
- `VERIFF-WEBHOOK-DOCUMENTATION.md` : Documentation Veriff
- `docs/PARRAINAGE.md` : Documentation système de parrainage

### Support

Pour toute question ou problème :
1. Consulter la documentation
2. Vérifier les issues GitHub
3. Contacter l'équipe de développement

---

## 🔄 Changelog et Versions

### Version 1.0.0 (Janvier 2025)

#### Fonctionnalités
- ✅ Authentification multi-facteurs
- ✅ Vérification d'identité Veriff
- ✅ Modules de contenu (Business, Family, Personal, Network)
- ✅ Système de parrainage
- ✅ Messagerie et connexions
- ✅ Marketplace
- ✅ Administration complète
- ✅ Internationalisation (10 langues)
- ✅ Support mobile iOS/Android

#### Améliorations
- Optimisation des performances
- Amélioration de l'UX
- Sécurité renforcée
- Documentation complète

---

## 📝 Notes de Développement

### Prochaines Fonctionnalités

- [ ] Amélioration du système de notifications
- [ ] Intégration paiements
- [ ] Module Métavers
- [ ] Analytics avancés
- [ ] Tests automatisés
- [ ] CI/CD pipeline

### Problèmes Connus

- Voir les issues GitHub pour la liste complète

### Contributions

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request

---

**Documentation maintenue par l'équipe Aurora Society**  
**Dernière mise à jour : Janvier 2025**
