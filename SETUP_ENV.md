# 🚀 Configuration du fichier .env

## Étapes rapides

1. **Créez le fichier `.env`** à la racine du projet
2. **Copiez le contenu** ci-dessous dans votre fichier `.env`
3. **Remplissez** les valeurs avec vos informations réelles

## 📝 Contenu du fichier .env

```env
# ============================================
# Configuration SMTP pour l'envoi d'emails
# ============================================

# Serveur SMTP
# Pour Infomaniak: mail.infomaniak.com
# Pour Gmail: smtp.gmail.com
SMTP_HOST=mail.infomaniak.com

# Port SMTP
# 587 = STARTTLS (recommandé)
# 465 = SSL/TLS (alternative)
SMTP_PORT=587

# Utilisateur SMTP (votre adresse email complète)
SMTP_USER=contact@aurorasociety.ch

# Mot de passe SMTP
# Pour Gmail: utilisez un mot de passe d'application (16 caractères)
SMTP_PASS=votre_mot_de_passe_ici

# Email expéditeur (optionnel, défaut: SMTP_USER)
SMTP_FROM_EMAIL=contact@aurorasociety.ch

# Nom expéditeur (optionnel, défaut: Aurora Society)
SMTP_FROM_NAME=Aurora Society
```

## ⚙️ Configuration pour Infomaniak

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@aurorasociety.ch
SMTP_PASS=votre_mot_de_passe_infomaniak
SMTP_FROM_EMAIL=contact@aurorasociety.ch
SMTP_FROM_NAME=Aurora Society
```

## ⚙️ Configuration pour Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application_16_caracteres
SMTP_FROM_EMAIL=votre.email@gmail.com
SMTP_FROM_NAME=Aurora Society
```

**⚠️ Important pour Gmail** : Vous devez utiliser un **mot de passe d'application**, pas votre mot de passe Gmail normal.

### Comment créer un mot de passe d'application Gmail :

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. **Sécurité** → **Validation en deux étapes** (doit être activée)
3. En bas de la page, cliquez sur **"Mots de passe des applications"**
4. Sélectionnez **"Autre (nom personnalisé)"**
5. Entrez un nom (ex: "Aurora Society SMTP")
6. Cliquez sur **"Générer"**
7. Copiez le mot de passe à 16 caractères (ex: `zrldcucywrggpwtl`)
8. Utilisez ce mot de passe dans `SMTP_PASS` (sans espaces)

## 🔧 Configuration pour Supabase (Production)

Pour la production sur Supabase, configurez les variables dans le Dashboard :

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

## ✅ Vérification

Après avoir configuré le fichier `.env`, testez l'envoi d'email :

1. Redémarrez votre serveur de développement
2. Allez dans **Admin → Paramètres**
3. Section **"Configuration Serveur Email"**
4. Entrez une adresse email de test
5. Cliquez sur **"Envoyer un test"**

## 🔒 Sécurité

- ⚠️ **Ne commitez jamais** le fichier `.env` dans Git
- ✅ Le fichier `.env` est déjà dans `.gitignore`
- ✅ Utilisez les secrets Supabase pour la production
- ✅ Pour Gmail, utilisez toujours un mot de passe d'application

## 📝 Notes

- Les variables sont lues automatiquement par les Edge Functions
- Un cache de 1 minute est utilisé pour améliorer les performances
- Les valeurs par défaut sont utilisées si les variables optionnelles ne sont pas définies
