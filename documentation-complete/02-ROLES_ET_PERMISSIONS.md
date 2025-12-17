# Rôles et Permissions - Aurora Society

**Version** : 1.0.0  
**Date** : Décembre 2024

---

## 1. Système de Rôles

### 1.1 Types de Rôles

L'application utilise un système de rôles basé sur l'enum PostgreSQL `app_role` :

```sql
CREATE TYPE app_role AS ENUM ('admin', 'member');
```

#### Rôle : Admin (`admin`)

**Description** : Administrateur avec accès complet à la plateforme

**Permissions** :
- ✅ Accès au panel d'administration complet
- ✅ Gestion de tous les membres
- ✅ Attribution/modification des rôles
- ✅ Modération du contenu
- ✅ Accès aux analytics et rapports
- ✅ Configuration des paramètres système
- ✅ Consultation des logs système
- ✅ Gestion des connexions entre membres
- ✅ Accès à toutes les pages publiques et membres

**Pages Accessibles** :
- `/admin/dashboard` - Dashboard admin
- `/admin/members` - Gestion membres
- `/admin/roles` - Gestion rôles
- `/admin/moderation` - Modération
- `/admin/analytics` - Analytics
- `/admin/connections` - Connexions
- `/admin/content` - Contenu
- `/admin/logs` - Logs
- `/admin/reports` - Rapports
- `/admin/settings` - Paramètres admin
- Toutes les pages membres

**Fonctions Spéciales** :
- Création de nouveaux admins
- Modification des profils de tous les membres
- Suppression de contenu
- Bannissement de membres
- Configuration des paramètres globaux

#### Rôle : Membre (`member`)

**Description** : Membre standard de la plateforme

**Permissions** :
- ✅ Gestion de son propre profil
- ✅ Consultation des autres membres
- ✅ Envoi de demandes de connexion
- ✅ Gestion de ses connexions
- ✅ Accès aux services premium (Concierge, Metaverse, Marketplace)
- ✅ Messagerie avec autres membres
- ✅ Système de parrainage
- ❌ Accès au panel admin
- ❌ Modification des profils d'autres membres
- ❌ Accès aux analytics globaux

**Pages Accessibles** :
- `/member-card` - Carte membre
- `/profile` - Profil personnel
- `/edit-profile` - Édition profil
- `/business` - Section business
- `/family` - Section family
- `/personal` - Section personal
- `/network` - Section réseau
- `/members` - Répertoire membres
- `/connections` - Connexions
- `/messages` - Messagerie
- `/referrals` - Parrainage
- `/concierge` - Concierge
- `/metaverse` - Metaverse
- `/marketplace` - Marketplace
- `/settings` - Paramètres
- `/contact` - Contact

**Fonctions Spéciales** :
- Édition de son propre contenu
- Gestion des permissions d'accès pour ses connexions
- Parrainage de nouveaux membres

### 1.2 Attribution des Rôles

**Création Automatique** :
- Lors de l'inscription, un utilisateur reçoit automatiquement le rôle `member`
- Le rôle par défaut est configurable via `app_settings.defaultRole`

**Modification des Rôles** :
- Seuls les admins peuvent modifier les rôles
- Via `/admin/roles` ou directement en base de données

**Vérification des Rôles** :
```typescript
// Hook React
const { role } = useUserRole();

// Fonction SQL
SELECT has_role(user_id, 'admin');
```

## 2. Permissions d'Accès aux Sections

### 2.1 Système de Permissions Granulaires

Chaque connexion (`friendship`) entre deux membres peut avoir des permissions spécifiques pour chaque section :

#### Permissions Disponibles

1. **business_access** (Boolean)
   - Accès à la section Business d'un membre
   - Par défaut : `true`

2. **family_access** (Boolean)
   - Accès à la section Family d'un membre
   - Par défaut : `true`

3. **personal_access** (Boolean)
   - Accès à la section Personal d'un membre
   - Par défaut : `true`

4. **influence_access** (Boolean)
   - Accès à la section Network/Influence d'un membre
   - Par défaut : `true`

5. **network_access** (Boolean)
   - Accès général au réseau d'un membre
   - Par défaut : `true`

### 2.2 Logique d'Accès

**Règles d'Accès** :

1. **Propriétaire** : Accès total à son propre profil
   - Peut voir et modifier toutes ses sections
   - Pas de restriction

2. **Membre Connecté** : Accès basé sur les permissions
   - Vérifie la relation `friendship` entre les deux membres
   - Vérifie la permission spécifique pour la section demandée
   - Si `business_access = true` → peut voir `/business/:id`
   - Si `family_access = false` → ne peut pas voir `/family/:id`

3. **Membre Non Connecté** : Pas d'accès
   - Redirection vers page d'erreur
   - Message : "Vous n'avez pas accès à cette section"

**Exemple de Vérification** :
```typescript
// Vérification accès Business
const { data: friendships } = await supabase
  .from('friendships')
  .select('business_access')
  .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${currentUserId})`);

if (!friendships || friendships.length === 0 || !friendships[0].business_access) {
  // Pas d'accès
}
```

### 2.3 Gestion des Permissions

**Lors de l'Acceptation d'une Connexion** :
- L'utilisateur qui accepte peut définir les permissions
- Par défaut, toutes les permissions sont activées
- Possibilité de désactiver certaines permissions

**Modification des Permissions** :
- Via `/connections` - Liste des connexions
- Via `/members` - Carte membre avec bouton paramètres
- Seul le propriétaire du profil peut modifier les permissions qu'il accorde

**Interface de Gestion** :
- Dialog avec checkboxes pour chaque permission
- Sauvegarde immédiate en base de données
- Notification de confirmation

## 3. Badges et Statuts Spéciaux

### 3.1 Badges de Statut

#### Fondateur (`is_founder`)
- **Type** : Boolean dans `profiles`
- **Affichage** : Badge "FONDATEUR" avec icône Crown
- **Permissions** : Aucune permission supplémentaire automatique
- **Visibilité** : Visible sur toutes les cartes membres

#### Mécène (`is_patron`)
- **Type** : Boolean dans `profiles`
- **Affichage** : Badge "MÉCÈNE" avec icône Heart
- **Permissions** : Aucune permission supplémentaire automatique
- **Visibilité** : Visible sur les profils et cartes membres

### 3.2 Badges de Richesse

**Affichage Basé sur** :
- `wealth_billions` : Valeur en milliards d'euros
- `wealth_amount` : Montant affiché
- `wealth_unit` : Unité (M = Millions, Md = Milliards)
- `wealth_currency` : Devise (EUR, USD, GBP, etc.)

**Composant** : `WealthBadge`
- Affichage automatique si `wealth_numeric > 0`
- Position : En haut à droite de l'avatar
- Style : Badge doré avec montant

## 4. Sécurité et RLS

### 4.1 Row Level Security Policies

**Table `profiles`** :
- Les utilisateurs peuvent voir leur propre profil
- Les utilisateurs peuvent voir les profils de leurs amis (basé sur `friendships`)
- Les admins peuvent voir tous les profils

**Table `friendships`** :
- Les utilisateurs peuvent voir leurs propres relations
- Les utilisateurs peuvent modifier leurs propres relations
- Les admins peuvent voir toutes les relations

**Table `business_content`, `family_content`, etc.** :
- Les utilisateurs peuvent voir leur propre contenu
- Les utilisateurs peuvent voir le contenu des amis si permission accordée
- Les utilisateurs peuvent modifier leur propre contenu
- Les admins peuvent voir et modifier tout le contenu

### 4.2 Vérification Côté Client

**Protection des Routes** :
```typescript
<ProtectedRoute>
  <Business />
</ProtectedRoute>
```

**Vérification d'Accès** :
- Chaque page vérifie l'authentification
- Vérifie les permissions avant d'afficher le contenu
- Redirection si accès refusé

## 5. Matrice des Permissions

| Action | Admin | Membre (Propre) | Membre (Autre - Connecté) | Membre (Autre - Non Connecté) |
|--------|-------|-----------------|---------------------------|-------------------------------|
| Voir son profil | ✅ | ✅ | ✅ | ❌ |
| Modifier son profil | ✅ | ✅ | ❌ | ❌ |
| Voir profil autre membre | ✅ | ✅ | ✅* | ❌ |
| Modifier profil autre membre | ✅ | ❌ | ❌ | ❌ |
| Voir section Business autre | ✅ | ✅ | ✅** | ❌ |
| Voir section Family autre | ✅ | ✅ | ✅** | ❌ |
| Voir section Personal autre | ✅ | ✅ | ✅** | ❌ |
| Voir section Network autre | ✅ | ✅ | ✅** | ❌ |
| Gérer connexions | ✅ | ✅ (ses propres) | ❌ | ❌ |
| Gérer permissions | ✅ | ✅ (ses propres) | ❌ | ❌ |
| Accès admin | ✅ | ❌ | ❌ | ❌ |
| Modérer contenu | ✅ | ❌ | ❌ | ❌ |

*Si connecté via `friendships`  
**Si connecté ET permission accordée pour cette section

---

**Document suivant** : [Pages et Fonctionnalités](./03-PAGES_ET_FONCTIONNALITES.md)

