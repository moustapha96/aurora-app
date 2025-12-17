# Possibilités par Membre - Aurora Society

**Version** : 1.0.0  
**Date** : Décembre 2024

---

## 1. Vue d'Ensemble

Ce document détaille toutes les possibilités et actions disponibles pour chaque type de membre selon son rôle et ses connexions.

---

## 2. Membre Standard (Rôle: `member`)

### 2.1 Sur Son Propre Profil

#### 2.1.1 Profil de Base

**Actions possibles** :
- ✅ **Voir** toutes ses informations
- ✅ **Modifier** toutes ses informations via `/edit-profile`
  - Photo de profil (upload)
  - Prénom, Nom
  - Titre honorifique
  - Téléphone mobile
  - Fonction professionnelle
  - Domaine d'activité
  - Pays
  - Citation personnelle
  - Niveau de richesse (montant, unité, devise)
- ✅ **Activer/Désactiver** l'authentification biométrique
- ✅ **Voir** son code de parrainage
- ✅ **Partager** son code de parrainage

#### 2.1.2 Section Business (`/business`)

**Actions possibles** :
- ✅ **Voir** tout le contenu business
- ✅ **Modifier** tout le contenu business
  - Nom de l'entreprise
  - Description entreprise
  - Titre/Position
  - Logo (upload)
  - Photos (upload multiple)
  - Réalisations (texte riche HTML)
  - Portfolio (texte riche HTML)
  - Vision (texte riche HTML)
- ✅ **Ajouter/Supprimer** des photos
- ✅ **Utiliser** l'éditeur riche pour formater le texte

#### 2.1.3 Section Family (`/family`)

**Actions possibles** :
- ✅ **Voir** tout le contenu family
- ✅ **Modifier** tout le contenu family
  - Phrase d'accroche
  - Biographie (texte riche HTML)
  - Famille proche (texte riche HTML)
  - Résidences (texte riche HTML)
  - Philanthropie (texte riche HTML)
  - Réseau & Affiliations (texte riche HTML)
  - Anecdotes (texte riche HTML)
  - Portrait (upload)
  - Galerie photos (upload multiple)
  - Documents PDF (upload multiple)
- ✅ **Visualiser** les PDF dans l'interface
- ✅ **Organiser** la galerie photos

#### 2.1.4 Section Personal (`/personal`)

**Actions possibles** :
- ✅ **Voir** tout le contenu personal
- ✅ **Modifier** tout le contenu personal

**Sports Organisés** :
- ✅ **Ajouter/Modifier** Yachting
  - Titre, sous-titre, description
  - Image
  - Badge
  - 3 statistiques (label + valeur)
- ✅ **Ajouter/Modifier** Polo
  - Même structure que Yachting
- ✅ **Ajouter/Modifier** Chasse
  - Même structure que Yachting

**Sports & Hobbies Personnalisés** :
- ✅ **Ajouter** un nouveau sport/hobby
- ✅ **Modifier** un sport/hobby existant
- ✅ **Supprimer** un sport/hobby
- ✅ **Réorganiser** l'ordre (display_order)

**Collection d'Art** :
- ✅ **Ajouter** une œuvre
  - Titre, Artiste, Année
  - Medium, Prix, Acquisition
  - Description
  - Image
- ✅ **Modifier** une œuvre existante
- ✅ **Supprimer** une œuvre
- ✅ **Réorganiser** l'ordre

**Destinations** :
- ✅ **Ajouter** une destination
  - Lieu, Type, Saison
- ✅ **Modifier** une destination
- ✅ **Supprimer** une destination
- ✅ **Réorganiser** l'ordre

#### 2.1.5 Section Network (`/network`)

**Actions possibles** :
- ✅ **Voir** tout le contenu network
- ✅ **Modifier** tout le contenu network

**Réseaux Sociaux** :
- ✅ **Ajouter/Modifier** les liens
  - Instagram
  - LinkedIn
  - Twitter
  - Facebook
  - Site web
- ✅ **Ajouter** du contenu texte (HTML)

**Médias & Presse** :
- ✅ **Ajouter/Modifier** le contenu
  - Texte riche (HTML)
  - Images

**Philanthropie & Engagement** :
- ✅ **Ajouter/Modifier** le contenu
  - Texte riche (HTML)
  - Images

### 2.2 Sur les Profils d'Autres Membres

#### 2.2.1 Accès Général

**Conditions d'accès** :
- ✅ **Toujours accessible** : Profil de base (nom, photo, fonction)
- ⚠️ **Conditionnel** : Sections détaillées (nécessite connexion)

#### 2.2.2 Si NON Connecté

**Actions possibles** :
- ✅ **Voir** le profil de base
  - Nom, prénom, photo
  - Fonction, domaine, pays
  - Badges (Fondateur, Mécène, Richesse)
  - Nombre de connexions
- ✅ **Demander une connexion**
- ❌ **Voir** les sections Business, Family, Personal, Network
- ❌ **Modifier** quoi que ce soit

#### 2.2.3 Si Connecté (via `friendships`)

**Actions possibles** :
- ✅ **Voir** le profil complet
- ✅ **Voir** la section Business (si `business_access = true`)
- ✅ **Voir** la section Family (si `family_access = true`)
- ✅ **Voir** la section Personal (si `personal_access = true`)
- ✅ **Voir** la section Network (si `influence_access = true`)
- ✅ **Gérer les permissions** de cette connexion
  - Modifier les permissions d'accès
  - Supprimer la connexion
- ✅ **Voir les connexions** de ce membre
- ❌ **Modifier** le contenu d'un autre membre

### 2.3 Gestion des Connexions

#### 2.3.1 Demandes de Connexion

**Recevoir une demande** :
- ✅ **Voir** les demandes reçues (dans `/profile`)
- ✅ **Accepter** une demande
  - Définir les permissions lors de l'acceptation
  - 5 permissions configurables
- ✅ **Refuser** une demande

**Envoyer une demande** :
- ✅ **Envoyer** une demande à n'importe quel membre
- ✅ **Voir** le statut de sa demande (pending, accepted, rejected)

#### 2.3.2 Liste des Connexions (`/connections`)

**Actions possibles** :
- ✅ **Voir** toutes ses connexions
- ✅ **Voir** les permissions accordées pour chaque connexion
- ✅ **Modifier** les permissions d'une connexion
  - Business Access
  - Family Access
  - Personal Access
  - Influence Access
  - Network Access
- ✅ **Supprimer** une connexion
- ✅ **Accéder** au profil d'une connexion

#### 2.3.3 Répertoire des Membres (`/members`)

**Actions possibles** :
- ✅ **Voir** tous les membres
- ✅ **Rechercher** par nom
- ✅ **Filtrer** par :
  - Industrie
  - Pays
  - Badge (Diamond, Platinum, Gold)
  - Statut (Fondateur, Mécène)
- ✅ **Trier** par :
  - Nom
  - Nombre de connexions
  - Richesse
- ✅ **Voir** le profil d'un membre
- ✅ **Demander connexion** (si non connecté)
- ✅ **Gérer permissions** (si connecté)
- ✅ **Voir connexions** d'un membre

### 2.4 Services Premium

#### 2.4.1 Concierge (`/concierge`)

**Actions possibles** :
- ✅ **Accéder** au service concierge
- ✅ **Faire** des demandes de services
- ✅ **Voir** l'historique des demandes

#### 2.4.2 Metaverse (`/metaverse`)

**Actions possibles** :
- ✅ **Accéder** à l'environnement virtuel
- ✅ **Interagir** avec d'autres membres
- ✅ **Participer** aux événements virtuels

#### 2.4.3 Marketplace (`/marketplace`)

**Actions possibles** :
- ✅ **Voir** le catalogue
- ✅ **Acheter** des produits/services
- ✅ **Vendre** des produits/services (si autorisé)

### 2.5 Messagerie (`/messages`)

**Actions possibles** :
- ✅ **Voir** toutes ses conversations
- ✅ **Créer** une nouvelle conversation (avec membres connectés)
- ✅ **Envoyer** des messages
- ✅ **Recevoir** des messages
- ✅ **Voir** l'historique complet
- ✅ **Marquer** les messages comme lus

### 2.6 Système de Parrainage (`/referrals`)

**Actions possibles** :
- ✅ **Voir** son code de parrainage unique
- ✅ **Copier** le code pour partage
- ✅ **Voir** la liste des membres parrainés
- ✅ **Voir** les statistiques de parrainage

### 2.7 Paramètres (`/settings`)

**Actions possibles** :
- ✅ **Changer** la langue de l'interface
- ✅ **Configurer** les notifications
- ✅ **Gérer** la confidentialité
- ✅ **Activer/Désactiver** l'authentification biométrique
- ✅ **Gérer** les paramètres du compte

### 2.8 Autres Fonctionnalités

**Actions possibles** :
- ✅ **Contacter** l'équipe via `/contact`
- ✅ **Voir** l'historique d'activité (`/activity-history`)
- ✅ **Consulter** les conditions d'utilisation (`/terms`)
- ✅ **Se déconnecter**

---

## 3. Administrateur (Rôle: `admin`)

### 3.1 Toutes les Possibilités d'un Membre

Un administrateur a **toutes les possibilités d'un membre standard** (voir section 2) **PLUS** les fonctionnalités admin suivantes.

### 3.2 Fonctionnalités Administrateur Exclusives

#### 3.2.1 Dashboard Admin (`/admin/dashboard`)

**Actions possibles** :
- ✅ **Voir** les statistiques globales
- ✅ **Voir** les graphiques d'évolution
- ✅ **Voir** les alertes système
- ✅ **Accéder** rapidement aux sections admin

#### 3.2.2 Gestion des Membres (`/admin/members`)

**Actions possibles** :
- ✅ **Voir** tous les membres
- ✅ **Rechercher** et filtrer les membres
- ✅ **Voir** le profil complet de n'importe quel membre
- ✅ **Modifier** le profil de n'importe quel membre
  - Tous les champs
  - Badges (Fondateur, Mécène)
  - Niveau de richesse
- ✅ **Changer** le rôle d'un membre (admin ↔ member)
- ✅ **Bannir/Débannir** un membre
- ✅ **Supprimer** un membre (action irréversible)
- ✅ **Créer** un nouveau membre manuellement

#### 3.2.3 Gestion des Rôles (`/admin/roles`)

**Actions possibles** :
- ✅ **Voir** tous les rôles
- ✅ **Attribuer** le rôle admin à un membre
- ✅ **Retirer** le rôle admin d'un membre
- ✅ **Voir** les statistiques par rôle

#### 3.2.4 Modération (`/admin/moderation`)

**Actions possibles** :
- ✅ **Voir** tout le contenu à modérer
- ✅ **Approuver** du contenu
- ✅ **Rejeter** du contenu (avec raison)
- ✅ **Modifier** du contenu directement
- ✅ **Supprimer** du contenu
- ✅ **Filtrer** par type, statut, membre

#### 3.2.5 Analytics (`/admin/analytics`)

**Actions possibles** :
- ✅ **Voir** toutes les statistiques d'utilisation
- ✅ **Voir** les graphiques d'évolution
- ✅ **Analyser** les métriques d'engagement
- ✅ **Exporter** les données (PDF, Excel, JSON)

#### 3.2.6 Gestion des Connexions (`/admin/connections`)

**Actions possibles** :
- ✅ **Voir** toutes les connexions
- ✅ **Voir** le graphique du réseau complet
- ✅ **Voir** les statistiques de connexions
- ✅ **Modifier** les permissions d'une connexion
- ✅ **Supprimer** une connexion

#### 3.2.7 Gestion du Contenu (`/admin/content`)

**Actions possibles** :
- ✅ **Voir** tout le contenu de tous les membres
- ✅ **Rechercher** par type, membre, mots-clés
- ✅ **Modérer** le contenu
- ✅ **Voir** les statistiques de contenu

#### 3.2.8 Logs Système (`/admin/logs`)

**Actions possibles** :
- ✅ **Voir** tous les logs système
- ✅ **Filtrer** par type, date, utilisateur
- ✅ **Rechercher** dans les logs
- ✅ **Exporter** les logs

#### 3.2.9 Rapports (`/admin/reports`)

**Actions possibles** :
- ✅ **Générer** des rapports prédéfinis
- ✅ **Créer** des rapports personnalisés
- ✅ **Exporter** en PDF, Excel, JSON
- ✅ **Planifier** des rapports automatiques

#### 3.2.10 Paramètres Admin (`/admin/settings`)

**Actions possibles** :
- ✅ **Configurer** les paramètres système
  - Rôle par défaut
  - Limite de parrainages
  - Paramètres de sécurité
- ✅ **Activer/Désactiver** des fonctionnalités
- ✅ **Gérer** le mode maintenance
- ✅ **Configurer** les sauvegardes

### 3.3 Accès Spécial

**Accès sans restriction** :
- ✅ **Voir** tous les profils (même non connectés)
- ✅ **Voir** toutes les sections (même sans permission)
- ✅ **Modifier** n'importe quel contenu
- ✅ **Accéder** à toutes les données

---

## 4. Matrice des Possibilités

| Action | Membre (Propre) | Membre (Autre - Connecté) | Membre (Autre - Non Connecté) | Admin |
|--------|-----------------|---------------------------|-------------------------------|-------|
| **Voir profil de base** | ✅ | ✅ | ✅ | ✅ |
| **Modifier son profil** | ✅ | ❌ | ❌ | ✅ |
| **Voir section Business autre** | ✅ | ✅* | ❌ | ✅ |
| **Modifier section Business autre** | ✅ | ❌ | ❌ | ✅ |
| **Voir section Family autre** | ✅ | ✅* | ❌ | ✅ |
| **Modifier section Family autre** | ✅ | ❌ | ❌ | ✅ |
| **Voir section Personal autre** | ✅ | ✅* | ❌ | ✅ |
| **Modifier section Personal autre** | ✅ | ❌ | ❌ | ✅ |
| **Voir section Network autre** | ✅ | ✅* | ❌ | ✅ |
| **Modifier section Network autre** | ✅ | ❌ | ❌ | ✅ |
| **Envoyer demande connexion** | ✅ | ❌ | ✅ | ✅ |
| **Accepter/Refuser demande** | ✅ | ❌ | ❌ | ✅ |
| **Gérer permissions connexion** | ✅ | ❌ | ❌ | ✅ |
| **Supprimer connexion** | ✅ | ❌ | ❌ | ✅ |
| **Voir tous les membres** | ✅ | ✅ | ✅ | ✅ |
| **Modifier profil autre membre** | ❌ | ❌ | ❌ | ✅ |
| **Changer rôle membre** | ❌ | ❌ | ❌ | ✅ |
| **Bannir membre** | ❌ | ❌ | ❌ | ✅ |
| **Modérer contenu** | ❌ | ❌ | ❌ | ✅ |
| **Voir analytics** | ❌ | ❌ | ❌ | ✅ |
| **Voir logs système** | ❌ | ❌ | ❌ | ✅ |
| **Configurer paramètres système** | ❌ | ❌ | ❌ | ✅ |

*Si permission accordée pour cette section

---

## 5. Restrictions et Limitations

### 5.1 Pour les Membres

**Restrictions** :
- ❌ Ne peuvent pas modifier le profil d'un autre membre
- ❌ Ne peuvent pas voir les sections d'un membre non connecté
- ❌ Ne peuvent pas accéder au panel admin
- ❌ Ne peuvent pas modérer le contenu
- ❌ Ne peuvent pas voir les analytics globaux
- ❌ Ne peuvent pas voir les logs système

**Limitations** :
- Nombre maximum de parrainages (configurable)
- Taille max des fichiers upload (configurable)
- Limite de connexions (si applicable)

### 5.2 Pour les Admins

**Restrictions** :
- ⚠️ Ne doivent jamais retirer tous les admins
- ⚠️ Doivent confirmer les actions destructives
- ⚠️ Doivent respecter la confidentialité des données

**Responsabilités** :
- Modération du contenu
- Support aux membres
- Maintenance du système
- Surveillance de la sécurité

---

**Document suivant** : [Index Général](./00-INDEX.md)

