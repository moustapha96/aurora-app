# Documentation Technique - Système de Parrainage

## Architecture

### Schéma de Base de Données

```
┌─────────────────┐
│   referrals     │
├─────────────────┤
│ id (UUID)       │ PK
│ sponsor_id      │ FK → auth.users
│ referred_id     │ FK → auth.users (UNIQUE)
│ referral_code   │ TEXT
│ status          │ TEXT ('pending'|'confirmed'|'rejected')
│ created_at      │ TIMESTAMPTZ
│ updated_at      │ TIMESTAMPTZ
└─────────────────┘
```

### Flux de Données

```
User Action → FamilyParrainage Component
    ↓
Supabase Query (with RLS)
    ↓
Database (referrals table)
    ↓
Response → UI Update
```

## Composants

### FamilyParrainage.tsx

**État Local :**
```typescript
- referredMembers: ReferredMember[]
- isLoading: boolean
- maxReferrals: number
- newDialogOpen: boolean
- searchEmail: string
- foundUser: Profile | null
```

**Méthodes Principales :**

1. `loadData()`
   - Charge les parrainages depuis `referrals`
   - Charge la limite depuis `admin_settings`
   - Charge le code de parrainage depuis `profiles`

2. `searchUserByEmail()`
   - Recherche dans `profiles` par username, first_name, last_name
   - Utilise `ilike` pour recherche insensible à la casse

3. `addReferral()`
   - Vérifie la limite (referredMembers.length < maxReferrals)
   - Vérifie les doublons (referred_id unique)
   - Vérifie l'auto-parrainage (sponsor_id !== referred_id)
   - Insère dans `referrals`

## Requêtes SQL Importantes

### Compter les Parrainages d'un Utilisateur

```sql
SELECT COUNT(*) 
FROM referrals 
WHERE sponsor_id = :userId 
  AND status = 'confirmed';
```

### Vérifier si un Utilisateur est Déjà Parrainé

```sql
SELECT EXISTS(
  SELECT 1 
  FROM referrals 
  WHERE referred_id = :userId
);
```

### Récupérer la Limite Configurée

```sql
SELECT setting_value::int 
FROM admin_settings 
WHERE setting_key = 'max_referrals_per_user';
```

## Politiques RLS

### SELECT

```sql
-- Utilisateur voit ses propres parrainages (sponsor)
auth.uid() = sponsor_id

-- Utilisateur voit qui l'a parrainé
auth.uid() = referred_id

-- Admin voit tout
has_role(auth.uid(), 'admin')
```

### INSERT

```sql
-- Utilisateur peut créer ses propres parrainages
auth.uid() = sponsor_id
```

### UPDATE / DELETE

```sql
-- Seuls les admins peuvent modifier/supprimer
has_role(auth.uid(), 'admin')
```

## Validation des Données

### Côté Client (FamilyParrainage.tsx)

```typescript
// Vérification limite
if (referredMembers.length >= maxReferrals) {
  throw new Error(`Limite atteinte: ${maxReferrals}`);
}

// Vérification doublon
const existing = await supabase
  .from('referrals')
  .select('id')
  .eq('referred_id', foundUser.id)
  .maybeSingle();

if (existing) {
  throw new Error('Utilisateur déjà parrainé');
}

// Vérification auto-parrainage
if (foundUser.id === profileId) {
  throw new Error('Auto-parrainage interdit');
}
```

### Côté Base de Données

```sql
-- Contrainte UNIQUE sur referred_id
UNIQUE(referred_id)

-- Contrainte NOT NULL sur les champs requis
sponsor_id UUID NOT NULL
referred_id UUID NOT NULL
referral_code TEXT NOT NULL
```

## Gestion des Erreurs

### Types d'Erreurs

1. **Erreurs de Limite**
   - Code : `REFERRAL_LIMIT_REACHED`
   - Message : "Vous avez atteint la limite de X parrainages"

2. **Erreurs de Doublon**
   - Code : `DUPLICATE_REFERRAL`
   - Message : "Cet utilisateur a déjà été parrainé"

3. **Erreurs d'Auto-parrainage**
   - Code : `SELF_REFERRAL`
   - Message : "Vous ne pouvez pas vous parrainer vous-même"

4. **Erreurs de Recherche**
   - Code : `USER_NOT_FOUND`
   - Message : "Aucun utilisateur trouvé"

### Logging

```typescript
try {
  // Opération
} catch (error: any) {
  console.error("Error loading referrals:", error);
  toast.error("Erreur lors du chargement des parrainages");
}
```

## Performance

### Optimisations

1. **Index sur les Colonnes Fréquemment Interrogées**
   ```sql
   CREATE INDEX idx_referrals_sponsor_id ON referrals(sponsor_id);
   CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
   ```

2. **Limitation des Résultats**
   ```typescript
   .limit(10) // Limite la recherche à 10 résultats
   ```

3. **Chargement Asynchrone**
   ```typescript
   await Promise.all([
     loadReferrals(),
     loadMaxReferrals(),
     loadReferralCode()
   ]);
   ```

## Tests Recommandés

### Tests Unitaires

```typescript
describe('FamilyParrainage', () => {
  it('should load referrals correctly', async () => {
    // Test de chargement
  });

  it('should prevent duplicate referrals', async () => {
    // Test de doublon
  });

  it('should respect referral limit', async () => {
    // Test de limite
  });

  it('should prevent self-referral', async () => {
    // Test d'auto-parrainage
  });
});
```

### Tests d'Intégration

1. Test du flux complet d'ajout de parrainage
2. Test des politiques RLS
3. Test de la recherche d'utilisateurs
4. Test de l'affichage des statistiques

## Migration et Déploiement

### Ordre d'Exécution

1. Appliquer la migration SQL
2. Vérifier les politiques RLS
3. Vérifier les index
4. Tester les requêtes

### Rollback

```sql
-- Supprimer la table
DROP TABLE IF EXISTS referrals CASCADE;

-- Supprimer le paramètre
DELETE FROM admin_settings 
WHERE setting_key = 'max_referrals_per_user';
```

## Variables d'Environnement

Aucune variable d'environnement spécifique requise. Le système utilise :
- `SUPABASE_URL` (déjà configuré)
- `SUPABASE_ANON_KEY` (déjà configuré)

## Dépendances

- `@supabase/supabase-js` : Client Supabase
- `react-router-dom` : Navigation
- `sonner` : Notifications toast
- `lucide-react` : Icônes

## Maintenance

### Tâches Régulières

1. **Vérification des Limites**
   - Vérifier que les limites sont respectées
   - Analyser les statistiques de parrainage

2. **Nettoyage**
   - Supprimer les parrainages rejetés anciens (si nécessaire)
   - Archiver les parrainages confirmés anciens (si nécessaire)

3. **Optimisation**
   - Analyser les performances des requêtes
   - Ajuster les index si nécessaire

## Dépannage

### Problème : Les parrainages ne s'affichent pas

**Vérifications :**
1. Politiques RLS correctement configurées
2. Utilisateur authentifié
3. Requêtes retournent des données

**Solution :**
```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'referrals';

-- Tester une requête
SELECT * FROM referrals WHERE sponsor_id = :userId;
```

### Problème : Impossible d'ajouter un parrainage

**Vérifications :**
1. Limite non atteinte
2. Utilisateur non déjà parrainé
3. Permissions INSERT correctes

**Solution :**
```sql
-- Vérifier la limite
SELECT COUNT(*) FROM referrals WHERE sponsor_id = :userId;

-- Vérifier les permissions
SELECT * FROM pg_policies 
WHERE tablename = 'referrals' 
  AND cmd = 'INSERT';
```

---

**Version :** 1.0.0  
**Dernière mise à jour :** 25 décembre 2024

