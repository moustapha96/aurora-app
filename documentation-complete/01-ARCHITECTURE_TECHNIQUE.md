# Architecture Technique - Aurora Society

**Version** : 1.0.0  
**Date** : Décembre 2024

---

## 1. Architecture Frontend

### 1.1 Structure des Composants

#### Pages Principales (39 pages)

**Authentification**
- `Index.tsx` - Page d'accueil
- `Login.tsx` - Connexion
- `Register.tsx` - Inscription
- `ForgotPassword.tsx` - Mot de passe oublié
- `ResetPassword.tsx` - Réinitialisation
- `VerifyEmail.tsx` - Vérification email

**Profil Membre**
- `MemberCard.tsx` - Carte membre (vue principale)
- `Profile.tsx` - Profil détaillé
- `EditProfile.tsx` - Édition du profil
- `Business.tsx` - Section professionnelle
- `Family.tsx` - Section familiale
- `Personal.tsx` - Section personnelle
- `Network.tsx` - Section réseau/influence

**Réseau**
- `Members.tsx` - Répertoire des membres
- `Connections.tsx` - Gestion des connexions
- `Messages.tsx` - Messagerie
- `Referrals.tsx` - Système de parrainage

**Services**
- `Concierge.tsx` - Service concierge
- `Metaverse.tsx` - Expérience metaverse
- `Marketplace.tsx` - Marketplace
- `Payment.tsx` - Paiements

**Administration** (`admin/`)
- `Dashboard.tsx` - Tableau de bord admin
- `Members.tsx` - Gestion membres
- `Roles.tsx` - Gestion rôles
- `Moderation.tsx` - Modération contenu
- `Analytics.tsx` - Analytics
- `Connections.tsx` - Gestion connexions
- `Content.tsx` - Gestion contenu
- `Logs.tsx` - Logs système
- `Reports.tsx` - Rapports
- `Settings.tsx` - Paramètres admin

**Autres**
- `Settings.tsx` - Paramètres utilisateur
- `Contact.tsx` - Contact
- `Terms.tsx` - Conditions d'utilisation
- `ActivityHistory.tsx` - Historique activités
- `CreateAdmin.tsx` - Création admin
- `CreateTestMembers.tsx` - Création membres test
- `NotFound.tsx` - Page 404

#### Composants Réutilisables (72 composants)

**UI Components** (shadcn/ui)
- Button, Card, Input, Select, Dialog, etc.

**Composants Métier**
- `ConnectionRequests.tsx` - Demandes de connexion
- `BusinessContentEditor.tsx` - Éditeur contenu business
- `FamilyContentEditor.tsx` - Éditeur contenu family
- `PersonalContentEditor.tsx` - Éditeur contenu personal
- `SportsHobbiesEditor.tsx` - Éditeur sports/hobbies
- `WealthBadge.tsx` - Badge de richesse
- `ProtectedRoute.tsx` - Route protégée
- `Layout.tsx` - Layout principal
- Et bien d'autres...

### 1.2 Contextes React

**LanguageContext**
- Gestion multilingue
- Traduction dynamique
- Support FR, EN, etc.

**RegistrationContext**
- Gestion du processus d'inscription
- Validation des étapes

**SettingsContext**
- Paramètres applicatifs
- Configuration utilisateur

### 1.3 Hooks Personnalisés

- `useUserRole.tsx` - Vérification du rôle utilisateur
- `use-toast.tsx` - Notifications toast
- Autres hooks utilitaires

### 1.4 Routing

**Routes Publiques**
- `/` - Accueil
- `/register` - Inscription
- `/login` - Connexion
- `/forgot-password` - Mot de passe oublié
- `/reset-password` - Réinitialisation
- `/verify-email` - Vérification email
- `/terms` - Conditions

**Routes Protégées (Membre)**
- `/member-card` - Carte membre
- `/profile` - Profil (avec `:id` optionnel)
- `/edit-profile` - Édition profil
- `/business` - Business (avec `:id` optionnel)
- `/family` - Family (avec `:id` optionnel)
- `/personal` - Personal (avec `:id` optionnel)
- `/network` - Network (avec `:id` optionnel)
- `/members` - Répertoire membres (avec `:id` optionnel)
- `/connections` - Connexions
- `/messages` - Messagerie
- `/referrals` - Parrainage
- `/concierge` - Concierge
- `/metaverse` - Metaverse
- `/marketplace` - Marketplace
- `/payment` - Paiements
- `/settings` - Paramètres
- `/contact` - Contact
- `/activity-history` - Historique

**Routes Admin**
- `/admin/dashboard` - Dashboard admin
- `/admin/members` - Gestion membres
- `/admin/roles` - Gestion rôles
- `/admin/moderation` - Modération
- `/admin/analytics` - Analytics
- `/admin/connections` - Connexions
- `/admin/content` - Contenu
- `/admin/logs` - Logs
- `/admin/reports` - Rapports
- `/admin/settings` - Paramètres admin

## 2. Architecture Backend (Supabase)

### 2.1 Base de Données PostgreSQL

**Tables Principales**

1. **profiles** - Profils utilisateurs
2. **user_roles** - Rôles utilisateurs
3. **business_content** - Contenu professionnel
4. **family_content** - Contenu familial
5. **personal_content** - Contenu personnel
6. **network_content** - Contenu réseau/influence
7. **friendships** - Relations entre membres
8. **connection_requests** - Demandes de connexion
9. **artwork_collection** - Collection d'art
10. **sports_hobbies** - Sports et hobbies
11. **curated_sports** - Sports organisés
12. **destinations** - Destinations de voyage
13. **exhibitions** - Expositions
14. **social_influence** - Influence sociale
15. **conversations** - Conversations
16. **conversation_members** - Membres conversations
17. **messages** - Messages
18. **user_activities** - Activités utilisateurs
19. **contact_messages** - Messages contact
20. **app_settings** - Paramètres application
21. **referrals** - Système de parrainage

### 2.2 Row Level Security (RLS)

Toutes les tables ont des politiques RLS pour :
- Restreindre l'accès aux données personnelles
- Permettre l'accès basé sur les relations (friendships)
- Contrôler les permissions par section
- Protéger les données sensibles

### 2.3 Functions SQL

- `handle_new_user()` - Création automatique profil/rôle
- `has_role()` - Vérification rôle
- `create_private_conversation()` - Création conversation
- `is_conversation_member()` - Vérification membre conversation
- `validate_referral_code()` - Validation code parrainage

### 2.4 Edge Functions

10 fonctions serverless pour :
- Traitements asynchrones
- Intégrations externes
- Webhooks

### 2.5 Storage Buckets

- `avatars` - Photos de profil
- `business-content` - Images business
- `family-content` - Images family
- `personal-content` - Images personnelles
- `network-content` - Images réseau

## 3. Intégrations

### 3.1 Supabase

- **Auth** : Authentification utilisateurs
- **Database** : PostgreSQL avec RLS
- **Storage** : Stockage fichiers
- **Realtime** : Mises à jour temps réel (optionnel)

### 3.2 Services Externes

- Email (via Supabase)
- Paiements (intégration prévue)
- Services tiers (concierge, etc.)

## 4. Sécurité

### 4.1 Authentification

- JWT tokens via Supabase Auth
- Refresh tokens automatiques
- Sessions sécurisées

### 4.2 Autorisation

- RLS au niveau base de données
- Vérification rôles côté client et serveur
- Permissions granulaires par section

### 4.3 Protection des Données

- Chiffrement en transit (HTTPS)
- Chiffrement au repos (Supabase)
- Validation des entrées
- Rate limiting

## 5. Performance

### 5.1 Optimisations Frontend

- Code splitting
- Lazy loading des routes
- Lazy loading des images
- Memoization React
- React Query pour le cache

### 5.2 Optimisations Backend

- Indexes sur colonnes fréquemment requêtées
- Requêtes optimisées
- Pagination
- Cache des requêtes

## 6. Déploiement

### 6.1 Frontend

- Build via Vite
- Déploiement sur Vercel/Netlify
- Variables d'environnement

### 6.2 Backend

- Supabase Cloud
- Migrations automatiques
- Edge Functions déployées

---

**Document suivant** : [Rôles et Permissions](./02-ROLES_ET_PERMISSIONS.md)

