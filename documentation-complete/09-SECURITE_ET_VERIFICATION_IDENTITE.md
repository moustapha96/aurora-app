# Vérification d'Identité avec Sumsub - Guide d'Implémentation

**Version** : 2.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Pourquoi Sumsub ?](#pourquoi-sumsub)
3. [Configuration Initiale](#configuration-initiale)
4. [Intégration Backend (Supabase Edge Functions)](#intégration-backend)
5. [Intégration Frontend (React)](#intégration-frontend)
6. [Intégration dans le Flux d'Inscription](#intégration-dans-le-flux-dinscription)
7. [Webhooks et Notifications](#webhooks-et-notifications)
8. [Migration de Base de Données](#migration-de-base-de-données)
9. [Plan d'Implémentation](#plan-dimplémentation)
10. [Coûts et Budget](#coûts-et-budget)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Ce document explique comment intégrer **Sumsub** pour la vérification d'identité (KYC/AML) dans Aurora Society. Sumsub permet de :

- ✅ Vérifier l'identité des membres (KYC)
- ✅ Vérifier les documents d'identité (passeport, carte d'identité, permis de conduire)
- ✅ Détecter les deepfakes et photos de photos (liveness check)
- ✅ Vérifier les listes de sanctions (AML)
- ✅ Vérifier l'adresse (proof of address)
- ✅ Conformité GDPR, SOC 2, ISO 27001

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│ Supabase Edge│─────▶│   Sumsub    │
│  Frontend   │      │   Function   │      │     API     │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │                      │
      │                      │                      │
      ▼                      ▼                      ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Supabase   │      │   Webhook    │      │  Sumsub     │
│  Database   │◀─────│   Handler    │◀─────│  Webhook    │
└─────────────┘      └──────────────┘      └─────────────┘
```

---

## 🏆 Pourquoi Sumsub ?

### Avantages pour Aurora Society

- **Prix compétitif** : 0,50€ - 2€ par vérification selon le niveau
- **Intégration simple** : SDK JavaScript et API REST bien documentés
- **Multi-pays** : Support de 200+ pays et 10,000+ types de documents
- **Temps réel** : Vérification en 2-5 minutes généralement
- **Conformité** : GDPR, SOC 2, ISO 27001, PCI DSS
- **Support** : Excellente documentation et support client en français

### Fonctionnalités Incluses

1. **Vérification d'identité (KYC)**
   - Scan de documents d'identité
   - Extraction automatique des données
   - Vérification de la validité du document

2. **Liveness Check**
   - Détection des deepfakes
   - Détection des photos de photos
   - Vérification que la personne est bien présente

3. **Vérification AML**
   - Vérification des listes de sanctions (PEP, sanctions, etc.)
   - Vérification de l'adresse

4. **Niveaux de Vérification**
   - **Basic KYC** : Vérification d'identité simple (0,50€ - 1€)
   - **Enhanced KYC** : Vérification complète avec AML (1€ - 2€)

---

## ⚙️ Configuration Initiale

### 1. Créer un compte Sumsub

1. Aller sur [sumsub.com](https://sumsub.com)
2. Cliquer sur "Get Started" ou "Sign Up"
3. Créer un compte développeur
4. Compléter les informations de votre entreprise
5. Vérifier votre email

### 2. Obtenir les Credentials

Une fois connecté au dashboard Sumsub :

1. Aller dans **Settings** → **API**
2. Copier votre **App Token** (ex: `sbx:xxxxx...`)
3. Copier votre **Secret Key** (ex: `xxxxx...`)
4. Notez votre **Base URL** :
   - Sandbox : `https://api.sumsub.com`
   - Production : `https://api.sumsub.com` (même URL, différencié par le token)

### 3. Configurer les Niveaux de Vérification

1. Aller dans **Settings** → **Verification Levels**
2. Créer ou configurer un niveau de vérification :
   - **basic-kyc** : Pour les membres standard
   - **enhanced-kyc** : Pour les membres premium/founders

### 4. Variables d'Environnement

Ajouter dans votre fichier `.env` :

```env
# Sumsub Configuration
SUMSUB_APP_TOKEN=your_app_token_here
SUMSUB_SECRET_KEY=your_secret_key_here
SUMSUB_BASE_URL=https://api.sumsub.com
```

**Important** : Pour les Edge Functions Supabase, ajouter ces variables dans :
- Dashboard Supabase → Project Settings → Edge Functions → Secrets

---

## 🔧 Intégration Backend (Supabase Edge Functions)

### 1. Edge Function : Créer un Access Token

Créer `supabase/functions/create-sumsub-access-token/index.ts` :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

// Helper pour créer la signature HMAC
async function createSignature(
  secretKey: string,
  method: string,
  path: string,
  timestamp: number,
  body: string = ''
): Promise<string> {
  const message = `${timestamp}${method}${path}${body}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, mobile_phone, is_founder')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sumsub configuration
    const SUMSUB_APP_TOKEN = Deno.env.get('SUMSUB_APP_TOKEN');
    const SUMSUB_SECRET_KEY = Deno.env.get('SUMSUB_SECRET_KEY');
    const SUMSUB_BASE_URL = Deno.env.get('SUMSUB_BASE_URL') || 'https://api.sumsub.com';

    if (!SUMSUB_APP_TOKEN || !SUMSUB_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Sumsub configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine verification level based on user type
    const levelName = profile.is_founder ? 'enhanced-kyc' : 'basic-kyc';

    // Create external user ID (use Supabase user ID)
    const externalUserId = user.id;

    // Create access token request
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/resources/accessTokens';
    const method = 'POST';
    const body = JSON.stringify({
      userId: externalUserId,
      levelName: levelName,
      ttlInSecs: 600, // 10 minutes
      externalActionId: `kyc-${user.id}-${Date.now()}`,
    });

    // Create signature
    const signature = await createSignature(SUMSUB_SECRET_KEY, method, path, timestamp, body);

    // Request access token from Sumsub
    const response = await fetch(`${SUMSUB_BASE_URL}${path}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': timestamp.toString(),
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sumsub API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Sumsub API error: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Store applicant ID in database for webhook matching
    if (data.applicantId) {
      await supabase
        .from('profiles')
        .update({ kyc_sumsub_applicant_id: data.applicantId })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({ 
        token: data.token,
        applicantId: data.applicantId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating Sumsub access token:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

### 2. Déployer l'Edge Function

```bash
# Déployer la fonction
supabase functions deploy create-sumsub-access-token

# Ou via le dashboard Supabase
# Project Settings → Edge Functions → Deploy
```

---

## 🎨 Intégration Frontend (React)

### 1. Ajouter le Script Sumsub

Dans `index.html` (ou `src/index.html`), ajouter avant la fermeture de `</head>` :

```html
<script src="https://static.sumsub.com/idensic/latest/idensic.js"></script>
```

### 2. Créer le Composant SumsubVerification

Créer `src/components/SumsubVerification.tsx` :

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

// Déclarer le type global pour Sumsub SDK
declare global {
  interface Window {
    Sumsub?: {
      init: (token: string, options: any) => void;
      mount: (containerId: string) => void;
      unmount: () => void;
    };
  }
}

interface SumsubVerificationProps {
  onVerificationComplete?: (status: 'approved' | 'rejected' | 'pending') => void;
  required?: boolean; // Si true, l'utilisateur doit compléter la vérification
}

export const SumsubVerification: React.FC<SumsubVerificationProps> = ({
  onVerificationComplete,
  required = false,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sumsubInitialized = useRef(false);

  useEffect(() => {
    // Vérifier le statut de vérification existant
    checkVerificationStatus();
  }, []);

  useEffect(() => {
    // Initialiser Sumsub quand on a un token
    if (accessToken && !sumsubInitialized.current && window.Sumsub) {
      initializeSumsub();
    }

    // Cleanup
    return () => {
      if (window.Sumsub && sumsubInitialized.current) {
        try {
          window.Sumsub.unmount();
        } catch (e) {
          console.error('Error unmounting Sumsub:', e);
        }
      }
    };
  }, [accessToken]);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Vérifier le statut KYC dans la base de données
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('kyc_status, kyc_verified_at')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking verification status:', profileError);
        return;
      }

      if (profile?.kyc_status === 'approved') {
        setVerificationStatus('approved');
      } else if (profile?.kyc_status === 'rejected') {
        setVerificationStatus('rejected');
      } else if (profile?.kyc_status === 'pending') {
        setVerificationStatus('pending');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const initializeSumsub = () => {
    if (!window.Sumsub || !accessToken) return;

    try {
      window.Sumsub.init(accessToken, {
        onMessage: (type: string, payload: any) => {
          console.log('Sumsub message:', type, payload);
          
          switch (type) {
            case 'idCheck.onStepCompleted':
              // Étape complétée
              console.log('Step completed:', payload);
              break;
              
            case 'idCheck.onApplicantSubmitted':
              // Vérification soumise, en attente de review
              setVerificationStatus('pending');
              toast.info(t('kycSubmitted') || 'Vérification soumise, en attente de validation...');
              break;
              
            case 'idCheck.onReviewCompleted':
              // Review complété (peut être appelé si review instantané)
              if (payload.reviewResult?.reviewAnswer === 'GREEN') {
                setVerificationStatus('approved');
                onVerificationComplete?.('approved');
                toast.success(t('kycApproved') || 'Vérification d\'identité approuvée !');
              } else {
                setVerificationStatus('rejected');
                onVerificationComplete?.('rejected');
                toast.error(t('kycRejected') || 'Vérification d\'identité rejetée.');
              }
              break;
              
            case 'idCheck.onError':
              // Erreur lors de la vérification
              console.error('Sumsub error:', payload);
              setError(payload.message || 'Erreur lors de la vérification');
              toast.error(t('kycError') || 'Erreur lors de la vérification');
              setLoading(false);
              break;
          }
        },
        onError: (error: any) => {
          console.error('Sumsub initialization error:', error);
          setError(error.message || 'Erreur lors de l\'initialisation');
          toast.error(t('kycError') || 'Erreur lors de la vérification');
          setLoading(false);
        },
      });

      // Monter le widget Sumsub
      if (containerRef.current) {
        window.Sumsub.mount(containerRef.current.id);
        sumsubInitialized.current = true;
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error initializing Sumsub:', error);
      setError(error.message || 'Erreur lors de l\'initialisation');
      setLoading(false);
    }
  };

  const startVerification = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier que le SDK Sumsub est chargé
      if (!window.Sumsub) {
        throw new Error('Sumsub SDK not loaded. Please refresh the page.');
      }

      // Obtenir le token d'accès depuis l'Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('create-sumsub-access-token');

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get access token');
      }

      if (!data?.token) {
        throw new Error('No access token received');
      }

      setAccessToken(data.token);
      
      // L'initialisation se fera dans useEffect quand accessToken sera défini
    } catch (error: any) {
      console.error('Error starting verification:', error);
      setError(error.message || 'Erreur lors du démarrage de la vérification');
      toast.error(error.message || t('kycError') || 'Erreur lors de la vérification');
      setLoading(false);
    }
  };

  // Statut : Approuvé
  if (verificationStatus === 'approved') {
    return (
      <Card className="border-green-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
            {t('kycApprovedTitle') || 'Vérification d\'identité approuvée'}
          </CardTitle>
          <CardDescription>
            {t('kycApprovedDescription') || 'Votre identité a été vérifiée avec succès.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('kycApprovedMessage') || 'Vous avez maintenant accès à toutes les fonctionnalités d\'Aurora Society.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Statut : Rejeté
  if (verificationStatus === 'rejected') {
    return (
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <XCircle className="w-5 h-5" />
            {t('kycRejectedTitle') || 'Vérification rejetée'}
          </CardTitle>
          <CardDescription>
            {t('kycRejectedDescription') || 'Votre vérification d\'identité a été rejetée.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('kycRejectedMessage') || 'Veuillez vérifier que vos documents sont valides et réessayer.'}
          </p>
          {required && (
            <Button onClick={startVerification} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('loading') || 'Chargement...'}
                </>
              ) : (
                t('kycRetry') || 'Réessayer la vérification'
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Statut : En attente
  if (verificationStatus === 'pending') {
    return (
      <Card className="border-yellow-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-500">
            <AlertCircle className="w-5 h-5" />
            {t('kycPendingTitle') || 'Vérification en cours'}
          </CardTitle>
          <CardDescription>
            {t('kycPendingDescription') || 'Votre vérification est en cours de traitement.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('kycPendingMessage') || 'Nous examinerons votre demande sous peu. Vous recevrez une notification une fois la vérification terminée.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // État initial : Pas encore vérifié
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('kycTitle') || 'Vérification d\'Identité'}</CardTitle>
        <CardDescription>
          {t('kycDescription') || 'Pour accéder à toutes les fonctionnalités d\'Aurora Society, vous devez vérifier votre identité.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('kycInstructions') || 'Ce processus prend généralement 2-5 minutes et nécessite :'}
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>{t('kycRequirement1') || 'Un document d\'identité valide (passeport, carte d\'identité, permis de conduire)'}</li>
            <li>{t('kycRequirement2') || 'Une photo de vous (selfie)'}</li>
            <li>{t('kycRequirement3') || 'Un appareil avec caméra'}</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div 
          id="sumsub-container" 
          ref={containerRef}
          className="min-h-[500px] w-full border rounded-lg bg-muted/20"
        >
          {!accessToken && (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8">
              <Button 
                onClick={startVerification} 
                disabled={loading || !window.Sumsub}
                size="lg"
                className="w-full max-w-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('loading') || 'Chargement...'}
                  </>
                ) : (
                  t('kycStart') || 'Commencer la vérification'
                )}
              </Button>
              {!window.Sumsub && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('kycSdkLoading') || 'Chargement du SDK Sumsub...'}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3. Utiliser le Composant

Dans votre page de profil ou après l'inscription :

```typescript
import { SumsubVerification } from '@/components/SumsubVerification';

// Dans votre composant
<SumsubVerification 
  required={true}
  onVerificationComplete={(status) => {
    if (status === 'approved') {
      // Rediriger ou mettre à jour l'UI
      navigate('/member-card');
    }
  }}
/>
```

---

## 🔄 Intégration dans le Flux d'Inscription

### Option 1 : Vérification après l'inscription (Recommandé)

Modifier `src/pages/Login.tsx` pour ajouter une étape de vérification après la création du compte :

```typescript
// Après la création du profil dans handleCompleteRegistration
// Rediriger vers une page de vérification KYC
if (authData.user) {
  // Vérifier si KYC est requis
  const { data: settings } = await supabase
    .from('app_settings')
    .select('require_kyc')
    .single();
  
  if (settings?.require_kyc) {
    navigate('/verify-identity');
  } else {
    navigate('/member-card');
  }
}
```

### Option 2 : Vérification dans la page de profil

Ajouter le composant dans `src/pages/Profile.tsx` ou créer une page dédiée `src/pages/VerifyIdentity.tsx` :

```typescript
import { SumsubVerification } from '@/components/SumsubVerification';
import { useNavigate } from 'react-router-dom';

const VerifyIdentity = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <SumsubVerification 
        required={true}
        onVerificationComplete={(status) => {
          if (status === 'approved') {
            navigate('/member-card');
          }
        }}
      />
    </div>
  );
};

export default VerifyIdentity;
```

Ajouter la route dans `src/App.tsx` :

```typescript
<Route path="/verify-identity" element={<VerifyIdentity />} />
```

---

## 📡 Webhooks et Notifications

### 1. Créer l'Edge Function Webhook

Créer `supabase/functions/sumsub-webhook/index.ts` :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

// Helper pour vérifier la signature HMAC
async function verifySignature(
  secretKey: string,
  payload: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const computedSignature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(computedSignature));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === signature;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Vérifier la signature du webhook
    const signature = req.headers.get('x-payload-digest');
    const SUMSUB_SECRET_KEY = Deno.env.get('SUMSUB_SECRET_KEY');
    
    if (!signature || !SUMSUB_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing signature or secret key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    const isValid = await verifySignature(SUMSUB_SECRET_KEY, body, signature);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.parse(body);
    const { type, applicantId, reviewResult } = payload;

    console.log('Sumsub webhook received:', { type, applicantId, reviewResult });

    // Initialiser Supabase avec service role pour bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Trouver l'utilisateur par applicant ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('kyc_sumsub_applicant_id', applicantId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found for applicant:', applicantId);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Traiter selon le type d'événement
    if (type === 'applicantReviewed') {
      let status: 'approved' | 'rejected' | 'pending' = 'pending';
      
      if (reviewResult?.reviewStatus === 'completed') {
        if (reviewResult?.reviewAnswer === 'GREEN') {
          status = 'approved';
        } else if (reviewResult?.reviewAnswer === 'RED') {
          status = 'rejected';
        }
      }

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          kyc_status: status,
          kyc_verified_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      // Optionnel : Envoyer une notification email
      if (status === 'approved') {
        // Utiliser votre service d'email pour notifier l'utilisateur
        console.log('KYC approved for user:', profile.email);
      } else if (status === 'rejected') {
        console.log('KYC rejected for user:', profile.email);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2. Déployer l'Edge Function

```bash
supabase functions deploy sumsub-webhook
```

### 3. Configurer le Webhook dans Sumsub

1. Aller dans **Settings** → **Webhooks** dans le dashboard Sumsub
2. Cliquer sur **Add Webhook**
3. Entrer l'URL de votre Edge Function :
   ```
   https://your-project.supabase.co/functions/v1/sumsub-webhook
   ```
4. Sélectionner les événements :
   - `applicantReviewed`
   - `applicantPending` (optionnel)
5. Cliquer sur **Save**

---

## 🗄️ Migration de Base de Données

Créer une migration pour ajouter les colonnes KYC :

Créer `supabase/migrations/YYYYMMDDHHMMSS_add_kyc_fields.sql` :

```sql
-- Migration: Add KYC fields to profiles table
-- Add KYC status and related fields

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending' 
  CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'init')),
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_sumsub_applicant_id TEXT,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_applicant_id ON profiles(kyc_sumsub_applicant_id);

-- Comment
COMMENT ON COLUMN profiles.kyc_status IS 'KYC verification status: init, pending, approved, rejected';
COMMENT ON COLUMN profiles.kyc_verified_at IS 'Timestamp when KYC was approved';
COMMENT ON COLUMN profiles.kyc_sumsub_applicant_id IS 'Sumsub applicant ID for webhook matching';
COMMENT ON COLUMN profiles.kyc_rejection_reason IS 'Reason for KYC rejection if applicable';
```

Appliquer la migration :

```bash
supabase db push
```

---

## 📋 Plan d'Implémentation

### Phase 1 : Configuration (1-2 jours)
- [ ] Créer compte Sumsub
- [ ] Obtenir credentials (App Token, Secret Key)
- [ ] Configurer niveaux de vérification
- [ ] Ajouter variables d'environnement

### Phase 2 : Backend (2-3 jours)
- [ ] Créer Edge Function `create-sumsub-access-token`
- [ ] Créer Edge Function `sumsub-webhook`
- [ ] Déployer les Edge Functions
- [ ] Tester les Edge Functions

### Phase 3 : Frontend (2-3 jours)
- [ ] Ajouter script Sumsub dans `index.html`
- [ ] Créer composant `SumsubVerification`
- [ ] Créer page `VerifyIdentity` (optionnel)
- [ ] Intégrer dans le flux d'inscription

### Phase 4 : Base de Données (1 jour)
- [ ] Créer migration pour colonnes KYC
- [ ] Appliquer la migration
- [ ] Vérifier les index

### Phase 5 : Webhooks (1-2 jours)
- [ ] Configurer webhook dans Sumsub
- [ ] Tester les webhooks
- [ ] Vérifier la mise à jour des statuts

### Phase 6 : Tests (2-3 jours)
- [ ] Test vérification complète (sandbox)
- [ ] Test webhooks
- [ ] Test différents statuts (approved, rejected)
- [ ] Test avec différents types de documents
- [ ] Test performance

### Phase 7 : Production (1 jour)
- [ ] Passer en production (changer token)
- [ ] Configurer webhook production
- [ ] Monitorer les premières vérifications
- [ ] Documentation utilisateur

**Total estimé** : 10-15 jours

---

## 💰 Coûts et Budget

### Coûts Sumsub

| Niveau | Prix par Vérification | Description |
|--------|------------------------|-------------|
| **Basic KYC** | 0,50€ - 1€ | Vérification d'identité simple |
| **Enhanced KYC** | 1€ - 2€ | Vérification complète avec AML |

### Budget Estimé

Pour **Aurora Society** avec ~50-100 nouveaux membres par mois :

- **Basic KYC** : 50-100 vérifications × 0,75€ = **37,50€ - 75€/mois**
- **Enhanced KYC** (pour founders) : 5-10 vérifications × 1,50€ = **7,50€ - 15€/mois**

**Total estimé** : **45€ - 90€/mois**

### Coûts Annuels

- **Minimum** (50 membres/mois) : ~540€/an
- **Moyen** (75 membres/mois) : ~810€/an
- **Maximum** (100 membres/mois) : ~1,080€/an

### Recommandation

Pour démarrer, prévoir **~75€/mois** pour :
- 60 vérifications Basic KYC à 0,75€ = 45€
- 10 vérifications Enhanced KYC à 1,50€ = 15€
- Marge de sécurité = 15€

---

## 🔍 Troubleshooting

### Problème : "Sumsub SDK not loaded"

**Solution** :
- Vérifier que le script est bien ajouté dans `index.html`
- Vérifier la connexion internet
- Attendre quelques secondes que le SDK se charge

### Problème : "Failed to get access token"

**Solution** :
- Vérifier que les variables d'environnement sont bien configurées
- Vérifier que l'Edge Function est bien déployée
- Vérifier les logs de l'Edge Function dans Supabase

### Problème : "Invalid signature" dans les webhooks

**Solution** :
- Vérifier que `SUMSUB_SECRET_KEY` est correct
- Vérifier que la signature est bien calculée
- Vérifier les logs du webhook

### Problème : Vérification toujours en "pending"

**Solution** :
- Vérifier que le webhook est bien configuré dans Sumsub
- Vérifier que l'URL du webhook est correcte
- Vérifier les logs de l'Edge Function webhook

### Problème : Widget Sumsub ne s'affiche pas

**Solution** :
- Vérifier que le conteneur a une hauteur minimale
- Vérifier la console pour les erreurs JavaScript
- Vérifier que le token d'accès est valide (non expiré)

---

## 📚 Ressources et Documentation

### Documentation Officielle

- **Documentation Sumsub** : [docs.sumsub.com](https://docs.sumsub.com)
- **API Reference** : [developers.sumsub.com](https://developers.sumsub.com)
- **SDK JavaScript** : [github.com/Sumsub/idensic-mobile-sdk-js](https://github.com/Sumsub/idensic-mobile-sdk-js)

### Support

- **Email** : support@sumsub.com
- **Chat** : Disponible dans le dashboard Sumsub
- **Documentation en français** : Disponible sur demande

### Exemples de Code

- **Exemples React** : [github.com/Sumsub/idensic-mobile-sdk-js/tree/main/examples](https://github.com/Sumsub/idensic-mobile-sdk-js/tree/main/examples)
- **Sandbox** : Utiliser le token sandbox pour tester

---

## ✅ Checklist de Mise en Place

### Prérequis
- [ ] Compte Sumsub créé et vérifié
- [ ] App Token et Secret Key obtenus
- [ ] Niveaux de vérification configurés (basic-kyc, enhanced-kyc)
- [ ] Variables d'environnement configurées (local et Supabase)

### Backend
- [ ] Edge Function `create-sumsub-access-token` créée
- [ ] Edge Function `sumsub-webhook` créée
- [ ] Edge Functions déployées
- [ ] Edge Functions testées

### Frontend
- [ ] Script Sumsub ajouté dans `index.html`
- [ ] Composant `SumsubVerification` créé
- [ ] Page `VerifyIdentity` créée (optionnel)
- [ ] Intégration dans le flux d'inscription

### Base de Données
- [ ] Migration créée pour colonnes KYC
- [ ] Migration appliquée
- [ ] Index créés
- [ ] Données testées

### Webhooks
- [ ] Webhook configuré dans Sumsub
- [ ] URL du webhook testée
- [ ] Événements sélectionnés
- [ ] Webhook testé avec événements réels

### Tests
- [ ] Test vérification complète (sandbox)
- [ ] Test avec différents documents
- [ ] Test webhook (approved, rejected)
- [ ] Test performance
- [ ] Test sur mobile

### Production
- [ ] Token production configuré
- [ ] Webhook production configuré
- [ ] Monitoring configuré
- [ ] Documentation utilisateur créée
- [ ] Support formé

---

## 🎯 Conclusion

L'intégration de **Sumsub** dans Aurora Society permet de :

1. ✅ **Vérifier l'identité** de tous les membres de manière sécurisée
2. ✅ **Respecter les réglementations** KYC/AML
3. ✅ **Protéger la plateforme** contre la fraude
4. ✅ **Maintenir la confiance** des membres

**Coût estimé** : ~75€/mois pour 50-100 nouveaux membres  
**Temps d'implémentation** : 10-15 jours  
**ROI** : Amélioration de la sécurité et conformité réglementaire

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 2.0.0  
**Solution** : Sumsub uniquement
