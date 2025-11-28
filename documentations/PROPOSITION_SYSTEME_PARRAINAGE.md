# 📋 Proposition : Système de Parrainage avec Codes

**Date** : 2025-01-XX  
**Projet** : Aurora Society  
**Statut** : Proposition à valider

---

## 📊 Analyse de l'Existant

### État Actuel
- ✅ Champ `referral_code` existe déjà dans la table `profiles`
- ✅ Champ de saisie du code de parrainage présent dans le formulaire d'inscription (`Register.tsx`)
- ✅ Le code est stocké lors de la création du profil
- ❌ Aucune validation du code lors de l'inscription
- ❌ Aucun système de génération automatique de codes
- ❌ Aucun tracking des parrainages
- ❌ Aucune interface pour gérer les parrainages

### Structure Actuelle
```sql
-- Table profiles (existant)
profiles.referral_code TEXT NULL  -- Code utilisé par le nouveau membre
```

---

## 🎯 Objectifs du Système de Parrainage

1. **Génération automatique** de codes uniques pour chaque membre
2. **Validation** des codes lors de l'inscription
3. **Tracking** des relations parrain/fillé
4. **Statistiques** de parrainage par membre
5. **Interface** pour voir ses filleuls et son parrain
6. **Gamification** optionnelle (points, badges, récompenses)

---

## 🏗️ Architecture Proposée

### Option 1 : Système Simple (Recommandé pour débuter)
**Complexité** : ⭐⭐  
**Temps de développement** : 2-3 jours  
**Coût** : Faible

#### Fonctionnalités
- ✅ Génération automatique de code unique (ex: `AUR-ABC123`)
- ✅ Validation du code lors de l'inscription
- ✅ Table `referrals` pour tracker les parrainages
- ✅ Page "Mon Réseau" pour voir ses filleuls
- ✅ Affichage du parrain dans le profil

#### Structure de Base de Données

```sql
-- Table pour stocker les relations de parrainage
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL, -- Code utilisé
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(referred_id) -- Un utilisateur ne peut avoir qu'un seul parrain
);

-- Index pour performance
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);

-- Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: AUR-XXX-XXX (6 caractères alphanumériques)
    code := 'AUR-' || upper(substring(md5(random()::text || user_id::text) from 1 for 3)) || 
            '-' || upper(substring(md5(random()::text || now()::text) from 1 for 3));
    
    -- Vérifier l'unicité
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Trigger pour générer automatiquement le code à la création du profil
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Générer un code si aucun n'est fourni
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Fonction pour valider et enregistrer un parrainage
CREATE OR REPLACE FUNCTION public.validate_and_create_referral(
  p_referral_code TEXT,
  p_new_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_result JSON;
BEGIN
  -- Trouver le parrain par son code
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code
    AND id != p_new_user_id; -- Ne pas se parrainer soi-même
  
  IF v_referrer_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage invalide'
    );
  END IF;
  
  -- Créer la relation de parrainage
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_new_user_id, p_referral_code, 'completed')
  ON CONFLICT (referred_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'referrer_id', v_referrer_id
  );
END;
$$;
```

#### Interface Utilisateur

**1. Page "Mon Réseau" (`/network`)**
- Liste des filleuls avec leurs profils
- Statistiques (nombre de filleuls, niveau, etc.)
- Code de parrainage personnel (copiable)
- Lien de partage

**2. Composant dans le Profil**
- Affichage du parrain (si existe)
- Badge "Membre Fondateur" ou "Parrainé par [Nom]"

**3. Amélioration du Formulaire d'Inscription**
- Validation en temps réel du code
- Message d'erreur si code invalide
- Message de succès si code valide
- Option "Je n'ai pas de code" (inscription sans parrain)

---

### Option 2 : Système Avancé avec Gamification
**Complexité** : ⭐⭐⭐⭐  
**Temps de développement** : 5-7 jours  
**Coût** : Moyen-Élevé

#### Fonctionnalités Supplémentaires
- ✅ Système de points/récompenses
- ✅ Niveaux de parrainage (Bronze, Argent, Or, Platine)
- ✅ Badges et achievements
- ✅ Leaderboard des meilleurs parrains
- ✅ Récompenses automatiques (accès premium, réductions, etc.)
- ✅ Arbre généalogique multi-niveaux (parrain de parrain)
- ✅ Statistiques avancées (taux de conversion, etc.)

#### Structure Supplémentaire

```sql
-- Table des points/récompenses
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  rewards_earned JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des récompenses disponibles
CREATE TABLE public.reward_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,
  min_referrals INTEGER NOT NULL,
  rewards JSONB NOT NULL, -- [{type: "premium_access", duration: "1_month"}]
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Option 3 : Système Premium avec Monétisation
**Complexité** : ⭐⭐⭐⭐⭐  
**Temps de développement** : 10-15 jours  
**Coût** : Élevé

#### Fonctionnalités Supplémentaires
- ✅ Commission sur les abonnements des filleuls
- ✅ Paiements automatiques
- ✅ Tableau de bord financier
- ✅ Intégration avec système de paiement (Stripe, etc.)
- ✅ Rapports fiscaux
- ✅ Multi-niveaux avec commissions en cascade

---

## 📐 Comparaison des Options

| Critère | Option 1 (Simple) | Option 2 (Gamification) | Option 3 (Monétisation) |
|---------|------------------|------------------------|------------------------|
| **Complexité** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Temps dev** | 2-3 jours | 5-7 jours | 10-15 jours |
| **Coût** | Faible | Moyen | Élevé |
| **ROI** | Rapide | Moyen | Long terme |
| **Maintenance** | Faible | Moyenne | Élevée |
| **Scalabilité** | Bonne | Très bonne | Excellente |
| **Engagement** | Moyen | Élevé | Très élevé |

---

## 🎨 Maquettes d'Interface (Option 1)

### Page "Mon Réseau"
```
┌─────────────────────────────────────────┐
│  Mon Réseau de Parrainage               │
├─────────────────────────────────────────┤
│                                          │
│  Mon Code de Parrainage                 │
│  ┌─────────────────────────────┐        │
│  │  AUR-ABC-123        [Copier] │        │
│  └─────────────────────────────┘        │
│                                          │
│  Statistiques                           │
│  • Filleuls directs : 12                │
│  • Total dans le réseau : 45            │
│                                          │
│  Mes Filleuls                           │
│  ┌─────────────────────────────────┐    │
│  │ [Avatar] Jean Dupont            │    │
│  │ Inscrit le 15/01/2025           │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ [Avatar] Marie Martin           │    │
│  │ Inscrit le 20/01/2025           │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Amélioration Formulaire d'Inscription
```
┌─────────────────────────────────────────┐
│  Code de Parrainage (Optionnel)         │
│  ┌─────────────────────────────┐        │
│  │ AUR-ABC-123          [✓ Valide] │    │
│  └─────────────────────────────┘        │
│  Parrainé par : Jean Dupont             │
│                                          │
│  OU                                      │
│                                          │
│  ┌─────────────────────────────┐        │
│  │ Code invalide        [✗ Erreur] │    │
│  └─────────────────────────────┘        │
│  Ce code n'existe pas                   │
└─────────────────────────────────────────┘
```

---

## 🔧 Implémentation Technique (Option 1)

### Fichiers à Créer/Modifier

#### 1. Migration SQL
- `supabase/migrations/XXXXXX_create_referral_system.sql`
  - Table `referrals`
  - Fonctions SQL
  - Triggers
  - Index

#### 2. Composants React
- `src/pages/Network.tsx` - Page "Mon Réseau"
- `src/components/ReferralCodeInput.tsx` - Input avec validation
- `src/components/ReferralStats.tsx` - Statistiques
- `src/components/ReferralList.tsx` - Liste des filleuls

#### 3. Context/Hooks
- `src/hooks/useReferrals.ts` - Hook pour gérer les parrainages
- `src/lib/referralUtils.ts` - Utilitaires (validation, formatage)

#### 4. Edge Functions (optionnel)
- `supabase/functions/validate-referral-code/index.ts`
- `supabase/functions/get-referral-stats/index.ts`

---

## 📊 Métriques de Succès

### KPIs à Suivre
- **Taux d'utilisation** : % d'inscriptions avec code de parrainage
- **Taux de conversion** : % de codes valides utilisés
- **Taux de parrainage** : Nombre moyen de filleuls par membre
- **Engagement** : % de membres actifs qui parrainent
- **Croissance organique** : % de nouveaux membres via parrainage

### Objectifs (exemples)
- 60% des nouvelles inscriptions avec code de parrainage
- 3 filleuls en moyenne par membre actif
- 40% de croissance organique via parrainage

---

## 🚀 Plan de Déploiement (Option 1)

### Phase 1 : Backend (Jour 1)
- [ ] Créer la migration SQL
- [ ] Tester les fonctions SQL
- [ ] Créer les Edge Functions (si nécessaire)
- [ ] Tests unitaires

### Phase 2 : Frontend Core (Jour 2)
- [ ] Créer le hook `useReferrals`
- [ ] Créer le composant `ReferralCodeInput` avec validation
- [ ] Modifier `Register.tsx` pour intégrer la validation
- [ ] Modifier `Login.tsx` pour appeler la fonction de parrainage

### Phase 3 : Interface Utilisateur (Jour 3)
- [ ] Créer la page `Network.tsx`
- [ ] Créer les composants de statistiques
- [ ] Ajouter le lien dans la navigation
- [ ] Tests d'intégration

### Phase 4 : Tests & Polish (Jour 3-4)
- [ ] Tests end-to-end
- [ ] Corrections de bugs
- [ ] Optimisations
- [ ] Documentation

---

## 💰 Coûts Estimés

### Option 1 (Simple)
- **Développement** : 2-3 jours × taux horaire
- **Maintenance** : 2-3h/mois
- **Infrastructure** : Aucun coût supplémentaire (Supabase gratuit)

### Option 2 (Gamification)
- **Développement** : 5-7 jours × taux horaire
- **Maintenance** : 5-8h/mois
- **Infrastructure** : Possiblement besoin d'un plan Supabase supérieur

### Option 3 (Monétisation)
- **Développement** : 10-15 jours × taux horaire
- **Maintenance** : 10-15h/mois
- **Infrastructure** : Plan Supabase Pro + intégration paiement
- **Frais de transaction** : 2-3% par transaction

---

## ⚠️ Risques & Considérations

### Risques Techniques
- **Performance** : Les requêtes multi-niveaux peuvent être lentes
  - *Solution* : Index appropriés, pagination, cache
- **Sécurité** : Validation côté serveur obligatoire
  - *Solution* : Edge Functions avec validation stricte
- **Scalabilité** : Table `referrals` peut grandir rapidement
  - *Solution* : Archivage des anciens parrainages

### Risques Business
- **Abus** : Création de comptes fictifs pour gagner des points
  - *Solution* : Validation email, vérification d'identité
- **Coûts** : Si système de récompenses, budget à prévoir
  - *Solution* : Limiter les récompenses, plafonds

### Considérations Légales
- **RGPD** : Stockage des relations de parrainage
- **Fiscalité** : Si commissions, déclaration nécessaire
- **CGU** : Mettre à jour les conditions d'utilisation

---

## 🎯 Recommandation

### Pour Commencer : **Option 1 (Système Simple)**

**Pourquoi ?**
- ✅ Déploiement rapide (2-3 jours)
- ✅ Coût faible
- ✅ Facile à maintenir
- ✅ Permet de tester le concept
- ✅ Évolutif (peut être amélioré plus tard)

**Évolution Future**
- Après 3-6 mois, analyser les métriques
- Si succès, migrer vers Option 2 (Gamification)
- Si très grand succès, considérer Option 3 (Monétisation)

---

## 📝 Questions à Décider

1. **Quelle option choisir ?** (1, 2, ou 3)
2. **Format du code ?** 
   - `AUR-ABC-123` (recommandé)
   - `AURORA-XXXXXX`
   - Autre format ?
3. **Code obligatoire ou optionnel ?**
   - Optionnel (recommandé pour débuter)
   - Obligatoire (meilleur pour croissance)
4. **Validation en temps réel ?**
   - Oui (meilleure UX)
   - Non (plus simple)
5. **Système de récompenses ?**
   - Non pour l'instant
   - Oui, mais lesquelles ?
6. **Multi-niveaux ?**
   - Non (un seul niveau)
   - Oui (parrain de parrain)

---

## ✅ Checklist de Validation

Avant de commencer le développement, valider :
- [ ] Option choisie
- [ ] Format du code
- [ ] Obligatoire ou optionnel
- [ ] Budget alloué
- [ ] Délai souhaité
- [ ] Priorité dans le backlog
- [ ] Design/UI approuvé

---

## 📚 Ressources & Références

- Documentation Supabase : https://supabase.com/docs
- Exemples de systèmes de parrainage :
  - Dropbox (espace de stockage)
  - Airbnb (crédits de voyage)
  - Uber (crédits de trajet)
- Best practices :
  - Codes courts et mémorisables
  - Validation immédiate
  - Partage facile (lien, QR code)

---

**Document préparé par** : Assistant IA  
**Date** : 2025-01-XX  
**Version** : 1.0

---

## 📞 Prochaines Étapes

1. **Réviser ce document**
2. **Répondre aux questions de décision**
3. **Valider l'option choisie**
4. **Approuver le plan de déploiement**
5. **Commencer le développement**

---

*Ce document est un guide de décision. Toutes les options peuvent être adaptées selon vos besoins spécifiques.*

