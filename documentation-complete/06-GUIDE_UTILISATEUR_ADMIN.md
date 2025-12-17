# Guide Utilisateur - Administrateur

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Public** : Administrateurs de Aurora Society

---

## 1. Accès Administrateur

### 1.1 Connexion

1. Connectez-vous avec vos identifiants admin
2. Vous êtes redirigé vers `/admin/dashboard`
3. Le menu admin est accessible depuis toutes les pages

### 1.2 Création d'un Admin

```sql
-- Créer l'utilisateur dans auth.users
-- Puis attribuer le rôle
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid', 'admin');

cree un admin avec admin@aurorasociety.ch et comme mot de passe : Admin@123 
directement comme ca je puisse l'utiliser directement  

seule le role admin peux accéder a cette interface admin 

```

---

## 2. Dashboard Administrateur (`/admin/dashboard`)

### 2.1 Vue d'Ensemble

**Statistiques principales** :
- Nombre total de membres
- Nouveaux membres (période)
- Connexions actives
- Activité récente
- Graphiques d'évolution

**Actions rapides** :
- Accès direct aux sections principales
- Notifications importantes
- Alertes système

---

## 3. Gestion des Membres (`/admin/members`)

### 3.1 Liste des Membres

**Fonctionnalités** :
- Liste complète de tous les membres
- Recherche par nom, email
- Filtres :
  - Par rôle (admin, member)
  - Par statut (actif, banni)
  - Par date d'inscription
- Tri par colonnes
- Pagination

**Informations affichées** :
- Nom, prénom
- Email
- Rôle
- Date d'inscription
- Nombre de connexions
- Statut

### 3.2 Actions sur un Membre

**Voir le profil** :
- Accès complet au profil
- Toutes les sections visibles

**Modifier le profil** :
- Édition de tous les champs
- Modification des badges (Fondateur, Mécène)
- Modification du niveau de richesse

**Changer le rôle** :
- Attribuer le rôle `admin`
- Retirer le rôle `admin`
- Vérification avant modification

**Bannir/Débannir** :
- Bannir un membre (désactive le compte)
- Débannir un membre (réactive le compte)
- Confirmation requise

**Supprimer un membre** :
- Suppression définitive
- ⚠️ **Attention** : Action irréversible
- Supprime :
  - Le compte auth
  - Le profil
  - Toutes les relations
  - Tout le contenu

---

## 4. Gestion des Rôles (`/admin/roles`)

### 4.1 Liste des Rôles

**Affichage** :
- Tous les utilisateurs avec leurs rôles
- Recherche et filtres
- Statistiques par rôle

### 4.2 Attribution de Rôles

**Attribuer un rôle admin** :
1. Trouvez le membre
2. Cliquez sur "Attribuer admin"
3. Confirmez
4. Le membre a maintenant accès au panel admin

**Retirer un rôle admin** :
1. Trouvez l'admin
2. Cliquez sur "Retirer admin"
3. Confirmez
4. Le membre redevient membre standard

**⚠️ Important** :
- Ne retirez jamais tous les admins
- Vérifiez toujours avant de modifier un rôle
- Un admin peut modifier son propre rôle (attention)

---

## 5. Modération (`/admin/moderation`)

### 5.1 Contenu à Modérer

**Types de contenu** :
- Profils
- Contenu business
- Contenu family
- Contenu personal
- Contenu network
- Messages
- Commentaires (si applicable)

**Filtres** :
- Par type de contenu
- Par statut (en attente, approuvé, rejeté)
- Par date
- Par membre

### 5.2 Actions de Modération

**Approuver** :
- Le contenu devient visible
- Notification au membre

**Rejeter** :
- Le contenu est masqué
- Notification au membre avec raison

**Modifier** :
- Édition directe du contenu
- Correction des erreurs
- Amélioration si nécessaire

**Supprimer** :
- Suppression définitive
- Notification au membre
- Confirmation requise

---

## 6. Analytics (`/admin/analytics`)

### 6.1 Statistiques d'Utilisation

**Métriques** :
- Nombre de connexions par jour/semaine/mois
- Pages les plus visitées
- Temps moyen de session
- Taux d'engagement
- Activité par membre

**Graphiques** :
- Évolution du nombre de membres
- Évolution des connexions
- Répartition par pays
- Répartition par industrie
- Activité temporelle

### 6.2 Rapports

**Rapports disponibles** :
- Rapport mensuel d'activité
- Rapport de croissance
- Rapport d'engagement
- Rapport de modération

**Export** :
- Format PDF
- Format Excel/CSV
- Données brutes JSON

---

## 7. Gestion des Connexions (`/admin/connections`)

### 7.1 Vue Globale

**Fonctionnalités** :
- Graphique du réseau complet
- Statistiques de connexions
- Membres les plus connectés
- Clusters de connexions

**Visualisation** :
- Graphique interactif
- Filtres par membre
- Zoom et navigation

### 7.2 Actions

**Voir une connexion** :
- Détails de la relation
- Permissions accordées
- Date de création

**Modifier les permissions** :
- Modification des permissions d'une connexion
- Action exceptionnelle

**Supprimer une connexion** :
- Suppression d'une relation
- Confirmation requise

---

## 8. Gestion du Contenu (`/admin/content`)

### 8.1 Vue de Tout le Contenu

**Types de contenu** :
- Business content
- Family content
- Personal content
- Network content
- Artworks
- Sports/Hobbies
- Destinations

**Recherche** :
- Par type
- Par membre
- Par mots-clés
- Par date

### 8.2 Actions

**Voir le contenu** :
- Aperçu complet
- Contexte (membre propriétaire)

**Modérer** :
- Approuver/Rejeter
- Modifier
- Supprimer

**Statistiques** :
- Nombre de contenus par type
- Contenus les plus consultés
- Membres les plus actifs

---

## 9. Logs Système (`/admin/logs`)

### 9.1 Consultation des Logs

**Types de logs** :
- Authentification
- Actions admin
- Erreurs système
- Modifications de données
- Accès aux pages

**Filtres** :
- Par type
- Par date
- Par utilisateur
- Par niveau (info, warning, error)

**Recherche** :
- Recherche textuelle
- Filtres avancés
- Export des logs

### 9.2 Analyse

**Indicateurs** :
- Erreurs fréquentes
- Patterns d'utilisation
- Problèmes de sécurité
- Performance

---

## 10. Rapports (`/admin/reports`)

### 10.1 Génération de Rapports

**Rapports prédéfinis** :
- Rapport mensuel complet
- Rapport de croissance
- Rapport d'engagement
- Rapport de modération
- Rapport de sécurité

**Rapports personnalisés** :
- Sélection des métriques
- Période personnalisée
- Filtres spécifiques

### 10.2 Export

**Formats** :
- PDF (formaté)
- Excel/CSV (données)
- JSON (données brutes)

**Planification** :
- Rapports automatiques
- Envoi par email
- Fréquence configurable

---

## 11. Paramètres d'Administration (`/admin/settings`)

### 11.1 Configuration Système

**Paramètres globaux** :
- Rôle par défaut pour nouveaux utilisateurs
- Nombre maximum de parrainages par utilisateur
- Paramètres de sécurité
- Configuration email
- Maintenance mode

**Modification** :
- Édition directe
- Validation des valeurs
- Sauvegarde immédiate

### 11.2 Gestion des Fonctionnalités

**Activation/Désactivation** :
- Fonctionnalités principales
- Services premium
- Options avancées

### 11.3 Maintenance

**Mode maintenance** :
- Activer/Désactiver
- Message personnalisé
- Accès admin conservé

**Sauvegardes** :
- Planification des sauvegardes
- Restauration
- Export des données

---

## 12. Bonnes Pratiques Administrateur

### 12.1 Sécurité

1. **Protégez votre compte** :
   - Mot de passe fort
   - Authentification à deux facteurs (si disponible)
   - Ne partagez jamais vos identifiants

2. **Vérifiez avant d'agir** :
   - Vérifiez toujours l'identité avant modifications
   - Confirmez les actions destructives
   - Consultez les logs en cas de doute

3. **Gérez les rôles avec précaution** :
   - Ne créez des admins que si nécessaire
   - Vérifiez régulièrement la liste des admins
   - Ne retirez jamais tous les admins

### 12.2 Modération

1. **Soyez objectif** :
   - Examinez le contenu avant décision
   - Considérez le contexte
   - Respectez les règles établies

2. **Communiquez** :
   - Notifiez les membres des décisions
   - Expliquez les raisons si nécessaire
   - Restez professionnel

3. **Documentez** :
   - Notez les actions importantes
   - Conservez les traces dans les logs
   - Créez des rapports réguliers

### 12.3 Support

1. **Répondez rapidement** :
   - Traitez les demandes de contact
   - Aidez les membres en difficulté
   - Escaladez si nécessaire

2. **Restez disponible** :
   - Vérifiez régulièrement les notifications
   - Surveillez les alertes système
   - Maintenez une présence active

---

## 13. Procédures Courantes

### 13.1 Créer un Nouveau Membre Manuellement

1. Allez sur `/admin/members`
2. Cliquez sur "Créer un membre"
3. Remplissez les informations
4. Le compte est créé avec rôle `member`

### 13.2 Résoudre un Problème de Connexion

1. Vérifiez les logs (`/admin/logs`)
2. Consultez le profil du membre
3. Vérifiez les relations (`/admin/connections`)
4. Contactez le membre si nécessaire

### 13.3 Gérer un Contenu Inapproprié

1. Allez sur `/admin/moderation`
2. Trouvez le contenu
3. Examinez-le en détail
4. Prenez une décision (approuver/rejeter/modifier)
5. Notifiez le membre

### 13.4 Analyser la Croissance

1. Allez sur `/admin/analytics`
2. Consultez les graphiques d'évolution
3. Exportez les données si nécessaire
4. Créez un rapport

---

## 14. Support Technique

### 14.1 Problèmes Techniques

**En cas de problème** :
1. Consultez les logs (`/admin/logs`)
2. Vérifiez les erreurs système
3. Contactez le support technique si nécessaire

### 14.2 Documentation

- Consultez la documentation technique
- Référez-vous aux guides de dépannage
- Contactez l'équipe de développement

---

**Document suivant** : [Possibilités par Membre](./07-POSSIBILITES_PAR_MEMBRE.md)

