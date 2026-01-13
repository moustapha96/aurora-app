# Configuration des Variables d'Environnement SMTP

Ce fichier documente les variables d'environnement nécessaires pour la configuration SMTP.

## 📋 Variables Obligatoires

Créez un fichier `.env` à la racine du projet ou configurez ces variables dans Supabase Dashboard → Settings → Edge Functions → Secrets.

```env
# Serveur SMTP
SMTP_HOST=mail.infomaniak.com

# Port SMTP (587 pour STARTTLS, 465 pour SSL)
SMTP_PORT=587

# Utilisateur SMTP (votre adresse email complète)
SMTP_USER=contact@aurorasociety.ch

# Mot de passe SMTP
SMTP_PASS=votre_mot_de_passe
```

## 📋 Variables Optionnelles

```env
# Email expéditeur (par défaut: SMTP_USER)
SMTP_FROM_EMAIL=contact@aurorasociety.ch

# Nom expéditeur (par défaut: "Aurora Society")
SMTP_FROM_NAME=Aurora Society

# Forcer la connexion sécurisée (true/false)
# Par défaut: auto-détecté selon le port
SMTP_SECURE=false
```

## 🔧 Configuration pour Supabase Edge Functions

Pour Supabase, configurez les variables d'environnement dans le Dashboard :

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Edge Functions** → **Secrets**
4. Ajoutez chaque variable :
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM_EMAIL` (optionnel)
   - `SMTP_FROM_NAME` (optionnel)

## 📧 Exemples de Configuration

### Infomaniak avec STARTTLS (port 587) - Recommandé

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@aurorasociety.ch
SMTP_PASS=votre_mot_de_passe
SMTP_FROM_EMAIL=contact@aurorasociety.ch
SMTP_FROM_NAME=Aurora Society
```

### Infomaniak avec SSL (port 465)

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=465
SMTP_USER=contact@aurorasociety.ch
SMTP_PASS=votre_mot_de_passe
SMTP_SECURE=true
```

### Gmail avec STARTTLS (port 587)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application_16_caracteres
SMTP_FROM_EMAIL=votre.email@gmail.com
SMTP_FROM_NAME=Aurora Society
```

**⚠️ Important pour Gmail** : Utilisez un **mot de passe d'application**, pas votre mot de passe Gmail normal.

#### Comment créer un mot de passe d'application Gmail :

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. **Sécurité** → **Validation en deux étapes** (doit être activée)
3. En bas de la page, cliquez sur **"Mots de passe des applications"**
4. Sélectionnez **"Autre (nom personnalisé)"**
5. Entrez un nom (ex: "Aurora Society SMTP")
6. Cliquez sur **"Générer"**
7. Copiez le mot de passe à 16 caractères (ex: `zrld cucy wrgg pwtl`)
8. Utilisez ce mot de passe dans `SMTP_PASS` (sans espaces)

### Gmail avec SSL (port 465)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application_16_caracteres
SMTP_SECURE=true
```

## ✅ Vérification

Après avoir configuré les variables, testez l'envoi d'email :

1. Allez dans **Admin → Paramètres**
2. Section **"Configuration Serveur Email"**
3. Entrez une adresse email de test
4. Cliquez sur **"Envoyer un test"**

## 🔒 Sécurité

- ⚠️ **Ne commitez jamais** le fichier `.env` dans Git
- ✅ Ajoutez `.env` à votre `.gitignore`
- ✅ Utilisez les secrets Supabase pour la production
- ✅ Pour Gmail, utilisez toujours un mot de passe d'application

## 📝 Notes

- Les variables sont lues depuis `Deno.env.get()` dans les Edge Functions
- Un cache de 1 minute est utilisé pour améliorer les performances
- Les valeurs par défaut sont utilisées si les variables optionnelles ne sont pas définies
- Le port détermine automatiquement le type de sécurité (465 = SSL, 587 = STARTTLS)
