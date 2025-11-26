# Documentation - Rate Limiting

**Date de création** : Décembre 2024  
**Version** : 1.0.0  
**Statut** : ✅ Implémenté

---

## Vue d'ensemble

Le système de rate limiting protège l'application contre les attaques par force brute en limitant le nombre de tentatives d'authentification par identifiant (email, IP, etc.) sur une période donnée.

## Architecture

### 1. Base de données

**Table : `rate_limiting`**

Stocke les tentatives d'authentification avec :
- `identifier` : Email, adresse IP, ou identifiant utilisateur
- `endpoint` : Type d'endpoint ('login', 'register', 'reset-password', etc.)
- `attempt_count` : Nombre de tentatives dans la fenêtre actuelle
- `first_attempt_at` : Timestamp de la première tentative
- `last_attempt_at` : Timestamp de la dernière tentative
- `blocked_until` : Timestamp jusqu'auquel l'identifiant est bloqué (NULL si non bloqué)

**Migration :** `supabase/migrations/20241202000000_create_rate_limiting.sql`

**Fonctionnalités :**
- Index optimisés pour les recherches rapides
- Nettoyage automatique des enregistrements après 24 heures
- Row Level Security (RLS) activé
- Trigger pour mise à jour automatique de `updated_at`

### 2. Edge Functions

#### `check-rate-limit`

Vérifie si une tentative est autorisée selon les limites configurées.

**Endpoint :** `POST /functions/v1/check-rate-limit`

**Request Body :**
```json
{
  "identifier": "user@example.com",
  "endpoint": "login"
}
```

**Response (Autorisé) :**
```json
{
  "allowed": true,
  "remainingAttempts": 4
}
```

**Response (Bloqué) :**
```json
{
  "allowed": false,
  "blockedUntil": "2024-12-02T15:30:00Z",
  "retryAfter": 1800,
  "message": "Too many attempts. Please try again after 30 minutes."
}
```

**Fichier :** `supabase/functions/check-rate-limit/index.ts`

#### `reset-rate-limit`

Réinitialise le rate limit après une authentification réussie.

**Endpoint :** `POST /functions/v1/reset-rate-limit`

**Request Body :**
```json
{
  "identifier": "user@example.com",
  "endpoint": "login"
}
```

**Response :**
```json
{
  "success": true,
  "message": "Rate limit reset successfully"
}
```

**Fichier :** `supabase/functions/reset-rate-limit/index.ts`

### 3. Configuration

Les limites sont configurées dans `supabase/functions/check-rate-limit/index.ts` :

```typescript
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,        // Maximum 5 tentatives
    windowMinutes: 15,     // Dans une fenêtre de 15 minutes
    blockMinutes: 30,     // Bloqué pendant 30 minutes après dépassement
  },
  register: {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 60,
  },
  'reset-password': {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 60,
  },
  'forgot-password': {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 60,
  },
  default: {
    maxAttempts: 5,
    windowMinutes: 15,
    blockMinutes: 30,
  },
};
```

### 4. Helper Frontend

**Fichier :** `src/lib/rateLimiting.ts`

Fonctions disponibles :
- `checkRateLimit(identifier, endpoint)` : Vérifie si une tentative est autorisée
- `resetRateLimit(identifier, endpoint)` : Réinitialise le rate limit
- `formatRetryMessage(retryAfter)` : Formate le message de retry

## Utilisation

### Dans le code frontend

```typescript
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimiting";

// Avant une tentative d'authentification
const rateLimitCheck = await checkRateLimit(email, 'login');

if (!rateLimitCheck.allowed) {
  // Afficher un message d'erreur
  toast.error(rateLimitCheck.message);
  return;
}

// Afficher un avertissement si proche de la limite
if (rateLimitCheck.remainingAttempts !== undefined && 
    rateLimitCheck.remainingAttempts <= 2) {
  toast.warning(`${rateLimitCheck.remainingAttempts} attempts remaining`);
}

// Après une authentification réussie
await resetRateLimit(email, 'login');
```

### Intégration dans Login.tsx

Le rate limiting est intégré dans `handleLogin` :
1. ✅ Vérification du rate limit avant la tentative de connexion
2. ✅ Affichage d'un avertissement si proche de la limite (≤ 2 tentatives restantes)
3. ✅ Réinitialisation du rate limit après succès
4. ✅ Messages d'erreur traduits

**Fichier :** `src/pages/Login.tsx`

## Sécurité

### Fail Open Strategy

Le système utilise une stratégie "fail open" : si le service de rate limiting est indisponible, les requêtes sont autorisées. Cela garantit la disponibilité de l'application même en cas de problème avec le rate limiting.

**Avantages :**
- Disponibilité maximale de l'application
- Pas de blocage en cas de panne du service

**Inconvénients :**
- Protection réduite si le service est down
- Nécessite un monitoring pour détecter les pannes

### Protection par identifiant

- **Email** : Pour les tentatives de connexion, l'email est utilisé comme identifiant
- **IP** : Pour une protection supplémentaire, l'IP pourrait être utilisée (à implémenter côté serveur)

### Nettoyage automatique

Les enregistrements de rate limiting sont automatiquement nettoyés après 24 heures via la fonction `cleanup_old_rate_limiting()`.

**Fonction SQL :**
```sql
CREATE OR REPLACE FUNCTION cleanup_old_rate_limiting()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limiting
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$ LANGUAGE plpgsql;
```

## Endpoints protégés

### Actuellement protégés

- ✅ **`login`** - 5 tentatives / 15 minutes, blocage 30 minutes
  - Intégré dans `src/pages/Login.tsx`
  - Vérification avant chaque tentative
  - Réinitialisation après succès

### À intégrer

- ⏳ **`register`** - 3 tentatives / 60 minutes, blocage 60 minutes
- ⏳ **`reset-password`** - 3 tentatives / 60 minutes, blocage 60 minutes
- ⏳ **`forgot-password`** - 3 tentatives / 60 minutes, blocage 60 minutes

## Améliorations futures

### Priorité HAUTE

1. **Protection des autres endpoints**
   - Intégrer dans `Register.tsx`
   - Intégrer dans `ResetPassword.tsx`
   - Intégrer dans `ForgotPassword.tsx`

2. **CAPTCHA après plusieurs échecs**
   - Ajouter un CAPTCHA après 3 tentatives échouées
   - Utiliser un service comme reCAPTCHA ou hCaptcha

### Priorité MOYENNE

3. **Protection par IP**
   - Utiliser l'adresse IP comme identifiant supplémentaire
   - Nécessite l'extraction de l'IP côté serveur

4. **Notifications**
   - Envoyer un email après blocage
   - Informer l'utilisateur des tentatives suspectes

5. **Whitelist**
   - Permettre de whitelister certains identifiants (admins, etc.)
   - Table `rate_limiting_whitelist`

### Priorité BASSE

6. **Monitoring**
   - Dashboard pour surveiller les tentatives de force brute
   - Graphiques et statistiques
   - Alertes automatiques

7. **Rate limiting adaptatif**
   - Ajuster les limites selon le comportement
   - Détection d'anomalies

## Déploiement

### 1. Appliquer la migration

```bash
npx supabase migration up
```

### 2. Déployer les Edge Functions

```bash
npx supabase functions deploy check-rate-limit
npx supabase functions deploy reset-rate-limit
```

### 3. Vérifier les variables d'environnement

**Edge Functions nécessitent :**
- `SUPABASE_URL` - URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé de service (accès complet)
- `ALLOWED_ORIGINS` - Origines autorisées pour CORS (optionnel)

**Frontend nécessite :**
- `VITE_SUPABASE_URL` - URL de votre projet Supabase

### 4. Tester le déploiement

```bash
# Tester l'Edge Function check-rate-limit
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"identifier": "test@example.com", "endpoint": "login"}'
```

## Tests

### Test manuel

1. **Test de base :**
   - Tenter 5 connexions avec un mauvais mot de passe
   - Vérifier que la 6ème tentative est bloquée
   - Vérifier le message d'erreur affiché

2. **Test de réinitialisation :**
   - Tenter 4 connexions échouées
   - Effectuer une connexion réussie
   - Vérifier que le compteur est réinitialisé

3. **Test de fenêtre temporelle :**
   - Tenter 3 connexions échouées
   - Attendre 15 minutes
   - Vérifier que le compteur est réinitialisé

4. **Test de blocage :**
   - Dépasser la limite (5 tentatives)
   - Vérifier que le blocage dure 30 minutes
   - Vérifier le message avec le temps restant

### Test automatisé (à implémenter)

```typescript
// Exemple de test unitaire
describe('Rate Limiting', () => {
  it('should block after max attempts', async () => {
    const identifier = 'test@example.com';
    
    // Tenter maxAttempts + 1 fois
    for (let i = 0; i < 6; i++) {
      const result = await checkRateLimit(identifier, 'login');
      if (i < 5) {
        expect(result.allowed).toBe(true);
      } else {
        expect(result.allowed).toBe(false);
      }
    }
  });
});
```

## Traductions

Les messages d'erreur sont traduits dans `LanguageContext.tsx` pour toutes les 10 langues :

**Clés de traduction :**
- `tooManyAttempts` - "Trop de tentatives de connexion"
- `remainingAttempts` - "{count} tentatives restantes"
- `tryAgainLater` - "Veuillez réessayer plus tard"
- `tryAgainInMinutes` - "Veuillez réessayer dans {minutes} minutes"
- `invalidCredentials` - "Email ou mot de passe invalide"
- `emailNotConfirmed` - "Veuillez vérifier votre adresse email"
- `loginError` - "Erreur de connexion"
- `loginSuccess` - "Connexion réussie"

**Fichier :** `src/contexts/LanguageContext.tsx`

## Fichiers modifiés/créés

### Nouveaux fichiers

1. `supabase/migrations/20241202000000_create_rate_limiting.sql`
   - Table `rate_limiting`
   - Index et triggers
   - Fonction de nettoyage

2. `supabase/functions/check-rate-limit/index.ts`
   - Edge Function pour vérifier les limites

3. `supabase/functions/reset-rate-limit/index.ts`
   - Edge Function pour réinitialiser les limites

4. `src/lib/rateLimiting.ts`
   - Helper functions pour le frontend

5. `documentations/RATE_LIMITING.md`
   - Cette documentation

### Fichiers modifiés

1. `src/pages/Login.tsx`
   - Intégration du rate limiting dans `handleLogin`

2. `src/contexts/LanguageContext.tsx`
   - Ajout des clés de traduction pour le rate limiting

## Dépannage

### Problème : Rate limiting ne fonctionne pas

**Vérifications :**
1. La migration a-t-elle été appliquée ?
   ```bash
   npx supabase migration list
   ```

2. Les Edge Functions sont-elles déployées ?
   ```bash
   npx supabase functions list
   ```

3. Les variables d'environnement sont-elles correctes ?
   - Vérifier dans le dashboard Supabase

4. Y a-t-il des erreurs dans les logs ?
   ```bash
   npx supabase functions logs check-rate-limit
   ```

### Problème : Tous les utilisateurs sont bloqués

**Solution :**
- Vérifier la configuration dans `check-rate-limit/index.ts`
- Vérifier que les limites ne sont pas trop restrictives
- Nettoyer manuellement la table si nécessaire :
  ```sql
  DELETE FROM rate_limiting WHERE endpoint = 'login';
  ```

### Problème : Rate limiting trop permissif

**Solution :**
- Réduire `maxAttempts` dans la configuration
- Réduire `windowMinutes` pour une fenêtre plus courte
- Augmenter `blockMinutes` pour un blocage plus long

## Références

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [OWASP - Brute Force Attack](https://owasp.org/www-community/attacks/Brute_force_attack)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Dernière mise à jour** : Décembre 2024  
**Auteur** : Équipe de développement Aurora Society

