# Plan Général de Sécurité - Aurora Society

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Objectifs de Sécurité](#objectifs-de-sécurité)
3. [Architecture de Sécurité](#architecture-de-sécurité)
4. [Plan d'Implémentation Global](#plan-dimplémentation-global)
5. [Ordre de Priorité](#ordre-de-priorité)
6. [Checklist de Sécurité](#checklist-de-sécurité)

---

## 🎯 Vue d'Ensemble

Ce document présente le plan complet de sécurisation de l'application Aurora Society avec trois composants principaux :

1. **Onfido API** : Vérification d'identité et authentification des documents (CNI, images)
2. **Capacitor** : Intégration mobile native pour iOS et Android
3. **Biométrie** : Face ID et empreinte digitale pour authentification mobile

### Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    AURORA SOCIETY SECURITY                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   ONFIDO     │  │  CAPACITOR   │  │  BIOMETRIE   │      │
│  │   API        │  │  iOS/Android │  │ Face ID/FP   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                │                    │             │
│         └────────────────┴────────────────────┘             │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │   SUPABASE     │                       │
│                    │   Backend      │                       │
│                    └────────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Objectifs de Sécurité

### 1. Vérification d'Identité (Onfido)

- ✅ **Vérification automatique** des documents d'identité (CNI, passeport, permis)
- ✅ **Détection de fraude** : photos de photos, deepfakes, documents falsifiés
- ✅ **Liveness check** : vérification que la personne est bien présente
- ✅ **Extraction automatique** des données (nom, date de naissance, etc.)
- ✅ **Conformité réglementaire** : KYC/AML, GDPR

### 2. Plateformes Mobiles (Capacitor)

- ✅ **Applications natives** iOS et Android
- ✅ **Accès aux fonctionnalités natives** (caméra, notifications push, etc.)
- ✅ **Stockage sécurisé** (Keychain iOS, Keystore Android)
- ✅ **Performance optimale** sur mobile

### 3. Authentification Biométrique

- ✅ **Face ID** sur iOS (iPhone X et supérieur)
- ✅ **Touch ID** sur iOS (iPhone 5s et supérieur)
- ✅ **Empreinte digitale** sur Android
- ✅ **Déverrouillage rapide** de session sans mot de passe
- ✅ **Sécurité renforcée** avec stockage sécurisé

---

## 🏗️ Architecture de Sécurité

### Flux d'Authentification Complet

```
┌──────────────────────────────────────────────────────────────┐
│                    FLUX D'AUTHENTIFICATION                   │
└──────────────────────────────────────────────────────────────┘

1. INSCRIPTION
   ┌─────────┐
   │ Utilis. │───▶ Scan CNI ───▶ Onfido API ───▶ Vérification
   └─────────┘                                           │
                                                          ▼
                                                   ┌──────────┐
                                                   │ Approuvé │
                                                   └──────────┘

2. CONNEXION WEB
   ┌─────────┐
   │ Utilis. │───▶ Email/Password ───▶ Supabase Auth ───▶ Session
   └─────────┘

3. CONNEXION MOBILE
   ┌─────────┐
   │ Utilis. │───▶ Face ID/Touch ID/Fingerprint ───▶ Session
   └─────────┘            │
                          ▼
                   ┌──────────────┐
                   │ Stockage     │
                   │ Sécurisé     │
                   │ (Keychain/   │
                   │  Keystore)   │
                   └──────────────┘
```

### Composants Techniques

#### 1. Onfido Integration

- **Backend** : Edge Functions Supabase
  - `create-onfido-sdk-token` : Générer token SDK
  - `onfido-webhook` : Traiter résultats de vérification
  - `verify-document-onfido` : Vérifier document via API

- **Frontend** : Composants React
  - `OnfidoVerification` : Widget Onfido
  - Intégration dans flux d'inscription

- **Base de Données** : Tables Supabase
  - Colonnes KYC dans `profiles`
  - Historique des vérifications

#### 2. Capacitor Integration

- **Configuration** : `capacitor.config.ts`
- **Plugins** :
  - `@capacitor/camera` : Accès caméra
  - `@capacitor/preferences` : Stockage préférences
  - `@capacitor/biometric` : Authentification biométrique
  - `@capacitor/secure-storage` : Stockage sécurisé

- **Build** : 
  - iOS : Xcode project
  - Android : Android Studio project

#### 3. Biometric Integration

- **iOS** :
  - Face ID : `LocalAuthentication` framework
  - Touch ID : `LocalAuthentication` framework
  - Keychain : Stockage sécurisé des tokens

- **Android** :
  - BiometricPrompt API
  - Keystore : Stockage sécurisé des tokens
  - FingerprintManager (legacy)

---

## 📅 Plan d'Implémentation Global

### Phase 1 : Onfido API (Semaines 1-3)

**Objectif** : Intégrer Onfido pour vérifier les documents et images

- [ ] **Semaine 1** : Configuration et Backend
  - Créer compte Onfido
  - Configurer variables d'environnement
  - Créer Edge Functions (SDK token, webhook)
  - Migration base de données (colonnes Onfido)

- [ ] **Semaine 2** : Frontend et Intégration
  - Installer SDK Onfido
  - Créer composant `OnfidoVerification`
  - Intégrer dans flux d'inscription
  - Tester flux complet

- [ ] **Semaine 3** : Tests et Optimisation
  - Tests avec différents documents
  - Tests de détection de fraude
  - Optimisation UX
  - Documentation

### Phase 2 : Capacitor iOS/Android (Semaines 4-7)

**Objectif** : Transformer l'app web en app mobile native

- [ ] **Semaine 4** : Installation et Configuration
  - Installer Capacitor
  - Configuration `capacitor.config.ts`
  - Ajouter plateformes (iOS, Android)
  - Premier build et test

- [ ] **Semaine 5** : Plugins et Fonctionnalités Natives
  - Installer plugins nécessaires
  - Configurer accès caméra
  - Configurer notifications
  - Tester sur devices/émulateurs

- [ ] **Semaine 6** : Adaptation Mobile
  - Adapter UI pour mobile
  - Optimiser performances
  - Gérer navigation mobile
  - Tests utilisateur

- [ ] **Semaine 7** : Publication et Distribution
  - Préparer builds production
  - Configurer certificats iOS
  - Configurer signatures Android
  - TestFlight (iOS) / Internal Testing (Android)

### Phase 3 : Biométrie (Semaines 8-10)

**Objectif** : Implémenter authentification biométrique

- [ ] **Semaine 8** : Implémentation iOS
  - Intégrer `@capacitor/biometric`
  - Implémenter Face ID
  - Implémenter Touch ID
  - Stockage sécurisé Keychain

- [ ] **Semaine 9** : Implémentation Android
  - Intégrer BiometricPrompt
  - Implémenter empreinte digitale
  - Stockage sécurisé Keystore
  - Gestion erreurs/failures

- [ ] **Semaine 10** : Intégration et Tests
  - Intégrer dans flux d'authentification
  - Interface paramètres biométrie
  - Tests sur différents devices
  - Documentation utilisateur

### Phase 4 : Tests et Sécurité (Semaine 11-12)

**Objectif** : Validation complète de la sécurité

- [ ] **Semaine 11** : Tests de Sécurité
  - Audit sécurité Onfido
  - Tests biométrie (défaillance, bypass)
  - Tests stockage sécurisé
  - Tests conformité GDPR

- [ ] **Semaine 12** : Optimisation et Documentation
  - Optimisation performances
  - Documentation complète
  - Formation équipe
  - Préparation production

---

## 🎯 Ordre de Priorité

### Priorité 1 : Onfido (Critique)

**Pourquoi** :
- Nécessaire pour la vérification des membres
- Conformité réglementaire (KYC/AML)
- Protection contre la fraude

**Dépendances** : Aucune

**Risque** : Élevé si non implémenté (fraude, non-conformité)

### Priorité 2 : Capacitor (Important)

**Pourquoi** :
- Expérience mobile native
- Accès fonctionnalités natives
- Base pour biométrie

**Dépendances** : Aucune (mais recommandé avant biométrie)

**Risque** : Moyen (expérience utilisateur dégradée sur mobile)

### Priorité 3 : Biométrie (Amélioration)

**Pourquoi** :
- Expérience utilisateur améliorée
- Sécurité renforcée
- Confort d'utilisation

**Dépendances** : Capacitor (doit être installé)

**Risque** : Faible (fonctionnalité de confort, pas critique)

---

## ✅ Checklist de Sécurité

### Onfido

- [ ] Compte Onfido créé et configuré
- [ ] Variables d'environnement configurées
- [ ] Edge Functions créées et déployées
- [ ] Migration base de données appliquée
- [ ] Composant React créé et intégré
- [ ] Webhooks configurés et testés
- [ ] Tests avec différents documents
- [ ] Documentation complète

### Capacitor

- [ ] Capacitor installé et configuré
- [ ] Configuration iOS (Xcode)
- [ ] Configuration Android (Gradle)
- [ ] Plugins installés et configurés
- [ ] Build iOS fonctionnel
- [ ] Build Android fonctionnel
- [ ] Tests sur devices réels
- [ ] Documentation déploiement

### Biométrie

- [ ] Plugin biométrique installé
- [ ] Face ID implémenté (iOS)
- [ ] Touch ID implémenté (iOS)
- [ ] Empreinte digitale implémentée (Android)
- [ ] Stockage sécurisé configuré
- [ ] Interface paramètres créée
- [ ] Tests sur différents devices
- [ ] Gestion erreurs complète
- [ ] Documentation utilisateur

### Sécurité Globale

- [ ] Audit sécurité complet
- [ ] Tests de pénétration
- [ ] Conformité GDPR vérifiée
- [ ] Politique de confidentialité mise à jour
- [ ] Documentation sécurité complète
- [ ] Formation équipe
- [ ] Plan de réponse incidents

---

## 📊 Estimation Globale

### Temps

- **Onfido** : 3 semaines (1 développeur)
- **Capacitor** : 4 semaines (1 développeur)
- **Biométrie** : 3 semaines (1 développeur)
- **Tests et Documentation** : 2 semaines (1 développeur)

**Total** : **12 semaines** (3 mois)

### Coûts

- **Onfido** : ~1-3€ par vérification (selon package)
- **Capacitor** : Gratuit (open source)
- **Biométrie** : Gratuit (APIs natives)
- **Développement** : Selon tarifs équipe

---

## 🔗 Documents Associés

1. [Intégration Onfido](./01-ONFIDO_INTEGRATION.md) - Guide complet Onfido API
2. [Capacitor iOS/Android](./02-CAPACITOR_MOBILE.md) - Guide Capacitor pour applications natives
3. [Authentification Biométrique](./03-BIOMETRIE_AUTH.md) - Guide Face ID/Touch ID/Empreinte digitale
4. [Guide de Sécurité](./04-GUIDE_SECURITE.md) - Bonnes pratiques sécurité et conformité

---

## 📝 Notes Importantes

### Conformité

- **GDPR** : Onfido est conforme GDPR
- **RGPD** : Données biométriques nécessitent consentement explicite
- **KYC/AML** : Onfido respecte les standards internationaux

### Sécurité des Données

- **Stockage** : Tokens stockés de manière sécurisée (Keychain/Keystore)
- **Transmission** : Toutes communications en HTTPS/TLS
- **Chiffrement** : Données sensibles chiffrées au repos

### Support

- **Onfido** : Support disponible via dashboard
- **Capacitor** : Documentation complète + communauté
- **Biométrie** : Documentation Apple/Google + Capacitor

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0.0  
**Statut** : Plan initial

