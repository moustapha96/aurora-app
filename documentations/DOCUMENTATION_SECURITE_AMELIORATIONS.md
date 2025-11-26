# Documentation - Améliorations de Sécurité

**Date** : 2024  
**Version** : 1.0.0

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Suppression de sessionStorage](#suppression-de-sessionstorage)
3. [Restriction CORS](#restriction-cors)
4. [Validation Serveur](#validation-serveur)
5. [Configuration](#configuration)
6. [Tests](#tests)

---

## Vue d'ensemble

Ce document décrit les améliorations de sécurité critiques implémentées pour renforcer la protection de l'application Aurora Society :

1. **Suppression de sessionStorage** : Élimination du stockage de données sensibles dans le navigateur
2. **Restriction CORS** : Mise en place d'une whitelist de domaines autorisés
3. **Validation Serveur** : Validation et sanitization de toutes les données côté serveur

---

## Suppression de sessionStorage

### Problème Identifié

Les données d'inscription (email, informations personnelles, avatar) étaient stockées dans `sessionStorage`, ce qui présente plusieurs risques :

- **Vulnérabilité XSS** : Les données peuvent être volées par des scripts malveillants
- **Persistance** : Les données restent même après fermeture de l'onglet
- **Accessibilité** : Accessibles via la console du navigateur
- **Non-conformité RGPD** : Stockage non sécurisé de données personnelles

### Solution Implémentée

Création d'un **contexte React temporaire** (`RegistrationContext`) qui stocke les données uniquement en mémoire :

#### Fichiers Modifiés

- **`src/contexts/RegistrationContext.tsx`** (Nouveau)
  - Contexte React pour stocker temporairement les données d'inscription
  - Données stockées uniquement en mémoire (état React)
  - Nettoyage automatique après utilisation

- **`src/App.tsx`**
  - Ajout du `RegistrationProvider` pour envelopper l'application

- **`src/pages/Register.tsx`**
  - Remplacement de `sessionStorage.setItem()` par `setRegistrationData()`
  - Remplacement de `sessionStorage.setItem('registrationAvatar')` par `setAvatarPreview()`

- **`src/pages/Login.tsx`**
  - Remplacement de `sessionStorage.getItem()` par `useRegistration()`
  - Nettoyage avec `clearRegistrationData()` après création du compte

### Avantages

✅ **Sécurité** : Données uniquement en mémoire, jamais persistées  
✅ **Performance** : Pas d'opérations I/O sur le stockage  
✅ **Conformité** : Respect des bonnes pratiques de sécurité  
✅ **Nettoyage automatique** : Données supprimées après utilisation

### Utilisation

```tsx
// Dans Register.tsx
const { setRegistrationData, setAvatarPreview } = useRegistration();

// Stocker les données
setRegistrationData(formData);
setAvatarPreview(avatarPreview);

// Dans Login.tsx
const { registrationData, avatarPreview, clearRegistrationData } = useRegistration();

// Utiliser les données
if (!registrationData) {
  // Rediriger vers l'inscription
}

// Nettoyer après utilisation
clearRegistrationData();
```

---

## Restriction CORS

### Problème Identifié

La configuration CORS utilisait `Access-Control-Allow-Origin: '*'`, permettant à **n'importe quel domaine** de faire des requêtes vers les Edge Functions :

- **Risque de CSRF** : Attaques Cross-Site Request Forgery
- **Vol de données** : Sites malveillants peuvent accéder aux APIs
- **Non-conformité** : Violation des bonnes pratiques de sécurité

### Solution Implémentée

Mise en place d'une **whitelist de domaines** avec configuration par environnement :

#### Fichiers Modifiés

- **`supabase/functions/_shared/cors.ts`** (Refactorisé)
  - Fonction `getCorsHeaders(origin)` qui vérifie l'origine
  - Support des variables d'environnement
  - Configuration différente pour dev/prod
  - Support des wildcards pour sous-domaines

- **`supabase/functions/create-admin/index.ts`**
  - Utilisation de `getCorsHeaders()` au lieu de `corsHeaders` statique

- **`supabase/functions/analyze-id-card/index.ts`**
  - Utilisation de `getCorsHeaders()` au lieu de `corsHeaders` statique

### Configuration

#### Variables d'Environnement (Supabase Dashboard)

1. **`ENVIRONMENT`** : `production` ou `development`
2. **`ALLOWED_ORIGINS`** : Liste de domaines séparés par des virgules

**Exemple pour Production** :
```
ENVIRONMENT=production
ALLOWED_ORIGINS=https://aurora-society.com,https://www.aurora-society.com,https://app.aurora-society.com
```

**Exemple pour Développement** :
```
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000,http://localhost:5173
```

#### Domaines par Défaut

Si les variables d'environnement ne sont pas définies :

**Production** :
- `https://aurora-society.com`
- `https://www.aurora-society.com`
- `https://app.aurora-society.com`

**Développement** :
- `http://localhost:8080`
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:8080`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

#### Support des Wildcards

Les sous-domaines peuvent être autorisés avec un wildcard :
```
ALLOWED_ORIGINS=*.aurora-society.com
```

Cela autorisera :
- `https://app.aurora-society.com`
- `https://admin.aurora-society.com`
- etc.

### Fonctionnement

```typescript
// Dans une Edge Function
const origin = req.headers.get('origin');
const corsHeaders = getCorsHeaders(origin);

// Si l'origine est dans la whitelist, elle est autorisée
// Sinon, le premier domaine de la whitelist est utilisé (ou '*' en dernier recours)
```

### Avantages

✅ **Sécurité renforcée** : Seuls les domaines autorisés peuvent accéder aux APIs  
✅ **Flexibilité** : Configuration par environnement  
✅ **Maintenabilité** : Centralisé dans un seul fichier  
✅ **Rétrocompatibilité** : Export `corsHeaders` conservé pour compatibilité

---

## Validation Serveur

### Problème Identifié

La validation était uniquement effectuée côté client, ce qui permettait :

- **Contournement** : Les attaquants peuvent bypasser la validation client
- **Injection** : Risque d'injection SQL, XSS, etc.
- **Données corrompues** : Données invalides peuvent être stockées en base

### Solution Implémentée

Création d'un **système de validation et sanitization serveur** :

#### Fichiers Créés

- **`supabase/functions/_shared/validation.ts`** (Nouveau)
  - Fonctions de validation pour email, mot de passe, username, téléphone
  - Fonctions de sanitization pour prévenir XSS et injection
  - Validation complète des données d'inscription

#### Fonctions de Validation

##### `sanitizeString(input, maxLength)`
- Supprime les caractères dangereux (`<`, `>`, `\0`)
- Limite la longueur
- Trim les espaces

##### `validateEmail(email)`
- Vérifie le format email
- Limite à 255 caractères

##### `validatePasswordStrength(password)`
- Minimum 6 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Au moins un caractère spécial
- Maximum 128 caractères

##### `validateUsername(username)`
- Minimum 3 caractères
- Maximum 50 caractères
- Uniquement alphanumérique, underscore, et tiret

##### `validatePhone(phone)`
- Format international
- Maximum 20 caractères

##### `validateRegistrationData(data)`
- Valide toutes les données d'inscription
- Sanitize tous les champs
- Retourne les erreurs et les données sanitizées

#### Fichiers Modifiés

- **`supabase/functions/create-admin/index.ts`**
  - Vérification de l'authentification (header Authorization requis)
  - Vérification du rôle admin
  - Validation et sanitization des données d'entrée
  - Gestion d'erreurs améliorée

- **`supabase/functions/analyze-id-card/index.ts`**
  - Vérification de l'authentification
  - Validation du format base64
  - Limitation de la taille de l'image (10MB max)
  - Validation du type MIME

### Exemple d'Utilisation

```typescript
// Dans une Edge Function
import { validateRegistrationData } from '../_shared/validation.ts';

// Valider les données
const validation = validateRegistrationData(requestData);

if (!validation.valid) {
  return new Response(
    JSON.stringify({ error: 'Validation failed', errors: validation.errors }),
    { status: 400, headers: corsHeaders }
  );
}

// Utiliser les données sanitizées
const { email, password, first_name } = validation.sanitized!;
```

### Vérification des Permissions

Toutes les Edge Functions sensibles vérifient maintenant :

1. **Authentification** : Présence du header `Authorization`
2. **Token valide** : Vérification du token JWT
3. **Rôle requis** : Vérification du rôle utilisateur (ex: admin)

```typescript
// Vérifier l'authentification
const authHeader = req.headers.get('authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: corsHeaders }
  );
}

// Vérifier le token
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Invalid token' }),
    { status: 401, headers: corsHeaders }
  );
}

// Vérifier le rôle
const { data: roleData } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .single();

if (!roleData) {
  return new Response(
    JSON.stringify({ error: 'Forbidden: Admin role required' }),
    { status: 403, headers: corsHeaders }
  );
}
```

### Avantages

✅ **Sécurité renforcée** : Validation côté serveur impossible à contourner  
✅ **Protection contre injection** : Sanitization de tous les inputs  
✅ **Contrôle d'accès** : Vérification des permissions serveur  
✅ **Données propres** : Seules les données valides sont stockées  
✅ **Messages d'erreur clairs** : Retourne les erreurs de validation détaillées

---

## Configuration

### Variables d'Environnement

#### Client (`.env`)

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre-anon-key-ici
```

#### Edge Functions (Supabase Dashboard)

1. Aller dans **Supabase Dashboard** > **Edge Functions** > **Settings**
2. Ajouter les variables suivantes :

```env
# Environnement
ENVIRONMENT=production

# Domaines autorisés (séparés par des virgules)
ALLOWED_ORIGINS=https://aurora-society.com,https://www.aurora-society.com
```

### Déploiement

Après modification des Edge Functions, **redéployer** :

```bash
# Via Supabase CLI
npx supabase functions deploy create-admin
npx supabase functions deploy analyze-id-card

# Ou via Supabase Dashboard
# Edge Functions > [Function Name] > Deploy
```

---

## Tests

### Tests de Sécurité

#### 1. Test sessionStorage

1. Ouvrir la console du navigateur
2. Aller sur `/register` et remplir le formulaire
3. Vérifier que `sessionStorage` est vide :
   ```javascript
   console.log(sessionStorage.getItem('registrationData')); // null
   ```

#### 2. Test CORS

1. Ouvrir la console du navigateur sur un domaine non autorisé
2. Essayer de faire une requête vers une Edge Function :
   ```javascript
   fetch('https://votre-projet.supabase.co/functions/v1/create-admin', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'test@test.com', password: 'Test123!' })
   });
   ```
3. Vérifier que la requête est bloquée par CORS

#### 3. Test Validation Serveur

1. Essayer de créer un admin avec des données invalides :
   ```javascript
   fetch('https://votre-projet.supabase.co/functions/v1/create-admin', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + token,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       email: 'invalid-email',
       password: 'weak'
     })
   });
   ```
2. Vérifier que la réponse contient des erreurs de validation

#### 4. Test Permissions

1. Essayer de créer un admin sans token :
   ```javascript
   fetch('https://votre-projet.supabase.co/functions/v1/create-admin', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'test@test.com', password: 'Test123!' })
   });
   ```
2. Vérifier que la réponse est `401 Unauthorized`

3. Essayer avec un token utilisateur non-admin :
   - Vérifier que la réponse est `403 Forbidden`

---

## Résumé des Améliorations

| Amélioration | Statut | Impact Sécurité |
|-------------|--------|-----------------|
| Suppression sessionStorage | ✅ Complété | 🔴 Critique |
| Restriction CORS | ✅ Complété | 🔴 Critique |
| Validation Serveur | ✅ Complété | 🔴 Critique |
| Sanitization Inputs | ✅ Complété | 🔴 Critique |
| Vérification Permissions | ✅ Complété | 🔴 Critique |

---

## Prochaines Étapes Recommandées

1. **Rate Limiting** : Implémenter un système de limitation de requêtes
2. **Logging Sécurisé** : Ne jamais logger les mots de passe ou données sensibles
3. **Timeout de Session** : Déconnexion automatique après inactivité
4. **2FA** : Authentification à deux facteurs
5. **Audit Logs** : Logger toutes les actions sensibles

---

**Auteur** : Équipe de développement  
**Dernière révision** : 2024

