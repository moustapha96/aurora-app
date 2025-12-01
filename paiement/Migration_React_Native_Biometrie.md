## Document de cadrage  
### Migration Aurora Society vers React Native & Authentification biométrique

---

## 1. Contexte et objectifs

**Contexte actuel**

- Application **Aurora Society** développée en **React + Vite + Supabase**, orientée web (SPA + PWA).
- Fonctionnalités avancées déjà en place : authentification, gestion de profil, système de parrainage, messagerie, pages admin, etc.
- Besoin d’une **expérience mobile native premium** alignée avec le positionnement haut de gamme (élite mondiale).

**Objectifs de la migration**

- Créer une **application mobile native** (iOS & Android) basée sur **React Native**.
- **Réutiliser au maximum** la logique métier existante (Supabase, Edge Functions, base de données).
- Ajouter une **authentification biométrique**:
  - **Face ID** (iOS)
  - **Touch ID / empreinte digitale** (iOS & Android)
  - Déverrouillage rapide de session (sans ressaisir l’email/mot de passe).
- Poser les bases pour :
  - Notifications push
  - Accès hors-ligne partiel (caching, synchronisation)

---

## 2. Périmètre fonctionnel de la première version mobile

**Inclus dans la V1 mobile**

- **Authentification**
  - Login / Register (flux simplifié)
  - Reset password
  - Vérification d’email (affichage du statut)
  - Authentification biométrique pour déverrouiller la session
- **Profil & carte de membre**
  - Affichage du profil (sections principales)
  - Affichage de la carte de membre
- **Réseau & parrainage**
  - Liste des membres (lecture)
  - Affichage du réseau/parrainage (vu utilisateur)
- **Paramètres**
  - Changement de langue (internationalisation)
  - Activation / désactivation de la biométrie
- **Sécurité**
  - Respect des règles de sécurité déjà définies côté backend (Supabase, RLS, Edge Functions)

**Hors périmètre V1 (à planifier pour V2)**

- Interface d’administration complète (pages admin)
- Marketplace, Metaverse, Concierge complets
- Paiement Stripe natif
- Messagerie en temps réel avec notifications push avancées

---

## 3. Architecture cible (mobile – Expo)

### 3.1. Choix techniques

- **Framework mobile** :  
  - **Expo (React Native)** – choix retenu pour bénéficier :
    - d’un outillage rapide (Expo Go, OTA updates),
    - d’APIs unifiées pour la biométrie, le stockage sécurisé, etc.
- **Backend** :  
  - **Supabase** (conservé tel quel) : Auth, BDD PostgreSQL, Edge Functions
- **Gestion d’état / requêtes** :
  - **React Query** (déjà utilisé côté web → réutilisable conceptuellement)
- **Navigation** :
  - **Expo Router** (recommandé) ou **React Navigation** selon préférence,
  - avec un schéma de navigation simple : stack auth + stack app (tabs ou stack).
- **Biométrie** (via Expo) :
  - `expo-local-authentication` pour Face ID / Touch ID / empreinte digitale
- **Stockage sécurisé** :
  - `expo-secure-store` pour stocker de façon chiffrée les tokens (Keychain iOS / Keystore Android abstraits)

### 3.2. Flux d’authentification cible avec biométrie

1. **Connexion initiale**
   - L’utilisateur saisit **email + mot de passe**.
   - Auth via **Supabase Auth** (comme actuellement – même backend).
   - Si succès :
     - Stockage sécurisé du **refresh token / access token** dans :
       - **expo-secure-store** (qui utilise automatiquement Keychain sur iOS et Keystore sur Android).
     - Proposition d’**activer la biométrie** (popup dédiée).

2. **Activation biométrie**
   - Vérification que l’appareil supporte Face ID / Touch ID / empreinte via `expo-local-authentication`.
   - Demande de consentement utilisateur.
   - Stockage d’un flag chiffré indiquant “biométrie activée”.

3. **Ouverture ultérieure de l’app**
   - Si biométrie activée :
     - L’app propose de **déverrouiller avec Face ID / empreinte**.
     - En cas de succès, récupération des tokens stockés et reconnexion transparente à Supabase.
   - En cas d’échec ou refus :
     - Retour au login classique (email + mot de passe).

4. **Sécurité & time-out**
   - Timeout configurable (ex. 15–30 minutes d’inactivité) avant de redemander la biométrie (gestion côté app avec timer + verrouillage écran).
   - Possibilité de **désactiver la biométrie** dans les paramètres.

---

## 4. Stratégie de migration

### 4.1. Approche proposée

- **Approche incrémentale** : commencer par les **flux critiques** (authentification + profil + biométrie), puis étendre.
- **Réutilisation maximale** :
  - **API / Edge Functions Supabase** inchangées.
  - **Schéma de base de données** réutilisé.
  - **Logique métier côté serveur** (validation, sécurité) conservée.

### 4.2. Phases projet

**Phase 1 – Cadrage & Design (1–2 semaines)**  
- Validation du périmètre fonctionnel V1 mobile.  
- Maquettes UX/UI spécifiques mobile (iOS & Android).  
- Choix **confirmé : Expo** (managed workflow) + librairies `expo-local-authentication` et `expo-secure-store`.  
- Spécifications techniques biométrie + sécurité.  

**Phase 2 – Setup technique & fondations (1–2 semaines)**  
- Initialisation projet **Expo** (TypeScript, Expo Router recommandé).  
- Mise en place de la navigation (stack auth + stack app).  
- Connexion à Supabase Auth depuis mobile.  
- Mise en place de React Query & gestion des erreurs globales.  
- Intégration de l’internationalisation (réutilisation des clés existantes autant que possible).  

**Phase 3 – Implémentation des flux d’authentification (2–3 semaines)**  
- Écrans : Onboarding simple (optionnel), Login, Register, Forgot Password, Reset.  
- Intégration complète avec Supabase Auth.  
- Gestion des tokens, refresh, déconnexion.  

**Phase 4 – Intégration de l’authentification biométrique (2–3 semaines)**  
- Intégration Face ID / Touch ID / empreinte digitale.  
- Écran de configuration biométrie dans les Paramètres.  
- Flux de déverrouillage de session via biométrie.  
- Gestion des cas d’erreurs / désactivation / changement de device.  

**Phase 5 – Profil & Pages principales (2–3 semaines)**  
- Écran Profil + Carte de membre.  
- Liste des membres (lecture).  
- Réseau / parrainage en lecture.  
- Paramètres (langue, biométrie, basiques).  

**Phase 6 – Tests, sécurité & livraison (2–3 semaines)**  
- Tests unitaires et tests manuels sur devices / simulateurs.  
- Tests de sécurité (timeouts, lock biométrique, perte de device).  
- Publication en **TestFlight** (iOS) et **Internal Testing** (Android).  
- Préparation à la mise en production stores.  

---

## 5. Sécurité & conformité

**Principes de sécurité**

- Aucune **donnée sensible** (mot de passe, token en clair) stockée dans AsyncStorage.
- Utilisation des **mécanismes natifs sécurisés** :
  - **iOS** : Keychain + Face ID / Touch ID.
  - **Android** : Keystore + empreinte.
- Respect de la **politique RGPD** :
  - Consentement explicite pour la biométrie.
  - Possibilité de désactiver la biométrie à tout moment.
- **Rate limiting & validation serveur** : conservés via Supabase / Edge Functions (déjà existants dans le projet).

---

## 6. Estimation charge & planning (ordre de grandeur)

> À ajuster après cadrage détaillé.

- Phase 1–2 (cadrage + setup) : **2–4 semaines**
- Phases 3–4 (auth + biométrie) : **4–6 semaines**
- Phases 5–6 (profil + tests + livraison) : **4–6 semaines**

**Total estimatif** : **10–16 semaines** (fonction de la taille de l’équipe et de la complexité des maquettes).

---

## 7. Risques & points de vigilance

- **Complexité biométrique** :
  - Différences iOS / Android (APIs, limitations hardware).
  - Gestion des cas où la biométrie est désactivée par l’utilisateur au niveau système.
- **Synchronisation web / mobile** :
  - S’assurer que les évolutions backend ne cassent pas les flux mobiles.
- **Performance & UX** :
  - Temps de démarrage de l’app, fluidité des écrans (notamment profil et liste de membres).
- **Validation Apple / Google** :
  - Respect des guidelines liées à la biométrie et à la confidentialité.

---

## 8. Décisions à valider par le chef de projet / direction

- **Choix du framework** :  
  - Expo (développement plus rapide, intégrations simples)  
  - ou React Native “bare” (plus de contrôle natif).
- **Périmètre V1 mobile** :  
  - Confirmer les fonctionnalités incluses / exclues.
- **Priorisation** :  
  - Auth + biométrie comme **critère bloquant** pour la V1.
- **Planning & budget** :  
  - Valider la fenêtre de 10–16 semaines et les ressources nécessaires (nombre de devs, QA, design).

---

**Statut** : Document de cadrage prêt à être partagé pour validation.  
**Auteur** : Équipe de développement Aurora Society.


