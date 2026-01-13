# 🔐 Instructions pour Certbot - Configuration initiale HTTP

## Problème résolu
La configuration ne contient plus de bloc HTTPS avec SSL. Certbot va automatiquement :
1. Obtenir le certificat SSL
2. Créer un bloc HTTPS avec les certificats
3. Modifier le bloc HTTP pour rediriger vers HTTPS

## Étapes à suivre

### 1. Copier la nouvelle configuration
```bash
sudo cp nginx.conf /etc/nginx/sites-available/app.aurorasociety.ch
```

### 2. Tester la configuration (doit fonctionner maintenant)
```bash
sudo nginx -t
```

Vous devriez voir :
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3. Recharger Nginx
```bash
sudo systemctl reload nginx
```

### 4. Vérifier que le site fonctionne en HTTP
```bash
curl -I http://app.aurorasociety.ch
```

### 5. Lancer Certbot (maintenant ça devrait fonctionner !)
```bash
sudo certbot --nginx -d app.aurorasociety.ch
```

Certbot va :
- ✅ Obtenir le certificat SSL
- ✅ Créer automatiquement un bloc HTTPS
- ✅ Ajouter la redirection HTTP → HTTPS
- ✅ Configurer les certificats SSL

### 6. Vérifier après Certbot
```bash
# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Tester HTTPS
curl -I https://app.aurorasociety.ch
```

## Ce que Certbot va ajouter

Après l'exécution de Certbot, votre fichier `/etc/nginx/sites-available/app.aurorasociety.ch` contiendra :

```nginx
# Bloc HTTP (modifié par Certbot pour rediriger vers HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name app.aurorasociety.ch;
    return 301 https://$server_name$request_uri;  # ← Ajouté par Certbot
}

# Bloc HTTPS (créé par Certbot)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.aurorasociety.ch;
    
    # Certificats SSL (ajoutés par Certbot)
    ssl_certificate /etc/letsencrypt/live/app.aurorasociety.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.aurorasociety.ch/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # ... reste de votre configuration ...
}
```

## Dépannage

### Si Certbot demande de choisir entre redirection ou pas
Choisissez **l'option 2** (Redirect) pour rediriger automatiquement HTTP → HTTPS.

### Si vous avez des erreurs de port
Vérifiez que les ports 80 et 443 sont ouverts :
```bash
sudo ufw allow 80
sudo ufw allow 443
```

### Si Certbot ne peut pas valider le domaine
Assurez-vous que :
- Le domaine `app.aurorasociety.ch` pointe vers votre serveur
- Le port 80 est accessible depuis Internet
- Nginx fonctionne correctement

Vérifiez avec :
```bash
# Vérifier que Nginx écoute sur le port 80
sudo netstat -tlnp | grep :80

# Vérifier les logs
sudo tail -f /var/log/nginx/error.log
```
