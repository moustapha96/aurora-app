# Pages et Fonctionnalités - Aurora Society

**Version** : 1.0.0  
**Date** : Décembre 2024

---

## 1. Pages d'Authentification

### 1.1 Index (`/`)

**Description** : Page d'accueil publique

**Fonctionnalités** :
- Présentation de la plateforme
- Bouton d'inscription
- Bouton de connexion
- Informations sur Aurora Society

**Accès** : Public

---

### 1.2 Login (`/login`)

**Description** : Page de connexion

**Fonctionnalités** :
- Formulaire email/mot de passe
- Lien "Mot de passe oublié"
- Lien vers inscription
- Validation des champs
- Gestion des erreurs

**Redirection après connexion** :
- `/member-card` si membre
- `/admin/dashboard` si admin

**Accès** : Public (redirige si déjà connecté)

---

### 1.3 Register (`/register`)

**Description** : Page d'inscription

**Fonctionnalités** :
- Formulaire d'inscription multi-étapes
- Validation du code de parrainage (referral code)
- Création du compte Supabase Auth
- Création automatique du profil
- Attribution du rôle `member`
- Vérification email

**Champs requis** :
- Email
- Mot de passe
- Prénom
- Nom
- Téléphone mobile
- Code de parrainage

**Accès** : Public

---

### 1.4 ForgotPassword (`/forgot-password`)

**Description** : Demande de réinitialisation de mot de passe

**Fonctionnalités** :
- Saisie de l'email
- Envoi d'email de réinitialisation
- Confirmation d'envoi

**Accès** : Public

---

### 1.5 ResetPassword (`/reset-password`, `/new-password`)

**Description** : Réinitialisation du mot de passe

**Fonctionnalités** :
- Saisie du nouveau mot de passe
- Confirmation du mot de passe
- Validation des règles de mot de passe
- Mise à jour du mot de passe

**Accès** : Public (avec token valide)

---

### 1.6 VerifyEmail (`/verify-email`)

**Description** : Vérification de l'adresse email

**Fonctionnalités** :
- Affichage du statut de vérification
- Renvoi d'email de vérification
- Redirection après vérification

**Accès** : Public (avec token)

---

## 2. Pages de Profil Membre

### 2.1 MemberCard (`/member-card`)

**Description** : Vue principale de la carte membre (page d'accueil connecté)

**Fonctionnalités** :
- Affichage du profil utilisateur
  - Avatar (uploadable)
  - Nom, prénom, titre honorifique
  - Fonction, domaine d'activité
  - Pays
  - Citation personnelle
  - Badges (Fondateur, Mécène, Richesse)
- Sections cliquables :
  - **BUSINESS** → `/business`
  - **FAMILY & SOCIAL** → `/family`
  - **PERSONAL** → `/personal`
  - **INFLUENCE & NETWORK** → `/network`
  - **INTEGRATED SERVICES** → Services (Concierge, Metaverse, Marketplace)
  - **MEMBRES** → `/members`
- Badge nombre de connexions
- Boutons :
  - Modifier le profil → `/edit-profile`
  - Retour login

**Données affichées** :
- Profil depuis `profiles`
- Contenu business depuis `business_content`
- Nombre de connexions depuis `friendships`

**Accès** : Membre connecté

---

### 2.2 Profile (`/profile`, `/profile/:id`)

**Description** : Profil détaillé d'un membre

**Fonctionnalités** :
- Affichage complet du profil
- Vue de son propre profil ou d'un autre membre
- Sections :
  - Informations de base
  - Business (aperçu)
  - Family & Social (aperçu)
  - Personal (aperçu)
  - Network (aperçu)
  - Services intégrés
  - Membres
- Demandes de connexion (si propre profil)
- Boutons :
  - Modifier le profil (si propre profil)
  - Déconnexion

**Accès** :
- Son propre profil : ✅
- Profil autre membre : ✅ (si connecté via `friendships`)

---

### 2.3 EditProfile (`/edit-profile`)

**Description** : Édition du profil personnel

**Fonctionnalités** :
- Formulaire d'édition complet
- Champs modifiables :
  - Photo de profil (upload)
  - Prénom, Nom
  - Titre honorifique (sélection)
  - Téléphone mobile
  - Fonction
  - Domaine d'activité (sélection)
  - Pays (sélection)
  - Citation personnelle
  - Niveau de richesse (montant, unité, devise)
- Indication visuelle des champs modifiés
- Validation des données
- Sauvegarde en base

**Accès** : Membre connecté (son propre profil uniquement)

---

### 2.4 Business (`/business`, `/business/:id`)

**Description** : Section professionnelle du profil

**Fonctionnalités** :
- Affichage du contenu business
  - Nom de l'entreprise
  - Description de l'entreprise
  - Titre/Position
  - Réalisations
  - Portfolio
  - Vision
  - Logo entreprise
  - Photos entreprise
- Édition du contenu (si propre profil)
- Vérification des permissions d'accès
- Affichage des badges (Forbes, EY, Harvard MBA)

**Contenu** :
- Table `business_content`
- Images depuis Storage `business-content`

**Accès** :
- Son propre profil : ✅ (édition possible)
- Profil autre membre : ✅ (si `business_access = true` dans `friendships`)

---

### 2.5 Family (`/family`, `/family/:id`)

**Description** : Section familiale et sociale du profil

**Fonctionnalités** :
- Affichage du contenu familial
  - Phrase d'accroche personnelle
  - Biographie longue
  - Famille proche
  - Résidences
  - Philanthropie & Causes
  - Réseau & Affiliations
  - Moments marquants (anecdotes)
  - Documents PDF
  - Galerie photos (portrait + galerie)
  - Activité récente
- Édition du contenu (si propre profil)
- Visualiseur PDF intégré
- Vérification des permissions d'accès

**Contenu** :
- Table `family_content`
- Images depuis assets ou Storage

**Accès** :
- Son propre profil : ✅ (édition possible)
- Profil autre membre : ✅ (si `family_access = true` dans `friendships`)

---

### 2.6 Personal (`/personal`, `/personal/:id`)

**Description** : Section personnelle du profil

**Fonctionnalités** :
- Affichage du contenu personnel
  - Sports organisés (Yachting, Polo, Chasse)
    - Statistiques détaillées
    - Photos
    - Badges
  - Sports & Hobbies personnalisés
  - Collection d'art
    - Œuvres avec détails (artiste, année, medium, prix)
    - Images
  - Destinations de voyage
- Édition du contenu (si propre profil)
- Ajout/suppression d'éléments
- Réorganisation (display_order)
- Vérification des permissions d'accès

**Contenu** :
- Table `personal_content`
- Table `curated_sports`
- Table `sports_hobbies`
- Table `artwork_collection`
- Table `destinations`

**Accès** :
- Son propre profil : ✅ (édition possible)
- Profil autre membre : ✅ (si `personal_access = true` dans `friendships`)

---

### 2.7 Network (`/network`, `/network/:id`)

**Description** : Section réseau et influence sociale

**Fonctionnalités** :
- Affichage du contenu réseau
  - Réseaux Sociaux
    - Liens Instagram, LinkedIn, Twitter, Facebook
    - Site web
  - Médias & Couverture Presse
  - Philanthropie & Engagement
- Édition du contenu (si propre profil)
- Gestion des liens sociaux (JSONB)
- Vérification des permissions d'accès

**Contenu** :
- Table `network_content` (sections : social, media, philanthropy)
- Table `social_influence`

**Accès** :
- Son propre profil : ✅ (édition possible)
- Profil autre membre : ✅ (si `influence_access = true` dans `friendships`)

---

## 3. Pages Réseau

### 3.1 Members (`/members`, `/members/:id`)

**Description** : Répertoire des membres

**Fonctionnalités** :
- Liste de tous les membres (cartes LinkedIn-style)
- Filtres :
  - Recherche par nom
  - Filtre par industrie
  - Filtre par pays
  - Filtre par badge (Diamond, Platinum, Gold)
  - Filtre par statut (Fondateur, Mécène)
- Tri :
  - Par nom
  - Par nombre de connexions
  - Par richesse
- Pagination
- Affichage par carte membre :
  - Avatar
  - Nom, titre
  - Industrie, localisation
  - Badges (Fondateur, Mécène, Richesse)
  - Nombre de connexions
  - Statut de connexion (Connecté, En attente, Non connecté)
- Actions :
  - Voir profil → `/profile/:id`
  - Demander connexion
  - Gérer permissions (si connecté)
  - Voir connexions d'un membre
- Vue connexions d'un membre spécifique

**Données** :
- Table `profiles`
- Table `friendships`
- Agrégations (nombre de connexions)

**Accès** : Membre connecté

---

### 3.2 Connections (`/connections`)

**Description** : Gestion des connexions

**Fonctionnalités** :
- Liste de toutes les connexions
- Affichage :
  - Avatar, nom
  - Date de connexion
  - Permissions accordées
- Actions :
  - Voir profil
  - Modifier permissions
  - Supprimer connexion (à confirmer)
- Édition des permissions :
  - business_access
  - family_access
  - personal_access
  - influence_access
  - network_access

**Données** :
- Table `friendships` (où `user_id = current_user`)

**Accès** : Membre connecté

---

### 3.3 Messages (`/messages`)

**Description** : Messagerie entre membres

**Fonctionnalités** :
- Liste des conversations
- Création de conversation privée
- Envoi/réception de messages
- Indicateur de messages non lus
- Historique des messages

**Données** :
- Table `conversations`
- Table `conversation_members`
- Table `messages`

**Accès** : Membre connecté (avec membres connectés)

---

### 3.4 Referrals (`/referrals`)

**Description** : Système de parrainage

**Fonctionnalités** :
- Affichage du code de parrainage personnel
- Liste des membres parrainés
- Statistiques de parrainage
- Partage du code de parrainage

**Données** :
- Table `profiles.referral_code`
- Table `referrals`

**Accès** : Membre connecté

---

## 4. Services Intégrés

### 4.1 Concierge (`/concierge`)

**Description** : Service de conciergerie premium

**Fonctionnalités** :
- Interface de service concierge
- Demandes de services
- Historique des demandes

**Accès** : Membre connecté

---

### 4.2 Metaverse (`/metaverse`)

**Description** : Expérience immersive virtuelle

**Fonctionnalités** :
- Interface metaverse
- Accès à l'environnement virtuel

**Accès** : Membre connecté

---

### 4.3 Marketplace (`/marketplace`)

**Description** : Place de marché exclusive

**Fonctionnalités** :
- Catalogue de produits/services
- Achat/vente entre membres

**Accès** : Membre connecté

---

### 4.4 Payment (`/payment`)

**Description** : Gestion des paiements

**Fonctionnalités** :
- Interface de paiement
- Historique des transactions

**Accès** : Membre connecté

---

## 5. Pages Administration

### 5.1 Admin Dashboard (`/admin/dashboard`)

**Description** : Tableau de bord administrateur

**Fonctionnalités** :
- Statistiques globales
  - Nombre total de membres
  - Nouveaux membres (période)
  - Connexions actives
  - Activité récente
- Graphiques et visualisations
- Actions rapides
- Notifications importantes

**Accès** : Admin uniquement

---

### 5.2 Admin Members (`/admin/members`)

**Description** : Gestion des membres

**Fonctionnalités** :
- Liste de tous les membres
- Recherche et filtres
- Actions :
  - Voir profil
  - Modifier profil
  - Changer rôle
  - Bannir/Débannir
  - Supprimer membre
- Statistiques par membre

**Accès** : Admin uniquement

---

### 5.3 Admin Roles (`/admin/roles`)

**Description** : Gestion des rôles

**Fonctionnalités** :
- Liste des rôles
- Attribution de rôles aux membres
- Modification de rôles
- Statistiques par rôle

**Accès** : Admin uniquement

---

### 5.4 Admin Moderation (`/admin/moderation`)

**Description** : Modération du contenu

**Fonctionnalités** :
- Liste du contenu à modérer
- Aperçu du contenu
- Actions :
  - Approuver
  - Rejeter
  - Supprimer
  - Modifier

**Accès** : Admin uniquement

---

### 5.5 Admin Analytics (`/admin/analytics`)

**Description** : Analytics et statistiques

**Fonctionnalités** :
- Graphiques d'utilisation
- Statistiques d'engagement
- Rapports d'activité
- Export de données

**Accès** : Admin uniquement

---

### 5.6 Admin Connections (`/admin/connections`)

**Description** : Gestion des connexions

**Fonctionnalités** :
- Vue globale des connexions
- Graphique du réseau
- Statistiques de connexions
- Actions sur les connexions

**Accès** : Admin uniquement

---

### 5.7 Admin Content (`/admin/content`)

**Description** : Gestion du contenu

**Fonctionnalités** :
- Vue de tout le contenu
- Recherche par type
- Modération en masse
- Statistiques de contenu

**Accès** : Admin uniquement

---

### 5.8 Admin Logs (`/admin/logs`)

**Description** : Logs système

**Fonctionnalités** :
- Consultation des logs
- Filtres par type, date, utilisateur
- Export des logs
- Recherche

**Accès** : Admin uniquement

---

### 5.9 Admin Reports (`/admin/reports`)

**Description** : Rapports

**Fonctionnalités** :
- Génération de rapports
- Rapports prédéfinis
- Export PDF/Excel
- Planification de rapports

**Accès** : Admin uniquement

---

### 5.10 Admin Settings (`/admin/settings`)

**Description** : Paramètres d'administration

**Fonctionnalités** :
- Configuration système
- Paramètres globaux
- Gestion des fonctionnalités
- Maintenance

**Accès** : Admin uniquement

---

## 6. Pages Utilitaires

### 6.1 Settings (`/settings`)

**Description** : Paramètres utilisateur

**Fonctionnalités** :
- Préférences de langue
- Notifications
- Confidentialité
- Sécurité
- Compte

**Accès** : Membre connecté

---

### 6.2 Contact (`/contact`)

**Description** : Formulaire de contact

**Fonctionnalités** :
- Formulaire de contact
- Envoi de message
- Confirmation

**Accès** : Membre connecté

---

### 6.3 Terms (`/terms`)

**Description** : Conditions d'utilisation

**Fonctionnalités** :
- Affichage des CGU
- Sections détaillées
- Multilingue

**Accès** : Public

---

### 6.4 ActivityHistory (`/activity-history`)

**Description** : Historique des activités

**Fonctionnalités** :
- Liste des activités récentes
- Filtres par type, date
- Détails des activités

**Données** :
- Table `user_activities`

**Accès** : Membre connecté

---

### 6.5 NotFound (`/*`)

**Description** : Page 404

**Fonctionnalités** :
- Message d'erreur
- Lien vers l'accueil

**Accès** : Public

---

## 7. Composants Clés

### 7.1 ConnectionRequests

**Fonctionnalités** :
- Affichage des demandes de connexion reçues
- Acceptation/Refus
- Définition des permissions lors de l'acceptation

### 7.2 Éditeurs de Contenu

- `BusinessContentEditor` : Édition contenu business
- `FamilyContentEditor` : Édition contenu family
- `PersonalContentEditor` : Édition contenu personal
- `SportsHobbiesEditor` : Édition sports/hobbies
- `CuratedSportEditor` : Édition sports organisés

### 7.3 ProtectedRoute

**Fonctionnalités** :
- Vérification de l'authentification
- Redirection si non connecté
- Protection des routes sensibles

---

**Document suivant** : [Base de Données et Relations](./04-BASE_DE_DONNEES.md)

