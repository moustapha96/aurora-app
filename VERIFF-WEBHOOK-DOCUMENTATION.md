# Documentation Webhook Veriff - Intégration Aurora

## Vue d'ensemble

Cette documentation décrit l'intégration Veriff pour la vérification d'identité dans Aurora.

---

## 1. Configuration du Webhook dans Veriff Station

### URL du Webhook à configurer

```
https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/veriff-webhook
```

### Types de Webhooks à activer

| Type | Description |
|------|-------------|
| **Event Webhook** | Événements du cycle de vie (started, submitted) |
| **Decision Webhook** | Décisions finales (approved, declined, resubmission) |

---

## 2. Payload attendu par le Webhook

### 2.1 Decision Webhook (Principal)

Le webhook attend un payload JSON avec cette structure :

```json
{
  "status": "success",
  "verification": {
    "id": "12df6045-3846-3e45-946a-14fa6136d78b",
    "code": 9001,
    "status": "approved",
    "reason": null,
    "reasonCode": null,
    "decisionTime": "2019-11-06T07:18:36.916Z",
    "acceptanceTime": "2019-11-06T07:15:27.000Z",
    "vendorData": "user-uuid-here",
    "person": {
      "firstName": "SARAH",
      "lastName": "MORGAN",
      "dateOfBirth": "1967-03-30",
      "yearOfBirth": "1967",
      "placeOfBirth": "MADRID",
      "gender": null,
      "idNumber": null,
      "citizenship": null,
      "nationality": null,
      "addresses": [
        {
          "fullAddress": "1234 Snowy Ridge Road, Indiana, 56789 USA",
          "parsedAddress": {
            "city": null,
            "state": "Indiana",
            "street": "1234 Snowy Ridge Road",
            "country": "USA",
            "postcode": "56789"
          }
        }
      ],
      "pepSanctionMatch": null
    },
    "document": {
      "type": "DRIVERS_LICENSE",
      "number": "MORGA753116SM9IJ",
      "country": "GB",
      "validFrom": null,
      "validUntil": "2022-04-20",
      "placeOfIssue": "MADRID",
      "firstIssue": "2015-03-21",
      "issueNumber": "01",
      "issuedBy": "ISSUER"
    },
    "additionalVerifiedData": {
      "estimatedAge": 32,
      "estimatedGender": 0.613,
      "driversLicenseCategory": { "B": true }
    },
    "riskLabels": [
      {
        "label": "document_integration_level_crosslinked_with_fraud",
        "category": "document",
        "sessionIds": ["5a2358e7-fd31-4fcb-a23f-4d76651ba68a"]
      }
    ],
    "biometricAuthentication": {
      "matchedSessionId": "d40edb60-6ae6-4475-be72-84b81669cce6",
      "matchedSessionVendorData": "User001"
    }
  },
  "technicalData": {
    "ip": "186.153.67.122"
  }
}
```

### 2.2 Event Webhook

```json
{
  "id": "12df6045-3846-3e45-946a-14fa6136d78b",
  "action": "submitted",
  "vendorData": "user-uuid-here"
}
```

### Headers requis

| Header | Description |
|--------|-------------|
| `x-auth-client` | ID client Veriff (UUID) |
| `x-hmac-signature` | Signature HMAC-SHA256 du payload |
| `content-type` | `application/json` |

---

## 3. Codes de décision Veriff

### Event Webhook Codes

| Code | Signification |
|------|---------------|
| 7001 | **Started** - Session accédée, non soumise |
| 7002 | **Submitted** - Session soumise pour vérification |

### Decision Webhook Codes

| Code | Status | Signification |
|------|--------|---------------|
| 9001 | `approved` | ✅ Vérification réussie |
| 9102 | `declined` | ❌ Vérification refusée |
| 9103 | `resubmission_requested` | 🔄 Nouvelle soumission requise |
| 9104 | `expired` / `abandoned` | ⏰ Session expirée/abandonnée |

---

## 4. Traitement par le Webhook

### 4.1 Recherche de la session

Le webhook recherche la vérification dans la table `identity_verifications` en utilisant le `verification.id` (session Veriff) stocké dans `verification_result.veriff_session_id`.

### 4.2 Mapping des statuts

| Veriff Status | Aurora Status |
|---------------|---------------|
| `approved` (9001) | `verified` |
| `declined` (9102) | `rejected` |
| `resubmission_requested` (9103) | `review_needed` |
| `expired` (9104) | `rejected` |
| `abandoned` (9121) | `rejected` |
| `review` | `review_needed` |

### 4.3 Données enregistrées

Le webhook met à jour la table `identity_verifications` avec :

```sql
UPDATE identity_verifications SET
  status = 'verified' | 'rejected' | 'review_needed',
  first_name_extracted = 'SARAH',
  last_name_extracted = 'MORGAN',
  document_type = 'DRIVERS_LICENSE',
  document_country = 'GB',
  verification_result = {
    -- Données existantes +
    veriff_webhook_decision: { ... payload complet ... },
    veriff_status: 'approved',
    veriff_code: 9001,
    veriff_decision_time: '2019-11-06T07:18:36.916Z',
    
    -- Données personne
    person_first_name: 'SARAH',
    person_last_name: 'MORGAN',
    person_date_of_birth: '1967-03-30',
    person_addresses: [...],
    person_pep_sanction_match: null,
    
    -- Données document
    document_type: 'DRIVERS_LICENSE',
    document_number: 'MORGA753116SM9IJ',
    document_country: 'GB',
    document_valid_until: '2022-04-20',
    
    -- Données additionnelles
    additional_verified_data: { estimatedAge: 32, ... },
    risk_labels: [...],
    biometric_authentication: {...},
    technical_ip: '186.153.67.122'
  }
WHERE verification_result->>'veriff_session_id' = '12df6045-3846-...'
```

### 4.4 Actions post-webhook

#### Si `approved` (verified)
1. ✅ Met à jour `profiles.identity_verified = true`
2. ✅ Met à jour `profiles.identity_verified_at = now()`
3. ✅ Crée une notification : "Votre identité (SARAH MORGAN) a été vérifiée avec succès."

#### Si `declined` (rejected)
1. ❌ Crée une notification : "Votre vérification d'identité a été refusée."

#### Si `resubmission_requested` (review_needed)
1. 🔄 Crée une notification : "Votre vérification nécessite des informations supplémentaires."

---

## 5. Bouton "Obtenir les résultats"

### Fonctionnement

Quand l'utilisateur clique sur "Obtenir résultat" dans `/security-settings` :

1. **Appel API** : `POST /functions/v1/veriff-verification`
   ```json
   { "action": "status" }
   ```

2. **Recherche** : Récupère la dernière vérification de l'utilisateur

3. **Si status = `initiated` ou `pending`** :
   - Appelle l'API Veriff : `GET /sessions/{sessionId}/decision`
   - Met à jour le statut local si une décision est disponible

4. **Réponse** :
   ```json
   {
     "success": true,
     "status": "verified",
     "firstName": "SARAH",
     "lastName": "MORGAN",
     "documentType": "DRIVERS_LICENSE",
     "documentCountry": "GB",
     "verificationId": "uuid-local"
   }
   ```

### Cas possibles

| Situation | Message affiché |
|-----------|-----------------|
| Aucune vérification | "Commencer la vérification" |
| `initiated` | "Vérification en cours..." |
| `pending` | "Vérification en cours de traitement" |
| `verified` | ✅ "Identité vérifiée" + badge vert |
| `rejected` | ❌ "Vérification refusée" + bouton réessayer |
| `review_needed` | 🔄 "Informations supplémentaires requises" |

---

## 6. Flux complet

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DE VÉRIFICATION                          │
└─────────────────────────────────────────────────────────────────┘

1. UTILISATEUR clique "Vérifier mon identité"
         │
         ▼
2. AURORA crée une session Veriff
   POST /sessions → reçoit session_id + redirect_url
         │
         ▼
3. UTILISATEUR redirigé vers Veriff
   Scanne son document + selfie
         │
         ▼
4. VERIFF traite la vérification (1-5 minutes)
         │
         ▼
5. VERIFF envoie le WEBHOOK
   POST /functions/v1/veriff-webhook
   avec le payload de décision
         │
         ▼
6. WEBHOOK met à jour la base de données
   - identity_verifications.status = 'verified'
   - profiles.identity_verified = true
   - Crée notification utilisateur
         │
         ▼
7. UTILISATEUR clique "Obtenir résultat"
   Voit ✅ "Identité vérifiée"
```

---

## 7. Configuration requise

### Secrets Supabase

| Secret | Description |
|--------|-------------|
| `VERIFF_API_KEY` | Clé API Veriff |
| `VERIFF_SHARED_SECRET` | Secret partagé pour HMAC |

### Dans Veriff Station

1. Aller dans **All Integrations** → Sélectionner l'intégration
2. **Settings** → **Webhook Events URL** :
   ```
   https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/veriff-webhook
   ```
3. **Settings** → **Webhook Decision URL** :
   ```
   https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/veriff-webhook
   ```
4. S'assurer que le **Shared Secret** correspond à `VERIFF_SHARED_SECRET`

---

## 8. Debugging

### Logs à vérifier

```bash
# Logs du webhook
supabase functions logs veriff-webhook

# Logs de l'API de vérification
supabase functions logs veriff-verification
```

### Messages de log importants

- `Veriff webhook received` - Webhook reçu
- `Processing decision webhook` - Traitement décision
- `Verification updated successfully` - Mise à jour réussie
- `User {id} identity verified successfully via webhook` - Profil mis à jour

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Verification not found` | Session ID non trouvée | Vérifier que la session a été créée |
| `Webhook signature mismatch` | Secret incorrect | Vérifier `VERIFF_SHARED_SECRET` |
| `401 Unauthorized` sur API | Signature HMAC incorrecte | Vérifier la logique de signature |
