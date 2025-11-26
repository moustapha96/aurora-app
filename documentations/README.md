# Documentation - Aurora Society

Ce dossier contient toute la documentation technique du projet Aurora Society.

---

## 📚 Index des Documentations

### 🔐 Sécurité

- **[RATE_LIMITING.md](./RATE_LIMITING.md)** - Système de rate limiting contre les attaques par force brute
  - Protection des tentatives de connexion
  - Configuration et déploiement
  - Tests et dépannage

### 📄 Pages et Fonctionnalités

- **[GUIDE_CONNEXION_ADMIN.md](./GUIDE_CONNEXION_ADMIN.md)** - Guide de connexion admin
  - Comment créer un compte administrateur
  - Comment se connecter en tant qu'admin
  - Accès aux pages admin
  - Dépannage et vérification

- **[GUIDE_CREATE_ADMIN_SQL.md](./GUIDE_CREATE_ADMIN_SQL.md)** - Créer un admin via SQL
  - Méthode alternative si l'Edge Function ne fonctionne pas
  - Création via Supabase Dashboard + SQL
  - Scripts SQL prêts à l'emploi
  - Vérification et dépannage

- **[NETWORK_CONTENT.md](./NETWORK_CONTENT.md)** - Page Network avec contenu dynamique
  - Gestion du contenu d'influence et réseau social
  - Sauvegarde en base de données
  - Gestion des liens sociaux et images
  - Permissions d'accès

- **[CONFIGURATION_SUPABASE_NETWORK.md](./CONFIGURATION_SUPABASE_NETWORK.md)** - Configuration Supabase pour Network
  - Guide de configuration manuelle
  - Vérification et tests
  - Dépannage

- **[GUIDE_SETUP_SUPABASE_NETWORK.md](./GUIDE_SETUP_SUPABASE_NETWORK.md)** - Guide complet de setup
  - Configuration rapide
  - Configuration détaillée
  - Checklist de déploiement

- **[GUIDE_VERIFICATION.md](./GUIDE_VERIFICATION.md)** - Guide de vérification
  - Vérification de la configuration Supabase
  - Scripts SQL de vérification
  - Checklist complète
  - Dépannage

### 🛠️ Scripts SQL

- **[SCRIPT_CREATE_FRIENDSHIPS.sql](./SCRIPT_CREATE_FRIENDSHIPS.sql)** - Script pour créer la table friendships
  - Création de la table avec toutes les colonnes
  - Configuration des politiques RLS
  - Ajout des index

- **[SCRIPT_SETUP_NETWORK.sql](./SCRIPT_SETUP_NETWORK.sql)** - Script complet pour Network
  - Création de la table network_content
  - Configuration du bucket de stockage
  - Toutes les politiques RLS et de stockage

- **[SCRIPT_VERIFICATION.sql](./SCRIPT_VERIFICATION.sql)** - Script de vérification
  - Vérification de toutes les tables
  - Vérification des politiques
  - Vérification des index et triggers
  - Résumé de vérification

- **[SCRIPT_FIX_PROFILES_COLUMNS.sql](./SCRIPT_FIX_PROFILES_COLUMNS.sql)** - Script de correction profiles
  - Ajoute toutes les colonnes manquantes à la table profiles
  - Corrige l'erreur "Could not find the 'is_founder' column"
  - Vérification automatique après correction

- **[SCRIPT_FIX_PROFILE_INSERT_RLS.sql](./SCRIPT_FIX_PROFILE_INSERT_RLS.sql)** - Script de correction RLS
  - Crée la fonction `create_profile` pour contourner RLS lors de l'inscription
  - Corrige l'erreur "new row violates row-level security policy for table profiles"
  - Permet la création de profil même si l'utilisateur n'est pas encore authentifié

- **[SCRIPT_FIX_BUSINESS_CONTENT.sql](./SCRIPT_FIX_BUSINESS_CONTENT.sql)** - Script de correction business_content
  - Crée la table `business_content` si elle n'existe pas
  - Configure les politiques RLS pour la table
  - Configure les politiques de storage pour le bucket `personal-content`
  - Corrige l'erreur "Could not find the table 'public.business_content'"
  - Corrige l'erreur RLS lors de l'upload dans le storage

- **[SCRIPT_FIX_FAMILY_CONTENT.sql](./SCRIPT_FIX_FAMILY_CONTENT.sql)** - Script de correction family_content
  - Crée la table `family_content` si elle n'existe pas
  - Configure les politiques RLS pour la table
  - Corrige l'erreur "Could not find the table 'public.family_content'"

- **[SCRIPT_FIX_CONTENT_TABLES.sql](./SCRIPT_FIX_CONTENT_TABLES.sql)** - Script combiné (recommandé)
  - Corrige `business_content` ET `family_content` en une seule fois
  - Configure toutes les politiques RLS
  - Configure les politiques de storage pour `personal-content`
  - Vérification automatique à la fin

- **[SCRIPT_CREATE_ADMIN.sql](./SCRIPT_CREATE_ADMIN.sql)** - Script pour créer un admin (complet)
  - Crée un administrateur directement via SQL
  - Vérifie l'existence de l'utilisateur
  - Crée/met à jour le profil et attribue le rôle admin

- **[SCRIPT_CREATE_ADMIN_SIMPLE.sql](./SCRIPT_CREATE_ADMIN_SIMPLE.sql)** - Script pour créer un admin (simple)
  - Version simplifiée du script de création d'admin
  - Nécessite que l'utilisateur soit créé d'abord dans Authentication
  - Plus rapide et plus facile à utiliser

- **[SCRIPT_FIX_CONNECTION_REQUESTS.sql](./SCRIPT_FIX_CONNECTION_REQUESTS.sql)** - Script pour créer connection_requests
  - Crée la table `connection_requests` si elle n'existe pas
  - Configure les politiques RLS pour les demandes de connexion
  - Ajoute les index pour les performances
  - Corrige l'erreur "Could not find the table 'public.connection_requests'"

- **[SCRIPT_FIX_FRIENDSHIPS_RLS.sql](./SCRIPT_FIX_FRIENDSHIPS_RLS.sql)** - Script pour corriger friendships RLS
  - Corrige les politiques RLS de la table `friendships`
  - Permet la création bidirectionnelle lors de l'acceptation d'une demande
  - Corrige l'erreur "new row violates row-level security policy for table friendships"

- **[SCRIPT_FIX_PERSONAL_TABLES.sql](./SCRIPT_FIX_PERSONAL_TABLES.sql)** - Script pour créer les tables personal
  - Crée les tables `sports_hobbies`, `artwork_collection`, et `destinations`
  - Configure les politiques RLS avec accès pour les amis (personal_access)
  - Configure les politiques de storage pour le bucket `personal-content`
  - Corrige les erreurs 404 pour ces tables

- **[SCRIPT_FIX_USER_ROLES_RLS.sql](./SCRIPT_FIX_USER_ROLES_RLS.sql)** - Script pour corriger user_roles RLS
  - Corrige la récursion infinie dans les politiques RLS de `user_roles`
  - Crée une fonction `is_admin()` SECURITY DEFINER pour éviter la récursion
  - Sépare les politiques par opération (SELECT, INSERT, UPDATE, DELETE)
  - Corrige l'erreur "infinite recursion detected in policy for relation user_roles"

- **[CE_QUI_RESTE_A_FAIRE.md](./CE_QUI_RESTE_A_FAIRE.md)** - État des lieux des tâches restantes
  - Priorités et statuts
  - Statistiques du projet

---

## 📋 Structure

Chaque documentation suit cette structure :

1. **Vue d'ensemble** - Description générale
2. **Architecture** - Structure technique
3. **Utilisation** - Comment utiliser la fonctionnalité
4. **Configuration** - Paramètres et options
5. **Déploiement** - Instructions de déploiement
6. **Tests** - Guide de test
7. **Dépannage** - Solutions aux problèmes courants

---

## 🔄 Mise à jour

Les documentations sont mises à jour lors de :
- Ajout de nouvelles fonctionnalités
- Modification de l'architecture
- Changements de configuration
- Correction de bugs

**Dernière mise à jour** : Décembre 2024

---

## 📝 Convention de nommage

- **MAJUSCULES_WITH_UNDERSCORES.md** pour les noms de fichiers
- Titre en français pour la clarté
- Version et date de création dans l'en-tête

---

## 🤝 Contribution

Pour ajouter une nouvelle documentation :

1. Créer le fichier dans `documentations/`
2. Suivre la structure standard
3. Mettre à jour ce README avec le lien
4. Inclure la date de création et la version

