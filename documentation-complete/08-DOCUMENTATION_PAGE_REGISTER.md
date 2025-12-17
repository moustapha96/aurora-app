# Documentation Complète - Page Register

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Route** : `/register`

---

## 1. Vue d'Ensemble

La page **Register** (`/register`) est la page d'inscription de l'application Aurora Society. Elle permet aux nouveaux utilisateurs de créer un compte en remplissant un formulaire complet avec validation automatique, scan de carte d'identité avec extraction OCR, et gestion du code de parrainage.

---

## 2. Fonctionnalités Principales

### 2.1 Processus d'Inscription en Deux Étapes

L'inscription se fait en **deux étapes** :

1. **Étape 1 - Formulaire d'Information** (`/register`)
   - Collecte des informations personnelles
   - Upload de photo de profil
   - Scan de carte d'identité (optionnel)
   - Validation du code de parrainage
   - Sauvegarde des données dans le contexte React

2. **Étape 2 - Création du Compte** (`/login?mode=complete`)
   - Création du compte Supabase Auth
   - Définition du mot de passe
   - Création automatique du profil
   - Upload des fichiers (avatar, carte d'identité)

---

## 3. Structure de la Page

### 3.1 En-tête

**Éléments** :
- **Logo Aurora Society** : Image du logo (128x128px)
- **Titre** : "AURORA SOCIETY" (police serif, couleur or)
- **Sous-titre** : "INSCRIPTION" (traduit selon la langue)
- **Sélecteur de langue** : En haut à droite (drapeau + nom de langue)

### 3.2 Vérification des Inscriptions

**Avant d'afficher le formulaire** :
- Vérifie si les inscriptions sont activées (`settings.allowRegistrations`)
- Si désactivées : Affiche un message avec bouton "Retour à la connexion"
- Si activées : Affiche le formulaire d'inscription

---

## 4. Champs du Formulaire

### 4.1 Photo de Profil

**Type** : Upload de fichier image

**Fonctionnalités** :
- **Aperçu** : Affichage de l'avatar (24x24, 96x96px)
- **Format accepté** : Toutes les images (`accept="image/*"`)
- **Format recommandé** : JPG, PNG ou GIF
- **Taille** : Aucune limite spécifiée (gérée par Supabase Storage)
- **Stockage** : Sauvegardé dans le contexte React pour l'étape suivante

**Interface** :
- Avatar avec icône Upload si aucune image
- Input file stylisé
- Texte d'aide : "Format JPG, PNG ou GIF recommandé"

**Code** :
```typescript
const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};
```

---

### 4.2 Code de Parrainage

**Type** : Input avec validation automatique

**Fonctionnalités** :
- **Composant** : `ReferralCodeInput` (composant dédié)
- **Validation automatique** : Vérifie si le code existe en base de données
- **Pré-remplissage** : Peut être pré-rempli via URL (`?ref=CODE`)
- **Optionnel** : Non obligatoire mais recommandé
- **Feedback** : 
  - Toast de succès si code valide (affiche le nom du parrain)
  - Message d'aide si code en cours de validation

**Format** : `AUR-XXX-XXX` (exemple)

**Validation** :
- Vérifie l'existence du code dans `profiles.referral_code`
- Vérifie que le parrain n'a pas atteint sa limite de parrainages
- Affiche le nom du parrain si valide

**Interface** :
- Label : "Code de Parrainage (Optionnel)"
- Placeholder : "AUR-XXX-XXX"
- Message d'aide : "Le code sera validé automatiquement"

---

### 4.3 Carte d'Identité (Scan OCR)

**Type** : Upload de fichier image avec extraction OCR

**Fonctionnalités Avancées** :
- **Upload d'image** : Carte d'identité (recto)
- **Extraction OCR** : Extraction automatique des données
  - Prénom
  - Nom
- **Technologies** :
  - Edge Function Supabase (prioritaire)
  - Fallback : Tesseract.js (client-side)
- **Formatage automatique** : Capitalisation des noms extraits
- **Aperçu** : Affichage de l'image scannée
- **Données extraites** : Affichage en overlay au survol

**Processus** :
1. Utilisateur clique sur "Scanner la Carte d'Identité"
2. Sélection d'un fichier image
3. Conversion en base64
4. Envoi à l'Edge Function ou traitement Tesseract.js
5. Extraction des données (prénom, nom)
6. Formatage et pré-remplissage automatique des champs
7. Affichage des données extraites

**Interface** :
- Bouton "Scanner la Carte d'Identité"
- Aperçu de l'image (192x128px) si uploadée
- Overlay au survol avec données extraites
- Message de statut : "Carte d'identité téléchargée"
- Affichage des données extraites dans un encadré

**Messages** :
- ✅ Succès : "Succès : Prénom, Nom extraits"
- ⚠️ Partiel : "Texte extrait mais noms non identifiés. Veuillez remplir manuellement."
- ❌ Échec : "Aucune donnée extraite de la carte d'identité" (mais l'image est sauvegardée)

**Code** :
```typescript
const handleScanId = async () => {
  // Sélection fichier
  // Conversion base64
  // Extraction OCR via extractTextFromImage()
  // Formatage des noms
  // Pré-remplissage des champs
};
```

---

### 4.4 Prénom

**Type** : Input texte

**Propriétés** :
- **Obligatoire** : ✅ Oui (`required`)
- **Placeholder** : Traduit selon la langue
- **Validation** : 
  - Minimum 1 caractère
  - Maximum 100 caractères
  - Peut être pré-rempli depuis l'OCR

**Auto-remplissage** :
- Si extraction OCR réussie → Pré-rempli automatiquement
- Formatage : Première lettre en majuscule, reste en minuscules

---

### 4.5 Nom

**Type** : Input texte

**Propriétés** :
- **Obligatoire** : ✅ Oui (`required`)
- **Placeholder** : Traduit selon la langue
- **Validation** : 
  - Minimum 1 caractère
  - Maximum 100 caractères
  - Peut être pré-rempli depuis l'OCR

**Auto-remplissage** :
- Si extraction OCR réussie → Pré-rempli automatiquement
- Formatage : Première lettre en majuscule, reste en minuscules

---

### 4.6 Titre Honorifique

**Type** : Select (liste déroulante)

**Propriétés** :
- **Obligatoire** : ❌ Non (optionnel)
- **Options** : Liste complète des titres honorifiques
  - Basée sur `HONORIFIC_TITLES` depuis `@/lib/honorificTitles`
  - Traduits selon la langue sélectionnée
  - Exemples : M., Mme, Dr., Prof., etc.

**Interface** :
- Select avec placeholder : "Sélectionnez votre titre"
- Liste scrollable (max-height: 300px)
- Style : Fond noir, texte or

---

### 4.7 Email

**Type** : Input email

**Propriétés** :
- **Obligatoire** : ✅ Oui (`required`)
- **Type** : `type="email"` (validation HTML5)
- **Placeholder** : "votre@email.com"
- **Validation** :
  - Format email valide
  - Trim et lowercase automatiques
  - Vérification d'unicité en base de données (étape 2)

**Utilisation** :
- Identifiant de connexion
- Envoi d'email de vérification
- Communication avec l'utilisateur

---

### 4.8 Téléphone Mobile

**Type** : Input tel

**Propriétés** :
- **Obligatoire** : ✅ Oui (`required`)
- **Type** : `type="tel"`
- **Placeholder** : Traduit selon la langue
- **Validation** :
  - Format téléphone valide
  - Maximum 20 caractères
  - Regex de validation côté serveur

**Format accepté** :
- International : +33 6 12 34 56 78
- National : 06 12 34 56 78
- Autres formats selon pays

---

### 4.9 Fonction Professionnelle

**Type** : Input texte

**Propriétés** :
- **Obligatoire** : ❌ Non (optionnel)
- **Placeholder** : Traduit selon la langue
- **Exemples** : CEO, Directeur, Entrepreneur, etc.

**Utilisation** :
- Affiché sur le profil
- Utilisé dans les recherches/filtres

---

### 4.10 Domaine d'Activité

**Type** : Select (liste déroulante)

**Propriétés** :
- **Obligatoire** : ❌ Non (optionnel)
- **Options** : Liste des industries
  - Basée sur `INDUSTRIES` depuis `@/lib/industries`
  - Traduites selon la langue
  - Exemples : Finance, Technologie, Immobilier, etc.

**Interface** :
- Select avec placeholder : "Sélectionnez un domaine"
- Liste scrollable (max-height: 300px)
- Recherche possible dans la liste

---

### 4.11 Niveau de Patrimoine

**Type** : Groupe de 3 inputs (montant + unité + devise)

**Propriétés** :
- **Obligatoire** : ❌ Non (optionnel)
- **Composants** :
  1. **Montant** : Input number
  2. **Unité** : Select (M = Millions, Md = Milliards)
  3. **Devise** : Select (EUR, USD, GBP, CHF, JPY, CNY, AED, SAR)

**Interface** :
- 3 champs côte à côte
- Montant : Input flex-1 (prend l'espace disponible)
- Unité : Select w-32 (largeur fixe)
- Devise : Select w-28 (largeur fixe)

**Options Unité** :
- **M** : Millions
- **Md** : Milliards

**Options Devise** :
- **EUR** : Euro (€)
- **USD** : Dollar US ($)
- **GBP** : Livre Sterling (£)
- **CHF** : Franc Suisse
- **JPY** : Yen (¥)
- **CNY** : Yuan (¥)
- **AED** : Dirham Émirati
- **SAR** : Riyal Saoudien

**Calcul automatique** :
- Conversion en milliards d'euros pour stockage (`wealth_billions`)
- Utilisé pour l'affichage des badges de richesse

---

### 4.12 Citation Personnelle

**Type** : Input texte

**Propriétés** :
- **Obligatoire** : ❌ Non (optionnel)
- **Placeholder** : "À remplir plus tard..." (traduit)
- **Longueur** : Pas de limite spécifiée

**Utilisation** :
- Affichée sur le profil
- Citation mise en avant
- Peut être modifiée plus tard

---

### 4.13 Statut Fondateur

**Type** : Checkbox

**Propriétés** :
- **Obligatoire** : ❌ Non (optionnel)
- **Label** : "Membre Fondateur" (avec icône Crown)
- **Style** : Encadré avec bordure or

**Fonctionnalité** :
- Si coché → Badge "FONDATEUR" sur le profil
- Visible sur toutes les cartes membres
- Statut spécial dans l'application

**Interface** :
- Checkbox avec icône Crown
- Encadré avec fond semi-transparent
- Bordure or

---

### 4.14 Acceptation des Conditions

**Type** : Checkbox

**Propriétés** :
- **Obligatoire** : ✅ Oui (`required`)
- **Label** : "J'accepte les Conditions Générales d'Utilisation"
- **Lien** : Vers `/terms` (ouvre dans nouvel onglet)

**Fonctionnalité** :
- Obligatoire pour soumettre le formulaire
- Lien vers la page des conditions d'utilisation
- Validation HTML5

---

## 5. Validation et Contrôles

### 5.1 Validation Côté Client

**Champs obligatoires** :
- ✅ Prénom
- ✅ Nom
- ✅ Email
- ✅ Téléphone mobile
- ✅ Acceptation des conditions

**Validation HTML5** :
- Email : Format email valide
- Téléphone : Format tel
- Required : Champs obligatoires

**Validation personnalisée** :
- Code de parrainage : Vérification en temps réel
- Extraction OCR : Validation des données extraites

### 5.2 Validation Côté Serveur

**Lors de l'étape 2** (`/login?mode=complete`) :
- Email : Unicité vérifiée
- Mot de passe : Force validée selon paramètres
- Données : Sanitization et validation complète

### 5.3 Vérifications Système

**Avant soumission** :
- ✅ Vérifie que les inscriptions sont activées (`settings.allowRegistrations`)
- ✅ Affiche un message d'erreur si désactivées

---

## 6. Processus de Soumission

### 6.1 Lors du Clic sur "Continuer"

**Actions** :
1. **Vérification** : Inscriptions activées ?
2. **Stockage Avatar** : Si présent → Sauvegardé dans `RegistrationContext`
3. **Stockage Carte d'Identité** : Si présente → Sauvegardée dans `RegistrationContext`
4. **Stockage Données** : Toutes les données du formulaire → `RegistrationContext`
5. **Redirection** : Vers `/login?mode=complete`

**Code** :
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Vérification inscriptions activées
  if (!settings.allowRegistrations) {
    toast.error("Les inscriptions sont actuellement désactivées.");
    return;
  }
  
  // Stockage dans le contexte
  if (avatarPreview) {
    setContextAvatarPreview(avatarPreview);
  }
  if (idCardPreview) {
    setContextIdCardPreview(idCardPreview);
  }
  setRegistrationData(formData);
  
  // Redirection vers étape 2
  navigate("/login?mode=complete");
};
```

### 6.2 Étape 2 - Création du Compte

**Sur `/login?mode=complete`** :
1. Affichage du formulaire de mot de passe
2. Création du compte Supabase Auth
3. Création automatique du profil
4. Upload de l'avatar (si présent)
5. Upload de la carte d'identité (si présente)
6. Attribution du rôle `member`
7. Création de l'enregistrement de parrainage (si code valide)
8. Envoi d'email de vérification
9. Redirection vers `/member-card`

---

## 7. Gestion des États

### 7.1 États Locaux

**useState** :
- `loading` : État de chargement (scan OCR, soumission)
- `avatarFile` : Fichier avatar sélectionné
- `avatarPreview` : Aperçu base64 de l'avatar
- `idCardFile` : Fichier carte d'identité sélectionné
- `idCardPreview` : Aperçu base64 de la carte d'identité
- `extractedData` : Données extraites de l'OCR (prénom, nom)
- `referralCodeValid` : Statut de validation du code de parrainage
- `formData` : Toutes les données du formulaire

### 7.2 Contexte React

**RegistrationContext** :
- Stockage temporaire des données entre les deux étapes
- `setRegistrationData()` : Sauvegarde des données du formulaire
- `setAvatarPreview()` : Sauvegarde de l'avatar
- `setIdCardPreview()` : Sauvegarde de la carte d'identité

**SettingsContext** :
- `settings.allowRegistrations` : Vérification si inscriptions activées
- `settingsLoading` : État de chargement des paramètres

**LanguageContext** :
- `language` : Langue actuelle
- `setLanguage()` : Changement de langue
- `t()` : Fonction de traduction

---

## 8. Interface Utilisateur

### 8.1 Design

**Style général** :
- Fond : Noir (`bg-black`)
- Couleurs : Or/Doré (`text-gold`, `border-gold`)
- Police : Serif pour les titres
- Bordure : Or avec transparence (`border-gold/20`, `border-gold/30`)

**Formulaire** :
- Fond : Noir semi-transparent (`bg-black/40`)
- Bordure : Or (`border-gold/20`)
- Padding : `p-8`
- Espacement : `space-y-6`

### 8.2 Responsive

**Mobile** :
- Padding : `px-6 py-12`
- Grille : `grid-cols-1` (colonnes empilées)
- Largeur max : `max-w-2xl`

**Desktop** :
- Grille : `md:grid-cols-2` (2 colonnes pour prénom/nom)
- Centrage : `mx-auto`

### 8.3 Interactions

**Hover** :
- Boutons : Changement de couleur au survol
- Liens : Soulignement au survol
- Carte d'identité : Overlay avec données extraites au survol

**Focus** :
- Inputs : Bordure or au focus
- Selects : Même style

**Loading** :
- Spinner sur boutons pendant chargement
- Désactivation des boutons pendant traitement

---

## 9. Messages et Notifications

### 9.1 Toasts (Notifications)

**Types de messages** :
- ✅ **Succès** : Code de parrainage valide, données extraites
- ⚠️ **Avertissement** : Extraction partielle, code en validation
- ❌ **Erreur** : Erreur générale, inscriptions désactivées
- ℹ️ **Info** : Analyse en cours, extraction en cours

### 9.2 Messages d'Aide

**Affichés sous les champs** :
- Format d'image recommandé
- Code de parrainage en validation
- Carte d'identité téléchargée
- Données extraites (prénom, nom)

---

## 10. Sécurité

### 10.1 Protection des Données

**Avant soumission** :
- Données stockées uniquement dans le contexte React (mémoire)
- Pas d'envoi au serveur avant l'étape 2
- Images converties en base64 (temporaire)

**Lors de la soumission** :
- Validation côté client
- Validation côté serveur (étape 2)
- Sanitization des données
- Hash du mot de passe (Supabase Auth)

### 10.2 Validation du Code de Parrainage

**Vérifications** :
- Existence du code en base de données
- Limite de parrainages non atteinte
- Code non utilisé par le même utilisateur

### 10.3 Extraction OCR

**Sécurité** :
- Traitement côté client (Tesseract.js) ou Edge Function
- Pas de stockage permanent des images OCR
- Données extraites validées avant utilisation

---

## 11. Internationalisation

### 11.1 Langues Supportées

**Sélecteur de langue** :
- En haut à droite de la page
- Liste des langues disponibles
- Changement immédiat de l'interface

**Traductions** :
- Tous les labels
- Tous les placeholders
- Tous les messages
- Titres honorifiques
- Industries

### 11.2 Clés de Traduction Utilisées

- `register` : "INSCRIPTION"
- `profilePhoto` : "Photo de Profil"
- `referralCode` : "Code de Parrainage"
- `idCard` : "Carte d'Identité"
- `scanIdCard` : "Scanner la Carte d'Identité"
- `firstName` : "Prénom"
- `lastName` : "Nom"
- `honorificTitle` : "Titre Honorifique"
- `email` : "Email"
- `mobilePhone` : "Téléphone Mobile"
- `jobFunction` : "Fonction Professionnelle"
- `activityDomain` : "Domaine d'Activité"
- `wealthLevel` : "Niveau de Patrimoine"
- `personalQuote` : "Citation Personnelle"
- `founderMember` : "Membre Fondateur"
- `acceptTerms` : "J'accepte les"
- `terms` : "Conditions Générales d'Utilisation"
- `continue` : "Continuer"
- `signIn` : "Se connecter"

---

## 12. Cas d'Usage

### 12.1 Inscription Standard

1. Utilisateur accède à `/register`
2. Remplit le formulaire
3. Upload une photo de profil (optionnel)
4. Scanne sa carte d'identité (optionnel)
5. Saisit un code de parrainage (optionnel)
6. Clique sur "Continuer"
7. Redirigé vers `/login?mode=complete`
8. Définit son mot de passe
9. Compte créé, profil créé automatiquement

### 12.2 Inscription avec Code de Parrainage

1. Utilisateur accède à `/register?ref=AUR-XXX-XXX`
2. Code pré-rempli automatiquement
3. Validation automatique du code
4. Affichage du nom du parrain
5. Suite du processus normal

### 12.3 Inscription avec Scan OCR

1. Utilisateur clique sur "Scanner la Carte d'Identité"
2. Sélectionne une image de carte d'identité
3. Extraction automatique du prénom et nom
4. Champs pré-remplis automatiquement
5. Utilisateur vérifie et corrige si nécessaire
6. Suite du processus normal

### 12.4 Inscriptions Désactivées

1. Utilisateur accède à `/register`
2. Message affiché : "Les inscriptions sont actuellement désactivées"
3. Bouton "Retour à la connexion"
4. Redirection vers `/login`

---

## 13. Données Stockées

### 13.1 Dans le Contexte React (Étape 1)

**RegistrationContext** :
```typescript
{
  referralCode: string,
  firstName: string,
  lastName: string,
  honorificTitle: string,
  email: string,
  mobile: string,
  jobFunction: string,
  activityDomain: string,
  personalQuote: string,
  isFounder: boolean,
  wealthAmount: string,
  wealthUnit: "M" | "Md",
  wealthCurrency: "EUR" | "USD" | "GBP" | "CHF" | "JPY" | "CNY" | "AED" | "SAR"
}
```

**Avatar** : Base64 string (temporaire)

**Carte d'Identité** : Base64 string (temporaire)

### 13.2 En Base de Données (Étape 2)

**Table `profiles`** :
- Tous les champs du formulaire
- Avatar URL (après upload)
- Carte d'identité URL (après upload)
- Code de parrainage généré automatiquement

**Table `user_roles`** :
- Rôle `member` attribué automatiquement

**Table `referrals`** :
- Enregistrement de parrainage (si code valide)

---

## 14. Composants Utilisés

### 14.1 Composants UI (shadcn/ui)

- `Button` : Boutons d'action
- `Input` : Champs de saisie
- `Label` : Labels des champs
- `Select` : Listes déroulantes
- `Checkbox` : Cases à cocher
- `Card`, `CardContent`, `CardHeader`, `CardTitle` : Cartes
- `Avatar`, `AvatarImage`, `AvatarFallback` : Avatar

### 14.2 Composants Métier

- `ReferralCodeInput` : Input avec validation du code de parrainage
- `AuroraLogo` : Logo de l'application (commenté, remplacé par image)

### 14.3 Utilitaires

- `extractTextFromImage()` : Extraction OCR
- `HONORIFIC_TITLES` : Liste des titres honorifiques
- `INDUSTRIES` : Liste des industries
- `getIndustryTranslationKey()` : Clé de traduction pour industries

---

## 15. Flux Complet

```
1. Utilisateur accède à /register
   ↓
2. Vérification : Inscriptions activées ?
   ├─ Non → Message + Bouton retour
   └─ Oui → Affichage formulaire
   ↓
3. Utilisateur remplit le formulaire
   ├─ Upload photo (optionnel)
   ├─ Scan carte d'identité (optionnel, OCR)
   ├─ Code de parrainage (optionnel, validation)
   └─ Autres champs
   ↓
4. Clic sur "Continuer"
   ↓
5. Stockage dans RegistrationContext
   ↓
6. Redirection vers /login?mode=complete
   ↓
7. Étape 2 : Création du compte
   ├─ Définition du mot de passe
   ├─ Création compte Supabase Auth
   ├─ Création profil
   ├─ Upload fichiers
   └─ Attribution rôle member
   ↓
8. Redirection vers /member-card
```

---

## 16. Points d'Attention

### 16.1 Limitations

- **Taille des fichiers** : Limites Supabase Storage (non spécifiées dans le code)
- **Format OCR** : Fonctionne mieux avec cartes d'identité claires et nettes
- **Code de parrainage** : Limite de parrainages par utilisateur (configurable)

### 16.2 Améliorations Possibles

- Validation en temps réel de tous les champs
- Prévisualisation complète avant soumission
- Sauvegarde automatique des données (localStorage)
- Support de plusieurs langues pour l'OCR
- Validation du format de téléphone par pays

---

## 17. Tests Recommandés

### 17.1 Tests Fonctionnels

- ✅ Soumission avec tous les champs remplis
- ✅ Soumission avec champs optionnels vides
- ✅ Validation du code de parrainage
- ✅ Extraction OCR de la carte d'identité
- ✅ Upload de photo de profil
- ✅ Changement de langue
- ✅ Affichage si inscriptions désactivées

### 17.2 Tests de Validation

- ✅ Champs obligatoires
- ✅ Format email
- ✅ Format téléphone
- ✅ Code de parrainage invalide
- ✅ Extraction OCR échouée

### 17.3 Tests d'Interface

- ✅ Responsive mobile/desktop
- ✅ Affichage des messages d'aide
- ✅ Aperçu des images
- ✅ Overlay carte d'identité

---

**Document lié** : [Pages et Fonctionnalités](./03-PAGES_ET_FONCTIONNALITES.md)

