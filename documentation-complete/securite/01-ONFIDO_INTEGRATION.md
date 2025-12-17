# Intégration Onfido API - Guide Complet

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Pourquoi Onfido ?](#pourquoi-onfido)
3. [Configuration Initiale](#configuration-initiale)
4. [Architecture Technique](#architecture-technique)
5. [Intégration Backend (Supabase Edge Functions)](#intégration-backend)
6. [Intégration Frontend (React)](#intégration-frontend)
7. [Webhooks et Notifications](#webhooks-et-notifications)
8. [Migration de Base de Données](#migration-de-base-de-données)
9. [Plan d'Implémentation](#plan-dimplémentation)
10. [Coûts et Budget](#coûts-et-budget)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Ce document explique comment intégrer **Onfido** pour la vérification d'identité et l'authentification des documents (CNI, passeports, permis de conduire) dans Aurora Society. Onfido permet de :

- ✅ **Vérifier l'authenticité** des documents d'identité
- ✅ **Détecter les fraudes** : photos de photos, deepfakes, documents falsifiés
- ✅ **Liveness check** : vérification que la personne est bien présente
- ✅ **Extraction automatique** des données (nom, date de naissance, etc.)
- ✅ **Vérification AML** : listes de sanctions, PEP (Politically Exposed Persons)
- ✅ **Conformité réglementaire** : GDPR, SOC 2, ISO 27001, PCI DSS

### Architecture Onfido

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│ Supabase Edge│─────▶│   Onfido    │
│  Frontend   │      │   Function   │      │     API     │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │                      │
      │                      │                      │
      ▼                      ▼                      ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Supabase   │      │   Webhook    │      │   Onfido    │
│  Database   │◀─────│   Handler    │◀─────│  Webhook    │
└─────────────┘      └──────────────┘      └─────────────┘
```

---

## 🏆 Pourquoi Onfido ?

### Avantages pour Aurora Society

- **Fiabilité** : Leader mondial de la vérification d'identité (KYC/AML)
- **Précision** : 99,9% de précision dans la détection de fraude
- **Support multi-pays** : 195+ pays, 2,500+ types de documents
- **Intégration simple** : SDK JavaScript/React bien documenté
- **Temps réel** : Vérification en 30 secondes à 2 minutes
- **Conformité** : GDPR, SOC 2, ISO 27001, PCI DSS
- **Support** : Documentation complète et support client réactif

### Fonctionnalités Incluses

1. **Vérification de Documents**
   - Scan et analyse de CNI, passeports, permis de conduire
   - Extraction automatique des données (OCR)
   - Vérification de l'authenticité (hologrammes, filigranes, etc.)
   - Détection de falsifications

2. **Liveness Check**
   - Détection des deepfakes
   - Détection des photos de photos
   - Vérification que la personne est bien présente
   - Analyse de mouvement et de vie

3. **Vérification AML**
   - Vérification des listes de sanctions (OFAC, UN, EU)
   - Détection PEP (Politically Exposed Persons)
   - Vérification de l'adresse (proof of address)

4. **Niveaux de Vérification**
   - **Standard** : Vérification document + selfie (1-2€)
   - **Enhanced** : Vérification complète avec AML (2-3€)
   - **Premium** : Vérification approfondie avec vérification manuelle (3-5€)

---

## ⚙️ Configuration Initiale

### 1. Créer un compte Onfido

1. Aller sur [onfido.com](https://onfido.com)
2. Cliquer sur "Get Started" ou "Sign Up"
3. Créer un compte développeur
4. Compléter les informations de votre entreprise
5. Vérifier votre email
6. Compléter le processus de vérification de compte

### 2. Obtenir les Credentials

Une fois connecté au dashboard Onfido :

1. Aller dans **Settings** → **API Tokens**
2. Copier votre **API Token** (ex: `live_xxxxx...` ou `test_xxxxx...`)
   - **Sandbox** : Préfixe `test_`
   - **Production** : Préfixe `live_`
3. Notez votre **Base URL** :
   - Sandbox : `https://api.onfido.com/v3`
   - Production : `https://api.onfido.com/v3` (même URL, différencié par le token)

### 3. Configurer les Webhooks

1. Aller dans **Settings** → **Webhooks**
2. Cliquer sur **Add Webhook**
3. Entrer l'URL de votre Edge Function :
   ```
   https://your-project.supabase.co/functions/v1/onfido-webhook
   ```
4. Sélectionner les événements :
   - `check.completed`
   - `report.completed`
   - `report.withdrawn`
5. Notez le **Webhook Token** (pour vérifier la signature)

### 4. Variables d'Environnement

Ajouter dans votre fichier `.env` :

```env
# Onfido Configuration
ONFIDO_API_TOKEN=test_xxxxx...  # ou live_xxxxx... pour production
ONFIDO_WEBHOOK_TOKEN=wh_xxxxx...  # Token pour vérifier les webhooks
ONFIDO_BASE_URL=https://api.onfido.com/v3
```

**Important** : Pour les Edge Functions Supabase, ajouter ces variables dans :
- Dashboard Supabase → Project Settings → Edge Functions → Secrets

---

## 🏗️ Architecture Technique

### Flux de Vérification

```
1. UTILISATEUR → Frontend React
   └─▶ Démarre vérification Onfido

2. FRONTEND → Edge Function (create-onfido-sdk-token)
   └─▶ Génère token SDK temporaire

3. FRONTEND → SDK Onfido (navigateur)
   └─▶ Capture document + selfie
   └─▶ Envoie à Onfido API

4. ONFIDO → Traitement et analyse
   └─▶ Vérifie document
   └─▶ Vérifie liveness
   └─▶ Extraction données

5. ONFIDO → Webhook → Edge Function (onfido-webhook)
   └─▶ Notification résultat

6. EDGE FUNCTION → Supabase Database
   └─▶ Mise à jour statut KYC
```

---

## 🔧 Intégration Backend (Supabase Edge Functions)

### 1. Edge Function : Créer un SDK Token

Créer `supabase/functions/create-onfido-sdk-token/index.ts` :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

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

    // Onfido configuration
    const ONFIDO_API_TOKEN = Deno.env.get('ONFIDO_API_TOKEN');
    const ONFIDO_BASE_URL = Deno.env.get('ONFIDO_BASE_URL') || 'https://api.onfido.com/v3';

    if (!ONFIDO_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Onfido configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create applicant in Onfido
    const applicantResponse = await fetch(`${ONFIDO_BASE_URL}/applicants`, {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.mobile_phone || undefined,
        location: {
          ip_address: req.headers.get('x-forwarded-for') || undefined,
        },
      }),
    });

    if (!applicantResponse.ok) {
      const errorText = await applicantResponse.text();
      console.error('Onfido API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Onfido API error: ${errorText}` }),
        { status: applicantResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const applicantData = await applicantResponse.json();

    // Store applicant ID in database
    await supabase
      .from('profiles')
      .update({ kyc_onfido_applicant_id: applicantData.id })
      .eq('id', user.id);

    // Create SDK token
    const sdkTokenResponse = await fetch(`${ONFIDO_BASE_URL}/sdk_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${ONFIDO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicant_id: applicantData.id,
        referrer: req.headers.get('referer') || '*',
      }),
    });

    if (!sdkTokenResponse.ok) {
      const errorText = await sdkTokenResponse.text();
      console.error('Onfido SDK token error:', errorText);
      return new Response(
        JSON.stringify({ error: `Onfido SDK token error: ${errorText}` }),
        { status: sdkTokenResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sdkTokenData = await sdkTokenResponse.json();

    return new Response(
      JSON.stringify({ 
        token: sdkTokenData.token,
        applicantId: applicantData.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating Onfido SDK token:', error);
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
supabase functions deploy create-onfido-sdk-token

# Ou via le dashboard Supabase
# Project Settings → Edge Functions → Deploy
```

---

## 🎨 Intégration Frontend (React)

### 1. Installer le SDK Onfido

```bash
npm install onfido-sdk-ui
```

### 2. Créer le Composant OnfidoVerification

Créer `src/components/OnfidoVerification.tsx` :

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

// Types Onfido
declare global {
  interface Window {
    Onfido: any;
  }
}

interface OnfidoVerificationProps {
  onVerificationComplete?: (status: 'approved' | 'rejected' | 'pending') => void;
  required?: boolean;
}

export const OnfidoVerification: React.FC<OnfidoVerificationProps> = ({
  onVerificationComplete,
  required = false,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [sdkToken, setSdkToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onfidoInstance = useRef<any>(null);

  useEffect(() => {
    // Vérifier le statut de vérification existant
    checkVerificationStatus();
  }, []);

  useEffect(() => {
    // Charger le script Onfido
    const script = document.createElement('script');
    script.src = 'https://assets.onfido.com/web-sdk-releases/7.9.1/onfido.min.js';
    script.async = true;
    script.onload = () => {
      console.log('Onfido SDK loaded');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (onfidoInstance.current) {
        try {
          onfidoInstance.current.tearDown();
        } catch (e) {
          console.error('Error tearing down Onfido:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    // Initialiser Onfido quand on a un token
    if (sdkToken && !onfidoInstance.current && window.Onfido) {
      initializeOnfido();
    }
  }, [sdkToken]);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  const initializeOnfido = () => {
    if (!window.Onfido || !sdkToken || !containerRef.current) return;

    try {
      onfidoInstance.current = window.Onfido.init({
        token: sdkToken,
        containerId: containerRef.current.id,
        onComplete: (data: any) => {
          // Vérification complétée
          console.log('Onfido verification completed:', data);
          setVerificationStatus('pending');
          toast.info(t('kycSubmitted') || 'Vérification soumise, en attente de validation...');
          
          // Le webhook mettra à jour le statut final
          // On peut poller ou attendre le webhook
          setTimeout(() => {
            checkVerificationStatus();
          }, 5000);
        },
        onError: (error: any) => {
          console.error('Onfido error:', error);
          setError(error.message || 'Erreur lors de la vérification');
          toast.error(t('kycError') || 'Erreur lors de la vérification');
          setLoading(false);
        },
        steps: [
          {
            type: 'document',
            options: {
              documentTypes: {
                passport: true,
                driving_licence: true,
                national_identity_card: true,
              },
              forceCrossDevice: false,
            },
          },
          {
            type: 'face',
            options: {
              requestedVariant: 'video',
            },
          },
        ],
      });
    } catch (error: any) {
      console.error('Error initializing Onfido:', error);
      setError(error.message || 'Erreur lors de l\'initialisation');
      setLoading(false);
    }
  };

  const startVerification = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier que le SDK Onfido est chargé
      if (!window.Onfido) {
        throw new Error('Onfido SDK not loaded. Please refresh the page.');
      }

      // Obtenir le token SDK depuis l'Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('create-onfido-sdk-token');

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get SDK token');
      }

      if (!data?.token) {
        throw new Error('No SDK token received');
      }

      setSdkToken(data.token);
      setLoading(false);
      
      // L'initialisation se fera dans useEffect quand sdkToken sera défini
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
            <li>{t('kycRequirement2') || 'Une photo de vous (selfie vidéo)'}</li>
            <li>{t('kycRequirement3') || 'Un appareil avec caméra'}</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div 
          id="onfido-mount-point" 
          ref={containerRef}
          className="min-h-[500px] w-full border rounded-lg bg-muted/20"
        >
          {!sdkToken && (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8">
              <Button 
                onClick={startVerification} 
                disabled={loading || !window.Onfido}
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
              {!window.Onfido && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('kycSdkLoading') || 'Chargement du SDK Onfido...'}
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
import { OnfidoVerification } from '@/components/OnfidoVerification';

// Dans votre composant
<OnfidoVerification 
  required={true}
  onVerificationComplete={(status) => {
    if (status === 'approved') {
      navigate('/member-card');
    }
  }}
/>
```

---

## 📡 Webhooks et Notifications

### 1. Créer l'Edge Function Webhook

Créer `supabase/functions/onfido-webhook/index.ts` :

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

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
    const signature = req.headers.get('x-s signature');
    const ONFIDO_WEBHOOK_TOKEN = Deno.env.get('ONFIDO_WEBHOOK_TOKEN');
    
    if (!signature || !ONFIDO_WEBHOOK_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Missing signature or webhook token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    const isValid = await verifySignature(ONFIDO_WEBHOOK_TOKEN, body, signature);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.parse(body);
    const { resource_type, action, object } = payload;

    console.log('Onfido webhook received:', { resource_type, action, object });

    // Initialiser Supabase avec service role pour bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Traiter selon le type d'événement
    if (resource_type === 'check' && action === 'check.completed') {
      // Trouver l'utilisateur par applicant ID
      const applicantId = object.applicant_id;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('kyc_onfido_applicant_id', applicantId)
        .single();

      if (profileError || !profile) {
        console.error('Profile not found for applicant:', applicantId);
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Déterminer le statut basé sur le résultat du check
      let status: 'approved' | 'rejected' | 'pending' = 'pending';
      
      if (object.result === 'clear') {
        status = 'approved';
      } else if (object.result === 'consider') {
        status = 'pending'; // Nécessite révision manuelle
      } else if (object.result === 'unclear') {
        status = 'rejected';
      }

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          kyc_status: status,
          kyc_verified_at: status === 'approved' ? new Date().toISOString() : null,
          kyc_onfido_check_id: object.id,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      // Optionnel : Envoyer une notification email
      if (status === 'approved') {
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
supabase functions deploy onfido-webhook
```

### 3. Configurer le Webhook dans Onfido

1. Aller dans **Settings** → **Webhooks** dans le dashboard Onfido
2. Cliquer sur **Add Webhook**
3. Entrer l'URL de votre Edge Function :
   ```
   https://your-project.supabase.co/functions/v1/onfido-webhook
   ```
4. Sélectionner les événements :
   - `check.completed`
   - `report.completed`
5. Copier le **Webhook Token** et l'ajouter aux secrets Supabase

---

## 🗄️ Migration de Base de Données

Créer une migration pour ajouter les colonnes Onfido :

Créer `supabase/migrations/YYYYMMDDHHMMSS_add_onfido_fields.sql` :

```sql
-- Migration: Add Onfido KYC fields to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending' 
  CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'init')),
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_onfido_applicant_id TEXT,
ADD COLUMN IF NOT EXISTS kyc_onfido_check_id TEXT,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_applicant_id ON profiles(kyc_onfido_applicant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_check_id ON profiles(kyc_onfido_check_id);

-- Comment
COMMENT ON COLUMN profiles.kyc_status IS 'KYC verification status: init, pending, approved, rejected';
COMMENT ON COLUMN profiles.kyc_verified_at IS 'Timestamp when KYC was approved';
COMMENT ON COLUMN profiles.kyc_onfido_applicant_id IS 'Onfido applicant ID';
COMMENT ON COLUMN profiles.kyc_onfido_check_id IS 'Onfido check ID';
COMMENT ON COLUMN profiles.kyc_rejection_reason IS 'Reason for KYC rejection if applicable';
```

Appliquer la migration :

```bash
supabase db push
```

---

## 📋 Plan d'Implémentation

### Phase 1 : Configuration (1-2 jours)
- [ ] Créer compte Onfido
- [ ] Obtenir credentials (API Token, Webhook Token)
- [ ] Configurer variables d'environnement
- [ ] Configurer webhook dans Onfido

### Phase 2 : Backend (2-3 jours)
- [ ] Créer Edge Function `create-onfido-sdk-token`
- [ ] Créer Edge Function `onfido-webhook`
- [ ] Déployer les Edge Functions
- [ ] Tester les Edge Functions

### Phase 3 : Frontend (2-3 jours)
- [ ] Installer SDK Onfido
- [ ] Créer composant `OnfidoVerification`
- [ ] Créer page `VerifyIdentity` (optionnel)
- [ ] Intégrer dans le flux d'inscription

### Phase 4 : Base de Données (1 jour)
- [ ] Créer migration pour colonnes Onfido
- [ ] Appliquer la migration
- [ ] Vérifier les index

### Phase 5 : Webhooks (1-2 jours)
- [ ] Configurer webhook dans Onfido
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

### Coûts Onfido

| Niveau | Prix par Vérification | Description |
|--------|------------------------|-------------|
| **Standard** | 1€ - 2€ | Vérification document + selfie |
| **Enhanced** | 2€ - 3€ | Vérification complète avec AML |
| **Premium** | 3€ - 5€ | Vérification approfondie avec révision manuelle |

### Budget Estimé

Pour **Aurora Society** avec ~50-100 nouveaux membres par mois :

- **Standard** : 50-100 vérifications × 1,50€ = **75€ - 150€/mois**
- **Enhanced** (pour founders) : 5-10 vérifications × 2,50€ = **12,50€ - 25€/mois**

**Total estimé** : **87,50€ - 175€/mois**

### Coûts Annuels

- **Minimum** (50 membres/mois) : ~1,050€/an
- **Moyen** (75 membres/mois) : ~1,575€/an
- **Maximum** (100 membres/mois) : ~2,100€/an

### Recommandation

Pour démarrer, prévoir **~125€/mois** pour :
- 60 vérifications Standard à 1,50€ = 90€
- 10 vérifications Enhanced à 2,50€ = 25€
- Marge de sécurité = 10€

---

## 🔍 Troubleshooting

### Problème : "Onfido SDK not loaded"

**Solution** :
- Vérifier que le script est bien chargé dans le composant
- Vérifier la connexion internet
- Attendre quelques secondes que le SDK se charge
- Vérifier la version du SDK dans l'URL

### Problème : "Failed to get SDK token"

**Solution** :
- Vérifier que les variables d'environnement sont bien configurées
- Vérifier que l'Edge Function est bien déployée
- Vérifier les logs de l'Edge Function dans Supabase
- Vérifier que l'API Token Onfido est valide

### Problème : "Invalid signature" dans les webhooks

**Solution** :
- Vérifier que `ONFIDO_WEBHOOK_TOKEN` est correct
- Vérifier que la signature est bien calculée
- Vérifier les logs du webhook
- Vérifier que le webhook token correspond dans le dashboard Onfido

### Problème : Vérification toujours en "pending"

**Solution** :
- Vérifier que le webhook est bien configuré dans Onfido
- Vérifier que l'URL du webhook est correcte
- Vérifier les logs de l'Edge Function webhook
- Vérifier que les événements sont bien sélectionnés

### Problème : Widget Onfido ne s'affiche pas

**Solution** :
- Vérifier que le conteneur a une hauteur minimale
- Vérifier la console pour les erreurs JavaScript
- Vérifier que le token SDK est valide (non expiré)
- Vérifier que le containerId est correct

---

## 📚 Ressources et Documentation

### Documentation Officielle

- **Documentation Onfido** : [documentation.onfido.com](https://documentation.onfido.com)
- **API Reference** : [documentation.onfido.com/v2.1](https://documentation.onfido.com/v2.1)
- **SDK JavaScript** : [github.com/onfido/onfido-sdk-ui](https://github.com/onfido/onfido-sdk-ui)

### Support

- **Email** : support@onfido.com
- **Chat** : Disponible dans le dashboard Onfido
- **Documentation** : Documentation complète disponible

### Exemples de Code

- **Exemples React** : [github.com/onfido/onfido-sdk-ui/tree/master/example](https://github.com/onfido/onfido-sdk-ui/tree/master/example)
- **Sandbox** : Utiliser le token sandbox pour tester

---

## ✅ Checklist de Mise en Place

### Prérequis
- [ ] Compte Onfido créé et vérifié
- [ ] API Token et Webhook Token obtenus
- [ ] Variables d'environnement configurées (local et Supabase)
- [ ] Webhook configuré dans Onfido

### Backend
- [ ] Edge Function `create-onfido-sdk-token` créée
- [ ] Edge Function `onfido-webhook` créée
- [ ] Edge Functions déployées
- [ ] Edge Functions testées

### Frontend
- [ ] SDK Onfido installé
- [ ] Composant `OnfidoVerification` créé
- [ ] Page `VerifyIdentity` créée (optionnel)
- [ ] Intégration dans le flux d'inscription

### Base de Données
- [ ] Migration créée pour colonnes Onfido
- [ ] Migration appliquée
- [ ] Index créés
- [ ] Données testées

### Webhooks
- [ ] Webhook configuré dans Onfido
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

L'intégration de **Onfido** dans Aurora Society permet de :

1. ✅ **Vérifier l'authenticité** des documents d'identité de manière sécurisée
2. ✅ **Détecter les fraudes** automatiquement
3. ✅ **Respecter les réglementations** KYC/AML
4. ✅ **Protéger la plateforme** contre la fraude
5. ✅ **Maintenir la confiance** des membres

**Coût estimé** : ~125€/mois pour 50-100 nouveaux membres  
**Temps d'implémentation** : 10-15 jours  
**ROI** : Amélioration de la sécurité et conformité réglementaire

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0.0  
**Solution** : Onfido API

