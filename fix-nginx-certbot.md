# 🔧 Correction de la configuration Nginx pour Certbot

## Problème
La configuration actuelle a des conflits et des directives SSL sans certificats.

## Solution

### Étape 1 : Sauvegarder l'ancienne configuration
```bash
sudo cp /etc/nginx/sites-available/app.aurorasociety.ch /etc/nginx/sites-available/app.aurorasociety.ch.backup
```

### Étape 2 : Remplacer par la nouvelle configuration
```bash
# Copier le nouveau fichier nginx.conf
sudo cp nginx.conf /etc/nginx/sites-available/app.aurorasociety.ch
```

### Étape 3 : Tester la configuration
```bash
sudo nginx -t
```

Si tout est OK, vous devriez voir :
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Étape 4 : Recharger Nginx
```bash
sudo systemctl reload nginx
```

### Étape 5 : Lancer Certbot
```bash
sudo certbot --nginx -d app.aurorasociety.ch
```

Certbot va :
1. Obtenir le certificat SSL
2. Modifier automatiquement la configuration pour ajouter les chemins des certificats
3. Configurer la redirection HTTP → HTTPS

### Étape 6 : Vérifier que tout fonctionne
```bash
# Tester la configuration après Certbot
sudo nginx -t

# Vérifier le statut
sudo systemctl status nginx

# Tester HTTPS
curl -I https://app.aurorasociety.ch
```

## Structure finale attendue

Après Certbot, votre configuration devrait ressembler à :

```nginx
# Redirection HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name app.aurorasociety.ch;
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.aurorasociety.ch;
    
    # Ces lignes seront ajoutées par Certbot :
    ssl_certificate /etc/letsencrypt/live/app.aurorasociety.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.aurorasociety.ch/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # ... reste de la configuration
}
```

## Dépannage

### Si Certbot échoue encore
1. Vérifiez que le port 80 est ouvert :
```bash
sudo ufw allow 80
sudo ufw allow 443
```

2. Vérifiez que Nginx écoute sur le port 80 :
```bash
sudo netstat -tlnp | grep :80
```

3. Vérifiez les logs Certbot :
```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Si vous avez des erreurs de certificat
Certbot peut créer un certificat avec un nom différent. Vérifiez :
```bash
sudo ls -la /etc/letsencrypt/live/
```

Si le certificat s'appelle `app.aurorasociety.ch-0001`, modifiez les chemins dans la configuration.
