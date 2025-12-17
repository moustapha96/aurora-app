# Aurora Society - Vue d'Ensemble de l'Application

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Statut** : Production

---

## 1. Introduction

Aurora Society est une plateforme sociale exclusive conçue pour connecter des membres de haut niveau (entrepreneurs, investisseurs, philanthropes) dans un environnement sécurisé et élégant. L'application permet aux membres de partager leurs profils professionnels, familiaux et personnels, de se connecter entre eux, et d'accéder à des services premium.

## 2. Objectifs de l'Application

- **Réseautage exclusif** : Créer un réseau privé pour les membres de haut niveau
- **Partage de contenu** : Permettre aux membres de partager leurs informations professionnelles, familiales et personnelles
- **Gestion des relations** : Système de connexions avec contrôle granulaire des permissions
- **Services premium** : Accès à des services intégrés (Concierge, Metaverse, Marketplace)
- **Administration** : Panel d'administration complet pour gérer les membres et le contenu

## 3. Architecture Générale

### 3.1 Stack Technologique

- **Frontend** : React 18.3.1 avec TypeScript
- **Framework** : Vite 5.4.19
- **Routing** : React Router DOM 6.30.1
- **UI Components** : Radix UI + shadcn/ui
- **Styling** : Tailwind CSS 3.4.17
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **State Management** : React Query (TanStack Query)
- **Notifications** : Sonner

### 3.2 Structure du Projet

```
aurora-app/
├── src/
│   ├── pages/          # Pages de l'application (39 pages)
│   ├── components/     # Composants réutilisables (72 composants)
│   ├── contexts/       # Contextes React (Language, Registration, Settings)
│   ├── hooks/          # Hooks personnalisés
│   ├── lib/            # Utilitaires et helpers
│   └── integrations/   # Intégrations (Supabase)
├── supabase/
│   ├── migrations/     # Migrations SQL (62 migrations)
│   └── functions/      # Edge Functions (10 fonctions)
└── public/             # Assets statiques
```

## 4. Types d'Utilisateurs

### 4.1 Rôles Principaux

1. **Admin** (`admin`)
   - Accès complet au panel d'administration
   - Gestion des membres, rôles, contenu
   - Modération et analytics
   - Configuration système

2. **Membre** (`member`)
   - Accès aux fonctionnalités membres
   - Gestion de profil personnel
   - Connexions avec autres membres
   - Accès aux services premium

### 4.2 Badges et Statuts

- **Fondateur** (`is_founder`) : Badge spécial pour les fondateurs
- **Mécène** (`is_patron`) : Badge pour les membres philanthropes
- **Badges de richesse** : Affichage basé sur `wealth_billions`

## 5. Fonctionnalités Principales

### 5.1 Authentification et Inscription

- Inscription avec code de parrainage (referral code)
- Connexion email/mot de passe
- Authentification biométrique optionnelle
- Réinitialisation de mot de passe
- Vérification d'email

### 5.2 Gestion de Profil

- **Profil de base** : Nom, prénom, titre honorifique, photo
- **Profil Business** : Entreprise, position, réalisations
- **Profil Family** : Biographie, famille, résidences, philanthropie
- **Profil Personal** : Sports, hobbies, collection d'art, destinations
- **Profil Network** : Influence sociale, médias, réseaux

### 5.3 Système de Connexions

- Demandes de connexion entre membres
- Gestion des permissions d'accès (business, family, personal, network)
- Liste des connexions
- Profils des autres membres

### 5.4 Services Intégrés

- **Concierge** : Service de conciergerie premium
- **Metaverse** : Expérience immersive virtuelle
- **Marketplace** : Place de marché exclusive

### 5.5 Administration

- Dashboard avec statistiques
- Gestion des membres
- Gestion des rôles
- Modération du contenu
- Analytics et rapports
- Logs système
- Paramètres d'application

## 6. Sécurité

- Row Level Security (RLS) sur toutes les tables
- Authentification via Supabase Auth
- Permissions granulaires par section de profil
- Validation des données côté client et serveur
- Rate limiting pour prévenir les abus

## 7. Internationalisation

- Support multilingue (français, anglais, etc.)
- Traduction dynamique via `LanguageContext`
- Titres honorifiques traduits
- Industries et pays traduits

## 8. Performance

- Lazy loading des images
- Pagination des listes
- Optimisation des requêtes SQL
- Cache via React Query
- PWA ready (Progressive Web App)

---

**Document suivant** : [Architecture Technique](./01-ARCHITECTURE_TECHNIQUE.md)

