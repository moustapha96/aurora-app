# 🚀 Guide de Configuration Nginx pour Aurora Society

Ce guide vous explique comment configurer Nginx pour héberger votre application Aurora Society.

## 📋 Prérequis

- Serveur Linux avec Nginx installé
- Accès root ou sudo
- Domaine configuré (app.aurorasociety.ch)
- Certificat SSL (recommandé - Let's Encrypt)

## 🔧 Installation de Nginx

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install nginx
```

### CentOS/RHEL
```bash
sudo yum install nginx
# ou pour les versions récentes
sudo dnf install nginx
```

## 📁 Structure des fichiers

1. **Copiez le fichier de configuration** :
```bash
sudo cp nginx.conf /etc/nginx/sites-available/app.aurorasociety.ch
```

2. **Créez un lien symbolique** :
```bash
sudo ln -s /etc/nginx/sites-available/app.aurorasociety.ch /etc/nginx/sites-enabled/
```

3. **Créez le répertoire pour les fichiers** :
```bash
sudo mkdir -p /var/www/app.aurorasociety.ch/dist
sudo chown -R www-data:www-data /var/www/app.aurorasociety.ch
```

## 🔐 Configuration SSL avec Let's Encrypt

### Installation de Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtenir un certificat SSL
```bash
sudo certbot --nginx -d app.aurorasociety.ch -d aurorasociety.ch
```

Certbot configurera automatiquement Nginx avec HTTPS.

### Renouvellement automatique
Le renouvellement est automatique avec un cron job. Vérifiez avec :
```bash
sudo certbot renew --dry-run
```

## 📤 Déploiement des fichiers

### Méthode 1 : SCP (depuis votre machine locale)
```bash
# Depuis le dossier du projet
npm run build
scp -r dist/* user@server:/var/www/app.aurorasociety.ch/dist/
```

### Méthode 2 : Git + Build sur le serveur
```bash
# Sur le serveur
cd /var/www/app.aurorasociety.ch
git clone https://github.com/votre-repo/aurora-app.git .
npm install
npm run build
```

### Méthode 3 : CI/CD (GitHub Actions, GitLab CI, etc.)
Configurez votre pipeline pour :
1. Build l'application
2. Copier les fichiers dans `/var/www/app.aurorasociety.ch/dist/`

## ✅ Vérification et Activation

1. **Testez la configuration Nginx** :
```bash
sudo nginx -t
```

2. **Rechargez Nginx** :
```bash
sudo systemctl reload nginx
# ou
sudo service nginx reload
```

3. **Vérifiez le statut** :
```bash
sudo systemctl status nginx
```

## 🔍 Vérification

### Tester l'application
```bash
curl -I http://app.aurorasociety.ch
```

### Vérifier les logs
```bash
# Logs d'accès
sudo tail -f /var/log/nginx/app.aurorasociety.ch.access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/app.aurorasociety.ch.error.log
```

## 🛠️ Configuration avancée

### Ajuster le chemin de build
Si votre build est dans un autre dossier, modifiez la ligne `root` dans `nginx.conf` :
```nginx
root /chemin/vers/votre/dossier/dist;
```

### Activer HTTPS
1. Décommentez les lignes SSL dans `nginx.conf`
2. Configurez les chemins vers vos certificats
3. Décommentez le bloc de redirection HTTP → HTTPS

### Proxy API
Si vous avez un backend API, décommentez et configurez la section `/api/` dans `nginx.conf`.

## 📊 Optimisations

La configuration inclut :
- ✅ Compression Gzip
- ✅ Cache optimisé pour les assets
- ✅ Headers de sécurité
- ✅ Support PWA (service worker, manifest)
- ✅ Routage SPA (React Router)
- ✅ Support HTTPS/HTTP2

## 🐛 Dépannage

### Erreur 502 Bad Gateway
- Vérifiez que Nginx est démarré : `sudo systemctl status nginx`
- Vérifiez les permissions : `sudo chown -R www-data:www-data /var/www/app.aurorasociety.ch`

### Erreur 404
- Vérifiez que les fichiers sont dans `/var/www/app.aurorasociety.ch/dist/`
- Vérifiez le chemin `root` dans la configuration

### Service Worker ne fonctionne pas
- Vérifiez que `/sw.js` est accessible
- Vérifiez les headers Cache-Control dans les logs

### Cache trop agressif
- Modifiez les valeurs `max-age` dans les headers `Cache-Control`
- Redémarrez Nginx après modification

## 🔄 Script de déploiement automatique

Créez un script `deploy.sh` :
```bash
#!/bin/bash
# Build l'application
npm run build

# Copie les fichiers
rsync -avz --delete dist/ user@server:/var/www/app.aurorasociety.ch/dist/

# Recharge Nginx sur le serveur
ssh user@server "sudo systemctl reload nginx"

echo "✅ Déploiement terminé !"
```

Rendez-le exécutable :
```bash
chmod +x deploy.sh
```

## 📝 Notes importantes

- **Sécurité** : Assurez-vous que les fichiers `.env` ne sont pas dans le dossier `dist/`
- **Performance** : La configuration est optimisée pour la production
- **PWA** : Le service worker et le manifest sont correctement configurés
- **Cache** : Les fichiers avec hash sont mis en cache longtemps, `index.html` ne l'est pas

## 🆘 Support

En cas de problème :
1. Vérifiez les logs Nginx
2. Testez la configuration : `sudo nginx -t`
3. Vérifiez les permissions des fichiers
4. Consultez la documentation Nginx : https://nginx.org/en/docs/
