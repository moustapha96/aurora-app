# Guide Utilisateur - Membre

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Public** : Membres de Aurora Society

---

## 1. Première Connexion

### 1.1 Inscription

1. Accédez à la page d'inscription (`/register`)
2. Remplissez le formulaire :
   - Email
   - Mot de passe (minimum 8 caractères)
   - Prénom
   - Nom
   - Téléphone mobile
   - **Code de parrainage** (obligatoire - obtenu d'un membre existant)
3. Validez votre email via le lien reçu
4. Connectez-vous avec vos identifiants

### 1.2 Connexion

1. Accédez à `/login`
2. Saisissez votre email et mot de passe
3. Vous êtes redirigé vers `/member-card` (votre carte membre)

---

## 2. Navigation Principale

### 2.1 Carte Membre (`/member-card`)

**Vue d'ensemble de votre profil**

**Actions disponibles** :
- **Modifier le profil** : Accès à l'édition complète
- **Sections cliquables** :
  - BUSINESS → Section professionnelle
  - FAMILY & SOCIAL → Section familiale
  - PERSONAL → Section personnelle
  - INFLUENCE & NETWORK → Section réseau
  - INTEGRATED SERVICES → Services premium
  - MEMBRES → Répertoire des membres

**Informations affichées** :
- Photo de profil (cliquez pour changer)
- Nom, prénom, titre honorifique
- Fonction, domaine d'activité
- Pays
- Citation personnelle
- Badges (Fondateur, Mécène, Richesse)
- Nombre de connexions

---

## 3. Gestion du Profil

### 3.1 Édition du Profil de Base (`/edit-profile`)

**Champs modifiables** :

1. **Photo de profil**
   - Cliquez sur l'avatar ou utilisez le bouton "Choisir un fichier"
   - Formats acceptés : JPG, PNG
   - Taille recommandée : 400x400px minimum

2. **Informations personnelles**
   - Prénom, Nom
   - Titre honorifique (sélection dans liste)
   - Téléphone mobile
   - Fonction professionnelle
   - Domaine d'activité (sélection)
   - Pays (sélection)
   - Citation personnelle

3. **Niveau de richesse**
   - Montant
   - Unité : Millions (M) ou Milliards (Md)
   - Devise : EUR, USD, GBP, CHF, JPY, CNY, AED, SAR

**Sauvegarde** :
- Cliquez sur "Enregistrer"
- Les champs modifiés sont mis en évidence
- Redirection vers `/member-card` après sauvegarde

---

### 3.2 Section Business (`/business`)

**Contenu professionnel**

**Éléments à compléter** :
1. **Entreprise**
   - Nom de l'entreprise
   - Description
   - Logo (upload)
   - Photos (plusieurs)

2. **Position**
   - Titre du poste

3. **Réalisations**
   - Texte riche (HTML supporté)
   - Images intégrées possibles

4. **Portfolio**
   - Présentation des projets
   - Texte riche

5. **Vision**
   - Vision d'entreprise
   - Texte riche

**Édition** :
- Cliquez sur "Modifier" en haut à droite
- Utilisez l'éditeur riche pour formater le texte
- Ajoutez des images en collant directement
- Sauvegardez vos modifications

**Accès** :
- Vous : Accès total + édition
- Autres membres : Si connecté ET `business_access = true`

---

### 3.3 Section Family (`/family`)

**Contenu familial et social**

**Éléments à compléter** :
1. **Phrase d'accroche**
   - Citation personnelle mise en avant

2. **Biographie**
   - Biographie longue et détaillée
   - Texte riche (HTML)

3. **Famille & Résidences**
   - Famille proche (texte riche)
   - Résidences (texte riche + images)

4. **Philanthropie & Causes**
   - Engagements philanthropiques
   - Texte riche + images

5. **Réseau & Affiliations**
   - Réseaux sociaux
   - Affiliations
   - Texte riche

6. **Moments marquants**
   - Anecdotes et moments importants
   - Texte riche

7. **Documents PDF**
   - Upload de documents PDF
   - Visualisation intégrée

8. **Galerie photos**
   - Portrait principal
   - Galerie de photos

**Édition** :
- Cliquez sur "Modifier"
- Utilisez l'éditeur riche
- Ajoutez des images en collant
- Organisez la galerie
- Sauvegardez

**Accès** :
- Vous : Accès total + édition
- Autres membres : Si connecté ET `family_access = true`

---

### 3.4 Section Personal (`/personal`)

**Contenu personnel**

**Éléments à compléter** :

1. **Sports Organisés**
   - **Yachting** : Statistiques, photos, badges
   - **Polo** : Statistiques, photos, badges
   - **Chasse** : Statistiques, photos, badges
   - Pour chaque sport :
     - Titre, sous-titre, description
     - Image
     - Badge
     - 3 statistiques (label + valeur)

2. **Sports & Hobbies Personnalisés**
   - Ajoutez vos propres sports/hobbies
   - Titre, description
   - Badge optionnel
   - Ordre d'affichage

3. **Collection d'Art**
   - Ajoutez des œuvres
   - Pour chaque œuvre :
     - Titre, Artiste, Année
     - Medium, Prix, Acquisition
     - Description
     - Image
   - Réorganisez l'ordre

4. **Destinations**
   - Ajoutez vos destinations de voyage
   - Lieu, Type, Saison
   - Ordre d'affichage

**Édition** :
- Cliquez sur "Modifier" pour chaque section
- Ajoutez/supprimez des éléments
- Réorganisez avec drag & drop
- Sauvegardez

**Accès** :
- Vous : Accès total + édition
- Autres membres : Si connecté ET `personal_access = true`

---

### 3.5 Section Network (`/network`)

**Réseau et influence sociale**

**Sections** :

1. **Réseaux Sociaux**
   - Instagram
   - LinkedIn
   - Twitter
   - Facebook
   - Site web
   - Contenu texte

2. **Médias & Couverture Presse**
   - Articles, interviews
   - Texte riche + images

3. **Philanthropie & Engagement**
   - Engagements sociaux
   - Texte riche + images

**Édition** :
- Cliquez sur "Modifier" pour chaque section
- Remplissez les liens sociaux
- Ajoutez du contenu texte
- Images optionnelles
- Sauvegardez

**Accès** :
- Vous : Accès total + édition
- Autres membres : Si connecté ET `influence_access = true`

---

## 4. Réseau et Connexions

### 4.1 Répertoire des Membres (`/members`)

**Fonctionnalités** :

1. **Recherche et Filtres**
   - Recherche par nom
   - Filtre par industrie
   - Filtre par pays
   - Filtre par badge (Diamond, Platinum, Gold)
   - Filtre par statut (Fondateur, Mécène)

2. **Tri**
   - Par nom
   - Par nombre de connexions
   - Par richesse

3. **Affichage**
   - Cartes membres (style LinkedIn)
   - Informations visibles :
     - Avatar, nom, titre
     - Industrie, localisation
     - Badges
     - Nombre de connexions
     - Statut de connexion

4. **Actions**
   - **Voir profil** : Accès au profil complet
   - **Demander connexion** : Si non connecté
   - **Gérer permissions** : Si connecté (icône paramètres)
   - **Voir connexions** : Voir le réseau d'un membre

---

### 4.2 Demandes de Connexion

**Recevoir une demande** :
1. La demande apparaît dans `/profile` (section "Demandes de connexion")
2. Cliquez sur "Accepter"
3. **Définissez les permissions** :
   - ✅ Business Access
   - ✅ Family Access
   - ✅ Personal Access
   - ✅ Influence Access
   - ✅ Network Access
4. Cliquez sur "Accepter avec ces permissions"
5. La connexion est créée

**Refuser une demande** :
- Cliquez sur "Refuser"
- La demande est rejetée

**Envoyer une demande** :
1. Allez sur `/members`
2. Trouvez le membre
3. Cliquez sur "Demander connexion"
4. Le membre recevra une notification

---

### 4.3 Gestion des Connexions (`/connections`)

**Fonctionnalités** :

1. **Liste des connexions**
   - Toutes vos connexions
   - Date de connexion
   - Permissions accordées

2. **Modifier les permissions**
   - Cliquez sur l'icône paramètres
   - Modifiez les permissions :
     - Business Access
     - Family Access
     - Personal Access
     - Influence Access
     - Network Access
   - Sauvegardez

3. **Voir le profil**
   - Cliquez sur le nom
   - Accès au profil du membre

4. **Supprimer une connexion**
   - Bouton "Supprimer"
   - Confirmation requise
   - La connexion est supprimée des deux côtés

---

## 5. Services Premium

### 5.1 Concierge (`/concierge`)

**Service de conciergerie premium**

- Demandes de services
- Historique des demandes
- Support dédié

---

### 5.2 Metaverse (`/metaverse`)

**Expérience immersive virtuelle**

- Accès à l'environnement virtuel
- Interactions avec autres membres
- Événements virtuels

---

### 5.3 Marketplace (`/marketplace`)

**Place de marché exclusive**

- Catalogue de produits/services
- Achat/vente entre membres
- Transactions sécurisées

---

## 6. Système de Parrainage

### 6.1 Votre Code de Parrainage (`/referrals`)

**Fonctionnalités** :
- Affichage de votre code unique
- Partage du code (copier)
- Liste des membres parrainés
- Statistiques de parrainage

**Utilisation** :
- Partagez votre code avec des contacts
- Ils l'utilisent lors de l'inscription
- Vous êtes crédité comme parrain

---

## 7. Messagerie (`/messages`)

**Communication entre membres**

**Fonctionnalités** :
- Liste des conversations
- Création de nouvelle conversation
- Envoi/réception de messages
- Indicateur de messages non lus
- Historique complet

**Créer une conversation** :
1. Allez sur `/messages`
2. Cliquez sur "Nouvelle conversation"
3. Sélectionnez un membre connecté
4. Commencez à échanger

---

## 8. Paramètres (`/settings`)

**Configuration personnelle**

**Sections** :
- **Langue** : Choisissez votre langue
- **Notifications** : Préférences de notifications
- **Confidentialité** : Paramètres de confidentialité
- **Sécurité** : Authentification biométrique, etc.
- **Compte** : Informations du compte

---

## 9. Bonnes Pratiques

### 9.1 Compléter son Profil

1. **Commencez par les bases** : Photo, nom, fonction
2. **Enrichissez progressivement** : Ajoutez du contenu dans chaque section
3. **Utilisez des images** : Rendez votre profil visuellement attractif
4. **Soyez authentique** : Partagez des informations réelles et pertinentes

### 9.2 Gérer ses Connexions

1. **Sélectionnez soigneusement** : Connectez-vous avec des membres pertinents
2. **Gérez les permissions** : Accordez l'accès approprié à chaque section
3. **Restez actif** : Répondez aux demandes de connexion
4. **Respectez la confidentialité** : Ne partagez que ce que vous souhaitez

### 9.3 Utiliser les Services

1. **Explorez** : Découvrez tous les services disponibles
2. **Participez** : Engagez-vous dans la communauté
3. **Profitez** : Utilisez les services premium

---

## 10. Support

### 10.1 Contact (`/contact`)

**Formulaire de contact** :
- Sujet
- Message
- Envoi direct à l'équipe

### 10.2 Aide

- Consultez les conditions d'utilisation (`/terms`)
- Contactez l'équipe via `/contact`
- Demandez de l'aide à vos connexions

---

**Document suivant** : [Guide Utilisateur - Admin](./06-GUIDE_UTILISATEUR_ADMIN.md)

