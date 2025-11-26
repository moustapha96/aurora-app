# Guide d'Exécution et de Test - Aurora Society

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Exécution de l'Application](#exécution-de-lapplication)
5. [Tests](#tests)
6. [Dépannage](#dépannage)
7. [Scénarios de Test](#scénarios-de-test)

---

## Prérequis

### Logiciels Requis

- **Node.js** : Version 18 ou supérieure
  - Télécharger : [nodejs.org](https://nodejs.org/)
  - Vérifier l'installation : `node --version`
  
- **npm** ou **bun** : Gestionnaire de paquets
  - Vérifier : `npm --version` ou `bun --version`

- **Git** : Pour cloner le projet (si nécessaire)
  - Télécharger : [git-scm.com](https://git-scm.com/)

### Compte Supabase

- Un compte sur [supabase.com](https://supabase.com)
- Un projet Supabase créé

---

## Installation

### Étape 1 : Cloner le Projet (si nécessaire)

```bash
git clone <votre-url-de-repo>
cd aurora-react-superbase
```

### Étape 2 : Installer les Dépendances

**Avec npm :**
```bash
npm install
```

**Avec bun (plus rapide) :**
```bash
bun install
```

**Durée estimée** : 2-5 minutes selon votre connexion

### Étape 3 : Vérifier l'Installation

```bash
npm list --depth=0
```

Vous devriez voir toutes les dépendances listées.

---

## Configuration

### Étape 1 : Créer le Fichier d'Environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Windows CMD
type nul > .env

# Linux/Mac
touch .env
```

### Étape 2 : Configurer les Variables d'Environnement

Ouvrez le fichier `.env` et ajoutez :

```env
# URL de votre projet Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co

# Clé publique (anon key) de Supabase
VITE_SUPABASE_PUBLISHABLE_KEY=votre-anon-key-ici
```

**Où trouver ces valeurs :**

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

### Étape 3 : Configurer Supabase (Base de Données)

#### Option A : Avec Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet local au projet Supabase
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

#### Option B : Via l'Interface Web Supabase

1. Allez sur votre projet Supabase
2. **SQL Editor** → **New Query**
3. Ouvrez chaque fichier dans `supabase/migrations/` dans l'ordre chronologique
4. Exécutez-les un par un

**⚠️ Important** : Exécutez les migrations dans l'ordre chronologique (par date).

---

## Exécution de l'Application

### Mode Développement

```bash
npm run dev
```

**Ou avec bun :**
```bash
bun dev
```

L'application sera accessible sur :
- **URL locale** : `http://localhost:8080`
- **URL réseau** : `http://[votre-ip]:8080` (accessible depuis d'autres appareils sur le même réseau)

### Vérifier que l'Application Fonctionne

1. Ouvrez votre navigateur
2. Allez sur `http://localhost:8080`
3. Vous devriez voir la page d'accueil Aurora Society

### Arrêter l'Application

Dans le terminal, appuyez sur `Ctrl + C`

---

## Tests

### Tests Manuels

#### 1. Test de la Page d'Accueil

- [ ] La page se charge correctement
- [ ] Le logo Aurora s'affiche
- [ ] Les boutons "S'inscrire" et "Se connecter" fonctionnent
- [ ] Le sélecteur de langue fonctionne

#### 2. Test d'Inscription

1. Cliquez sur "S'inscrire"
2. Remplissez le formulaire :
   - Code de parrainage (optionnel)
   - Photo de profil (optionnel)
   - Prénom et Nom
   - Email valide
   - Téléphone
   - Autres informations
3. Cliquez sur "Continuer"
4. Complétez l'inscription avec :
   - Identifiant
   - Mot de passe (minimum 6 caractères)
   - Confirmation du mot de passe

**Résultat attendu** : Redirection vers la carte de membre

#### 3. Test de Connexion

1. Cliquez sur "Se connecter"
2. Entrez :
   - Email : `alexandre.duroche@aurora.com`
   - Mot de passe : `Test1234!`
3. Cliquez sur "Se connecter"

**Résultat attendu** : Connexion réussie et redirection

#### 4. Test de Création de Membres de Test

1. Connectez-vous en tant qu'admin
2. Allez sur `/create-test-members`
3. Cliquez sur "Créer les membres de test"

**Résultat attendu** : 9 membres de test créés avec succès

**Comptes de test créés :**
- `alexandre.duroche@aurora.com` / `Test1234!`
- `abigail.sinclair@aurora.com` / `Test1234!`
- `johnathan.shaw@aurora.com` / `Test1234!`
- Et 6 autres...

#### 5. Test des Pages Principales

- [ ] `/profile` - Profil utilisateur
- [ ] `/edit-profile` - Édition du profil
- [ ] `/business` - Profil professionnel
- [ ] `/personal` - Profil personnel
- [ ] `/family` - Profil familial
- [ ] `/members` - Liste des membres
- [ ] `/network` - Réseau
- [ ] `/messages` - Messagerie
- [ ] `/concierge` - Conciergerie
- [ ] `/marketplace` - Marketplace
- [ ] `/metaverse` - Metaverse

### Tests Automatisés (À Implémenter)

Actuellement, il n'y a pas de tests automatisés. Pour les ajouter :

#### Installation des Outils de Test

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### Créer un Fichier de Test

```typescript
// src/components/__tests__/AuroraLogo.test.tsx
import { render, screen } from '@testing-library/react';
import { AuroraLogo } from '../AuroraLogo';

describe('AuroraLogo', () => {
  it('renders the logo', () => {
    render(<AuroraLogo />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
```

#### Exécuter les Tests

```bash
npm run test
```

---

## Scénarios de Test Complets

### Scénario 1 : Parcours Utilisateur Complet

1. **Inscription**
   - Créer un nouveau compte
   - Vérifier l'email (si configuré)
   - Compléter le profil

2. **Connexion**
   - Se connecter avec le nouveau compte
   - Vérifier la persistance de session

3. **Édition du Profil**
   - Modifier les informations personnelles
   - Ajouter une photo de profil
   - Sauvegarder les modifications

4. **Navigation**
   - Parcourir toutes les pages
   - Vérifier que les liens fonctionnent
   - Tester le retour en arrière

5. **Déconnexion**
   - Se déconnecter
   - Vérifier la redirection vers la page d'accueil

### Scénario 2 : Fonctionnalités Sociales

1. **Liste des Membres**
   - Voir tous les membres
   - Filtrer par secteur/industrie
   - Rechercher un membre

2. **Demande de Connexion**
   - Envoyer une demande de connexion
   - Vérifier la notification
   - Accepter/Refuser une demande

3. **Messagerie**
   - Créer une conversation
   - Envoyer un message
   - Recevoir un message

### Scénario 3 : Gestion du Contenu

1. **Profil Professionnel**
   - Ajouter des informations business
   - Uploader un logo d'entreprise
   - Ajouter des photos

2. **Collection d'Art**
   - Ajouter une œuvre d'art
   - Modifier une œuvre
   - Supprimer une œuvre

3. **Sports et Loisirs**
   - Ajouter un sport/hobby
   - Modifier les statistiques
   - Réorganiser l'ordre

---

## Dépannage

### Problème 1 : Erreur "Cannot find module"

**Solution :**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

**Windows :**
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Problème 2 : Port 8080 déjà utilisé

**Solution A :** Tuer le processus utilisant le port
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill
```

**Solution B :** Changer le port dans `vite.config.ts`
```typescript
server: {
  port: 3000, // Changer le port
}
```

### Problème 3 : Erreur de connexion à Supabase

**Vérifications :**
1. Les variables d'environnement sont correctes dans `.env`
2. Le fichier `.env` est à la racine du projet
3. Redémarrer le serveur de développement après modification de `.env`
4. Vérifier que l'URL Supabase est correcte (sans slash final)

### Problème 4 : Erreurs TypeScript

**Solution :**
```bash
# Vérifier les erreurs
npm run build

# Si erreurs de types, vérifier tsconfig.json
```

### Problème 5 : Styles non appliqués

**Solution :**
```bash
# Vérifier que Tailwind est bien configuré
npm run dev

# Vérifier tailwind.config.ts
# Vérifier que les classes sont dans le contenu
```

### Problème 6 : Erreur "Module not found" pour les imports `@/`

**Solution :**
Vérifier que `vite.config.ts` contient :
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### Problème 7 : Base de données non configurée

**Symptômes :**
- Erreurs 404 sur les requêtes
- Tables non trouvées

**Solution :**
1. Vérifier que les migrations ont été exécutées
2. Vérifier les politiques RLS dans Supabase
3. Vérifier que l'utilisateur a les bonnes permissions

---

## Commandes Utiles

### Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter le code
npm run lint
```

### Supabase

```bash
# Démarrer Supabase localement (si installé)
supabase start

# Arrêter Supabase local
supabase stop

# Voir les logs
supabase logs

# Appliquer les migrations
supabase db push

# Créer une nouvelle migration
supabase migration new nom_de_la_migration
```

### Debugging

```bash
# Voir les variables d'environnement
# Windows PowerShell
Get-Content .env

# Linux/Mac
cat .env

# Vérifier la version de Node
node --version

# Vérifier les dépendances
npm list --depth=0
```

---

## Checklist de Vérification

Avant de commencer à développer, vérifiez :

- [ ] Node.js installé (version 18+)
- [ ] npm ou bun installé
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` créé avec les bonnes variables
- [ ] Projet Supabase créé
- [ ] Migrations appliquées
- [ ] Serveur de développement démarre sans erreur
- [ ] Application accessible sur `http://localhost:8080`
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Pas d'erreurs dans le terminal

---

## Prochaines Étapes

Une fois l'application lancée :

1. **Créer des membres de test** via `/create-test-members`
2. **Tester l'inscription** avec un nouveau compte
3. **Explorer les fonctionnalités** une par une
4. **Consulter la documentation** dans `DOCUMENTATION.md`
5. **Consulter l'audit** dans `AUDIT_ET_AMELIORATIONS.md` pour les améliorations

---

## Support

Si vous rencontrez des problèmes :

1. Vérifiez la section [Dépannage](#dépannage)
2. Consultez les logs dans le terminal
3. Vérifiez la console du navigateur (F12)
4. Consultez la documentation Supabase : [docs.supabase.com](https://docs.supabase.com)

---

**Bon développement ! 🚀**

