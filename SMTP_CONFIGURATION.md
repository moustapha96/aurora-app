# Configuration SMTP - Guide Complet

Ce document explique comment configurer l'envoi d'emails avec Infomaniak et Gmail.

## ✅ Améliorations Apportées

1. **Gestion automatique des ports** :
   - Port 587 : STARTTLS (connexion sécurisée après connexion)
   - Port 465 : SSL/TLS (connexion sécurisée dès le départ)

2. **Détection automatique du serveur** :
   - Infomaniak : `mail.infomaniak.com`
   - Gmail : `smtp.gmail.com`
   - Configuration optimale selon le serveur

3. **Mode Test et Production** :
   - Mode Test : utilise Infomaniak par défaut
   - Mode Production : utilise votre configuration personnalisée

4. **Messages d'erreur améliorés** :
   - Messages en français plus explicites
   - Détection des erreurs d'authentification, connexion, TLS/SSL

## 📧 Configuration Infomaniak

### Paramètres recommandés :

**Option 1 : Port 587 (STARTTLS) - Recommandé**
- **Serveur SMTP** : `mail.infomaniak.com`
- **Port** : `587`
- **Sécurité** : STARTTLS
- **Utilisateur** : Votre adresse email complète (ex: `contact@aurorasociety.ch`)
- **Mot de passe** : Votre mot de passe email

**Option 2 : Port 465 (SSL)**
- **Serveur SMTP** : `mail.infomaniak.com`
- **Port** : `465`
- **Sécurité** : SSL/TLS
- **Utilisateur** : Votre adresse email complète
- **Mot de passe** : Votre mot de passe email

### Configuration dans l'interface Admin :

1. Allez dans **Admin → Paramètres**
2. Section **"Configuration Serveur Email"**
3. Mode : **Test** (utilise Infomaniak par défaut)
   - Les variables d'environnement doivent être configurées :
     - `SMTP_HOST=mail.infomaniak.com`
     - `SMTP_PORT=587` (ou 465)
     - `SMTP_USER=contact@aurorasociety.ch`
     - `SMTP_PASS=votre_mot_de_passe`
     - `SMTP_FROM_EMAIL=contact@aurorasociety.ch`
     - `SMTP_FROM_NAME=Aurora Society`

## 📧 Configuration Gmail

### Paramètres recommandés :

**Option 1 : Port 587 (STARTTLS) - Recommandé**
- **Serveur SMTP** : `smtp.gmail.com`
- **Port** : `587`
- **Sécurité** : STARTTLS
- **Utilisateur** : Votre adresse Gmail complète (ex: `votre.email@gmail.com`)
- **Mot de passe** : **Mot de passe d'application** (voir ci-dessous)

**Option 2 : Port 465 (SSL)**
- **Serveur SMTP** : `smtp.gmail.com`
- **Port** : `465`
- **Sécurité** : SSL/TLS
- **Utilisateur** : Votre adresse Gmail complète
- **Mot de passe** : **Mot de passe d'application**

### ⚠️ Important pour Gmail :

Gmail nécessite un **mot de passe d'application** et non votre mot de passe Gmail normal.

#### Comment créer un mot de passe d'application Gmail :

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Sécurité → Validation en deux étapes (doit être activée)
3. En bas de la page, cliquez sur **"Mots de passe des applications"**
4. Sélectionnez **"Autre (nom personnalisé)"**
5. Entrez un nom (ex: "Aurora Society SMTP")
6. Cliquez sur **"Générer"**
7. Copiez le mot de passe à 16 caractères (ex: `zrld cucy wrgg pwtl`)
8. Utilisez ce mot de passe dans la configuration SMTP

### Configuration dans l'interface Admin :

1. Allez dans **Admin → Paramètres**
2. Section **"Configuration Serveur Email"**
3. Mode : **Production**
4. Remplissez les champs :
   - **Serveur SMTP** : `smtp.gmail.com`
   - **Port** : `587` (ou `465`)
   - **Utilisateur SMTP** : `votre.email@gmail.com`
   - **Mot de passe SMTP** : `votre_mot_de_passe_application` (16 caractères sans espaces)
   - **Email expéditeur** : `votre.email@gmail.com`
   - **Nom expéditeur** : `Aurora Society`
5. Cliquez sur **"Enregistrer la configuration email"**
6. Testez avec **"Envoyer un test"**

## 🔧 Variables d'Environnement

Pour le mode Test (Infomaniak), configurez ces variables dans Supabase :

```bash
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@aurorasociety.ch
SMTP_PASS=votre_mot_de_passe
SMTP_FROM_EMAIL=contact@aurorasociety.ch
SMTP_FROM_NAME=Aurora Society
```

Pour Gmail en mode Test, utilisez :

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
SMTP_FROM_EMAIL=votre.email@gmail.com
SMTP_FROM_NAME=Aurora Society
```

## 🧪 Test de Configuration

1. Allez dans **Admin → Paramètres**
2. Section **"Configuration Serveur Email"**
3. Entrez une adresse email de test
4. Cliquez sur **"Envoyer un test"**
5. Vérifiez votre boîte de réception (et les spams)

## ❌ Résolution des Problèmes

### Erreur d'authentification

**Symptôme** : "Erreur d'authentification SMTP"

**Solutions** :
- Vérifiez que le nom d'utilisateur est l'adresse email complète
- Pour Gmail, utilisez un mot de passe d'application, pas votre mot de passe normal
- Vérifiez que le mot de passe est correct (pas d'espaces en trop)
- Pour Gmail, assurez-vous que la validation en deux étapes est activée

### Erreur de connexion

**Symptôme** : "Erreur de connexion au serveur SMTP"

**Solutions** :
- Vérifiez que le serveur SMTP est correct :
  - Infomaniak : `mail.infomaniak.com`
  - Gmail : `smtp.gmail.com`
- Vérifiez que le port est correct :
  - Port 587 pour STARTTLS
  - Port 465 pour SSL
- Vérifiez votre connexion internet
- Vérifiez que le pare-feu n'bloque pas les connexions SMTP

### Erreur TLS/SSL

**Symptôme** : "Erreur TLS/SSL"

**Solutions** :
- Utilisez le port 587 avec STARTTLS (recommandé)
- Ou utilisez le port 465 avec SSL
- Ne mélangez pas les ports et les types de sécurité

### Connexion refusée

**Symptôme** : "Connexion refusée par le serveur SMTP"

**Solutions** :
- Vérifiez que le serveur et le port sont corrects
- Pour Gmail, vérifiez que l'accès aux applications moins sécurisées n'est pas requis (utilisez un mot de passe d'application)
- Vérifiez que votre IP n'est pas bloquée

## 📝 Notes Importantes

1. **Cache** : La configuration SMTP est mise en cache pendant 1 minute pour améliorer les performances
2. **Mode Test vs Production** :
   - Mode Test : utilise les variables d'environnement (Infomaniak par défaut)
   - Mode Production : utilise la configuration de la base de données
3. **Sécurité** : Les mots de passe sont stockés de manière sécurisée dans la base de données
4. **Gmail** : Nécessite toujours un mot de passe d'application, jamais votre mot de passe Gmail normal

## 🔄 Mise à Jour de la Configuration

Après avoir modifié la configuration SMTP dans l'interface Admin :
1. Le cache est automatiquement vidé
2. La nouvelle configuration est utilisée immédiatement
3. Testez avec "Envoyer un test" pour vérifier

## ✅ Checklist de Configuration

- [ ] Mode Test ou Production sélectionné
- [ ] Serveur SMTP correct (Infomaniak ou Gmail)
- [ ] Port correct (587 ou 465)
- [ ] Utilisateur = adresse email complète
- [ ] Mot de passe correct (mot de passe d'application pour Gmail)
- [ ] Email expéditeur configuré
- [ ] Nom expéditeur configuré
- [ ] Configuration sauvegardée
- [ ] Test d'envoi réussi
