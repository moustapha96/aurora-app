# Configuration de l'Edge Function send-email

## Problème résolu

L'erreur `FunctionsFetchError: Failed to send a request to the Edge Function` était due à l'absence de l'Edge Function `send-email`. Cette fonction a été créée et est maintenant disponible.

## Déploiement

### Option 1 : Déploiement automatique (recommandé)

Si vous utilisez Supabase CLI :

```bash
supabase functions deploy send-email
```

### Option 2 : Déploiement manuel

1. Ouvrir le Supabase Dashboard
2. Aller dans **Edge Functions**
3. Cliquer sur **Create a new function**
4. Nommer la fonction : `send-email`
5. Copier le contenu de `supabase/functions/send-email/index.ts`
6. Déployer

## Configuration

### Option A : Utiliser Resend (Recommandé pour production)

1. Créer un compte sur [Resend](https://resend.com)
2. Obtenir votre API key
3. Dans Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
4. Ajouter la variable d'environnement :
   - Key: `RESEND_API_KEY`
   - Value: Votre clé API Resend

### Option B : Utiliser SendGrid

1. Créer un compte sur [SendGrid](https://sendgrid.com)
2. Obtenir votre API key
3. Dans Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
4. Ajouter la variable d'environnement :
   - Key: `SENDGRID_API_KEY`
   - Value: Votre clé API SendGrid

### Option C : Configuration SMTP via Admin Settings

1. Aller dans **Admin Settings** → **Email Settings**
2. Configurer :
   - SMTP Host
   - SMTP Port (généralement 587)
   - SMTP User
   - SMTP Password
   - From Email
   - From Name

**Note** : L'option C nécessite une implémentation SMTP directe supplémentaire. Pour la production, utilisez Resend ou SendGrid (Options A ou B).

## Variables d'environnement requises

Les variables suivantes sont automatiquement disponibles dans les Edge Functions Supabase :
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service (pour accéder à la base de données)

Variables optionnelles (pour l'envoi d'emails) :
- `RESEND_API_KEY` : Pour utiliser Resend
- `SENDGRID_API_KEY` : Pour utiliser SendGrid
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` : Pour SMTP direct
- `FROM_EMAIL`, `FROM_NAME` : Email et nom par défaut

## Comportement

### Si aucun service email n'est configuré

La fonction retourne un succès mais ne bloque **pas** l'opération principale (inscription, etc.). Un avertissement est loggé dans la console.

### Si un service email est configuré

L'email est envoyé via le service configuré (Resend ou SendGrid).

## Test

Pour tester la fonction :

```typescript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<h1>Test</h1><p>This is a test email.</p>',
  },
});
```

## Notes importantes

1. **Non-bloquant** : Les erreurs d'envoi d'email ne bloquent jamais les opérations principales (inscription, messages, etc.)
2. **Logging** : Toutes les erreurs sont loggées dans la console pour le débogage
3. **Production** : Pour la production, configurez Resend ou SendGrid pour un envoi d'emails fiable
4. **Sécurité** : Les clés API doivent être stockées dans les secrets Supabase, jamais dans le code

