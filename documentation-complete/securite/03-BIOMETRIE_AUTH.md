# Authentification Biométrique - Face ID / Touch ID / Empreinte Digitale

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Biométrique](#architecture-biométrique)
3. [Installation et Configuration](#installation-et-configuration)
4. [Implémentation iOS (Face ID / Touch ID)](#implémentation-ios)
5. [Implémentation Android (Fingerprint)](#implémentation-android)
6. [Intégration dans l'Application](#intégration-dans-lapplication)
7. [Stockage Sécurisé](#stockage-sécurisé)
8. [Gestion des Erreurs](#gestion-des-erreurs)
9. [Plan d'Implémentation](#plan-dimplémentation)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Ce document explique comment implémenter l'authentification biométrique (Face ID, Touch ID, empreinte digitale) dans Aurora Society pour permettre une connexion rapide et sécurisée sans avoir à ressaisir le mot de passe.

### Fonctionnalités

- ✅ **Face ID** sur iOS (iPhone X et supérieur)
- ✅ **Touch ID** sur iOS (iPhone 5s à iPhone 8)
- ✅ **Empreinte digitale** sur Android
- ✅ **Déverrouillage rapide** de session
- ✅ **Stockage sécurisé** des tokens (Keychain iOS / Keystore Android)
- ✅ **Fallback** vers mot de passe en cas d'échec

### Avantages

- **Confort utilisateur** : Connexion en une seconde
- **Sécurité renforcée** : Biométrie + stockage sécurisé
- **Expérience native** : Utilisation des APIs natives de chaque plateforme
- **Conformité** : Respect des standards de sécurité

---

## 🏗️ Architecture Biométrique

### Flux d'Authentification

```
┌─────────────────────────────────────────────────────────┐
│              FLUX D'AUTHENTIFICATION BIOMÉTRIQUE        │
└─────────────────────────────────────────────────────────┘

1. PREMIÈRE CONNEXION
   ┌─────────┐
   │ Utilis. │───▶ Email/Password ───▶ Supabase Auth
   └─────────┘                                │
                                              ▼
                                    ┌─────────────────┐
                                    │  Token généré   │
                                    └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Stockage        │
                                    │ Sécurisé        │
                                    │ (Keychain/      │
                                    │  Keystore)      │
                                    └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Proposer        │
                                    │ Biométrie       │
                                    └─────────────────┘

2. CONNEXIONS ULTÉRIEURES
   ┌─────────┐
   │ Utilis. │───▶ Ouvrir App
   └─────────┘         │
                       ▼
            ┌──────────────────────┐
            │ Vérifier si biométrie│
            │ est activée          │
            └──────────────────────┘
                       │
                ┌──────┴──────┐
                │             │
                ▼             ▼
         ┌──────────┐  ┌──────────┐
         │ OUI      │  │ NON      │
         └──────────┘  └──────────┘
                │             │
                ▼             ▼
      ┌─────────────────┐  ┌────────────┐
      │ Demander        │  │ Login      │
      │ Biométrie       │  │ classique  │
      │ (Face ID/FP)    │  │            │
      └─────────────────┘  └────────────┘
                │
         ┌──────┴──────┐
         │             │
         ▼             ▼
    ┌────────┐   ┌────────┐
    │ SUCCÈS │   │ ÉCHEC  │
    └────────┘   └────────┘
         │             │
         ▼             ▼
   ┌──────────┐  ┌────────────┐
   │ Récupérer│  │ Fallback   │
   │ Token    │  │ vers login │
   │ Stockage │  │ classique  │
   └──────────┘  └────────────┘
         │
         ▼
   ┌──────────┐
   │ Connecter│
   │ Supabase │
   └──────────┘
```

---

## 📦 Installation et Configuration

### 1. Installer le Plugin Biométrique Capacitor

```bash
npm install @capacitor-community/biometric
```

### 2. Synchroniser avec les Plateformes

```bash
npx cap sync
```

### 3. Configuration iOS

#### Info.plist

Ajouter dans `ios/App/App/Info.plist` :

```xml
<key>NSFaceIDUsageDescription</key>
<string>Aurora Society utilise Face ID pour sécuriser votre compte et vous permettre de vous connecter rapidement.</string>
```

#### Capabilities dans Xcode

1. Ouvrir Xcode : `npx cap open ios`
2. Sélectionner le projet → Target "App"
3. Onglet **Signing & Capabilities**
4. Cliquer sur **"+ Capability"**
5. Ajouter **Keychain Sharing**

### 4. Configuration Android

#### AndroidManifest.xml

Ajouter dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

---

## 📱 Implémentation iOS

### 1. Créer le Service Biométrique

Créer `src/services/biometricService.ts` :

```typescript
import { Biometric } from '@capacitor-community/biometric';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export class BiometricService {
  /**
   * Vérifier si la biométrie est disponible sur l'appareil
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const result = await Biometric.checkBiometry();
      return result.isAvailable;
    } catch (error) {
      console.error('Error checking biometry:', error);
      return false;
    }
  }

  /**
   * Obtenir le type de biométrie disponible
   */
  static async getBiometryType(): Promise<'face' | 'fingerprint' | 'none'> {
    try {
      const result = await Biometric.checkBiometry();
      
      if (!result.isAvailable) {
        return 'none';
      }

      // Sur iOS, le type est 'face' ou 'fingerprint'
      // Sur Android, c'est généralement 'fingerprint'
      const biometryType = result.biometryType;
      
      if (biometryType === 'FaceID' || biometryType === 'Face') {
        return 'face';
      } else if (biometryType === 'TouchID' || biometryType === 'Fingerprint') {
        return 'fingerprint';
      }
      
      return 'none';
    } catch (error) {
      console.error('Error getting biometry type:', error);
      return 'none';
    }
  }

  /**
   * Vérifier si la biométrie est activée pour l'utilisateur
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: 'biometric_enabled' });
      return value === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled:', error);
      return false;
    }
  }

  /**
   * Activer la biométrie pour l'utilisateur actuel
   */
  static async enableBiometric(): Promise<BiometricAuthResult> {
    try {
      // Vérifier si la biométrie est disponible
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biométrie non disponible sur cet appareil',
        };
      }

      // Demander l'authentification biométrique
      const result = await Biometric.authenticate({
        reason: 'Activez l\'authentification biométrique pour vous connecter rapidement',
        title: 'Activer la biométrie',
        subtitle: 'Aurora Society',
        description: 'Utilisez Face ID ou Touch ID pour vous connecter rapidement et en toute sécurité',
        negativeButtonText: 'Annuler',
      });

      if (result.succeeded) {
        // Stocker le flag d'activation
        await Preferences.set({
          key: 'biometric_enabled',
          value: 'true',
        });

        // Stocker le token d'authentification de manière sécurisée
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await this.storeAuthToken(session.access_token, session.refresh_token);
        }

        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Authentification biométrique échouée',
        };
      }
    } catch (error: any) {
      console.error('Error enabling biometric:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'activation de la biométrie',
      };
    }
  }

  /**
   * Désactiver la biométrie
   */
  static async disableBiometric(): Promise<void> {
    await Preferences.set({
      key: 'biometric_enabled',
      value: 'false',
    });
    await this.clearAuthTokens();
  }

  /**
   * Authentifier avec biométrie (pour connexion)
   */
  static async authenticate(): Promise<BiometricAuthResult> {
    try {
      // Vérifier si la biométrie est activée
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biométrie non activée',
        };
      }

      // Demander l'authentification biométrique
      const biometryType = await this.getBiometryType();
      const reasonText = biometryType === 'face' 
        ? 'Utilisez Face ID pour vous connecter'
        : 'Utilisez votre empreinte digitale pour vous connecter';

      const result = await Biometric.authenticate({
        reason: reasonText,
        title: 'Connexion',
        subtitle: 'Aurora Society',
        description: 'Authentifiez-vous pour accéder à votre compte',
        negativeButtonText: 'Annuler',
      });

      if (result.succeeded) {
        // Récupérer les tokens stockés
        const tokens = await this.getAuthTokens();
        if (!tokens) {
          return {
            success: false,
            error: 'Aucun token trouvé. Veuillez vous reconnecter avec votre mot de passe.',
          };
        }

        // Restaurer la session Supabase
        const { error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        if (error) {
          // Si le token a expiré, nettoyer et demander reconnexion
          await this.clearAuthTokens();
          return {
            success: false,
            error: 'Session expirée. Veuillez vous reconnecter.',
          };
        }

        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Authentification biométrique échouée',
        };
      }
    } catch (error: any) {
      console.error('Error authenticating with biometric:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'authentification biométrique',
      };
    }
  }

  /**
   * Stocker les tokens d'authentification de manière sécurisée
   */
  private static async storeAuthToken(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Stocker dans le stockage sécurisé Capacitor (Keychain iOS / Keystore Android)
      await Preferences.set({
        key: 'auth_access_token',
        value: accessToken,
      });
      await Preferences.set({
        key: 'auth_refresh_token',
        value: refreshToken,
      });
    } catch (error) {
      console.error('Error storing auth tokens:', error);
      throw error;
    }
  }

  /**
   * Récupérer les tokens d'authentification
   */
  private static async getAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const accessTokenResult = await Preferences.get({ key: 'auth_access_token' });
      const refreshTokenResult = await Preferences.get({ key: 'auth_refresh_token' });

      if (!accessTokenResult.value || !refreshTokenResult.value) {
        return null;
      }

      return {
        accessToken: accessTokenResult.value,
        refreshToken: refreshTokenResult.value,
      };
    } catch (error) {
      console.error('Error getting auth tokens:', error);
      return null;
    }
  }

  /**
   * Supprimer les tokens stockés
   */
  private static async clearAuthTokens(): Promise<void> {
    try {
      await Preferences.remove({ key: 'auth_access_token' });
      await Preferences.remove({ key: 'auth_refresh_token' });
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }
}
```

---

## 🤖 Implémentation Android

Le service créé ci-dessus fonctionne également sur Android. Le plugin Capacitor gère automatiquement les différences entre iOS et Android.

### Configuration Additionnelle Android

Si nécessaire, vous pouvez personnaliser le message d'authentification Android :

```typescript
// Dans biometricService.ts, adapter le message selon la plateforme
import { Capacitor } from '@capacitor/core';

const getPlatformSpecificReason = async (): Promise<string> => {
  const biometryType = await BiometricService.getBiometryType();
  
  if (Capacitor.getPlatform() === 'android') {
    return 'Utilisez votre empreinte digitale pour vous connecter';
  } else {
    return biometryType === 'face' 
      ? 'Utilisez Face ID pour vous connecter'
      : 'Utilisez Touch ID pour vous connecter';
  }
};
```

---

## 🔗 Intégration dans l'Application

### 1. Créer le Composant d'Activation Biométrique

Créer `src/components/BiometricSetup.tsx` :

```typescript
import React, { useEffect, useState } from 'react';
import { BiometricService } from '@/services/biometricService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Fingerprint, FaceId } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const BiometricSetup: React.FC = () => {
  const { t } = useLanguage();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<'face' | 'fingerprint' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    setChecking(true);
    try {
      const available = await BiometricService.isAvailable();
      setIsAvailable(available);

      if (available) {
        const type = await BiometricService.getBiometryType();
        setBiometryType(type);
        
        const enabled = await BiometricService.isBiometricEnabled();
        setIsEnabled(enabled);
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await BiometricService.enableBiometric();
      
      if (result.success) {
        setIsEnabled(true);
        toast.success(t('biometricEnabled') || 'Authentification biométrique activée avec succès');
      } else {
        toast.error(result.error || t('biometricError') || 'Erreur lors de l\'activation');
      }
    } catch (error: any) {
      toast.error(error.message || t('biometricError') || 'Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await BiometricService.disableBiometric();
      setIsEnabled(false);
      toast.success(t('biometricDisabled') || 'Authentification biométrique désactivée');
    } catch (error: any) {
      toast.error(error.message || t('biometricError') || 'Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="ml-2">{t('loading') || 'Chargement...'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('biometricNotAvailable') || 'Biométrie non disponible'}</CardTitle>
          <CardDescription>
            {t('biometricNotAvailableDesc') || 'Votre appareil ne supporte pas l\'authentification biométrique.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const IconComponent = biometryType === 'face' ? FaceId : Fingerprint;
  const typeName = biometryType === 'face' 
    ? (t('faceId') || 'Face ID')
    : (t('touchId') || 'Touch ID / Empreinte digitale');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="w-5 h-5" />
          {t('biometricAuth') || 'Authentification biométrique'}
        </CardTitle>
        <CardDescription>
          {t('biometricDesc') || `Utilisez ${typeName} pour vous connecter rapidement et en toute sécurité.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span>{t('biometricEnabled') || 'Authentification biométrique activée'}</span>
            </div>
            <Button onClick={handleDisable} disabled={loading} variant="destructive" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('loading') || 'Chargement...'}
                </>
              ) : (
                t('disableBiometric') || 'Désactiver la biométrie'
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="w-5 h-5" />
              <span>{t('biometricDisabled') || 'Authentification biométrique désactivée'}</span>
            </div>
            <Button onClick={handleEnable} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('loading') || 'Chargement...'}
                </>
              ) : (
                t('enableBiometric') || `Activer ${typeName}`
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
```

### 2. Intégrer dans la Page de Connexion

Modifier `src/pages/Login.tsx` :

```typescript
import { useEffect } from 'react';
import { BiometricService } from '@/services/biometricService';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si on est sur mobile et si la biométrie est activée
    const checkBiometricOnLoad = async () => {
      const isMobile = Capacitor.isNativePlatform();
      
      if (isMobile) {
        const isEnabled = await BiometricService.isBiometricEnabled();
        
        if (isEnabled) {
          // Proposer l'authentification biométrique
          const result = await BiometricService.authenticate();
          
          if (result.success) {
            // Connexion réussie, rediriger
            navigate('/member-card');
          } else {
            // Afficher le formulaire de connexion normal
            console.log('Biometric auth failed or cancelled:', result.error);
          }
        }
      }
    };

    checkBiometricOnLoad();
  }, [navigate]);

  // ... reste du composant Login
};
```

### 3. Ajouter dans les Paramètres

Ajouter dans `src/pages/Settings.tsx` :

```typescript
import { BiometricSetup } from '@/components/BiometricSetup';

// Dans le composant Settings
<BiometricSetup />
```

---

## 🔐 Stockage Sécurisé

Le stockage des tokens utilise le stockage sécurisé natif de chaque plateforme :

- **iOS** : Keychain (chiffré par le système)
- **Android** : Keystore (chiffré par le système)

Le plugin `@capacitor/preferences` avec le mode sécurisé utilise automatiquement ces systèmes.

---

## ⚠️ Gestion des Erreurs

### Erreurs Communes

1. **Biométrie non disponible** : Afficher un message et proposer le login classique
2. **Authentification échouée** : Proposer de réessayer ou utiliser le mot de passe
3. **Token expiré** : Nettoyer les tokens et demander reconnexion
4. **Utilisateur annule** : Afficher le formulaire de connexion normal

### Gestion dans le Service

Le service `BiometricService` gère déjà ces cas et retourne des erreurs claires.

---

## 📋 Plan d'Implémentation

### Phase 1 : Installation et Configuration (1 jour)

- [ ] Installer `@capacitor-community/biometric`
- [ ] Configurer permissions iOS (Info.plist)
- [ ] Configurer permissions Android (AndroidManifest.xml)
- [ ] Synchroniser avec Capacitor

### Phase 2 : Service Biométrique (2 jours)

- [ ] Créer `BiometricService`
- [ ] Implémenter vérification disponibilité
- [ ] Implémenter activation/désactivation
- [ ] Implémenter authentification
- [ ] Implémenter stockage sécurisé

### Phase 3 : Interface Utilisateur (2 jours)

- [ ] Créer composant `BiometricSetup`
- [ ] Intégrer dans page Settings
- [ ] Intégrer dans page Login
- [ ] Ajouter traductions

### Phase 4 : Tests (2 jours)

- [ ] Tests sur iOS (Face ID, Touch ID)
- [ ] Tests sur Android (Fingerprint)
- [ ] Tests de gestion d'erreurs
- [ ] Tests de stockage sécurisé

**Total estimé** : 7 jours

---

## 🔍 Troubleshooting

### Problème : "Biométrie non disponible"

**Solution** :
- Vérifier que l'appareil supporte la biométrie
- Vérifier les permissions dans Info.plist / AndroidManifest.xml
- Vérifier que le plugin est bien synchronisé : `npx cap sync`

### Problème : "Authentification échouée"

**Solution** :
- Vérifier que la biométrie est bien configurée sur l'appareil
- Vérifier que les permissions sont accordées
- Vérifier les logs pour plus de détails

### Problème : "Token expiré"

**Solution** :
- C'est normal, nettoyer les tokens et demander reconnexion
- Implémenter un refresh token automatique si nécessaire

---

## 📚 Ressources

### Documentation

- **Capacitor Biometric** : [github.com/capacitor-community/biometric](https://github.com/capacitor-community/biometric)
- **Capacitor Preferences** : [capacitorjs.com/docs/apis/preferences](https://capacitorjs.com/docs/apis/preferences)

### Apple

- **LocalAuthentication** : [developer.apple.com/documentation/localauthentication](https://developer.apple.com/documentation/localauthentication)

### Android

- **BiometricPrompt** : [developer.android.com/reference/androidx/biometric/BiometricPrompt](https://developer.android.com/reference/androidx/biometric/BiometricPrompt)

---

## ✅ Checklist

- [ ] Plugin biométrique installé
- [ ] Permissions configurées (iOS/Android)
- [ ] Service biométrique créé
- [ ] Composant d'activation créé
- [ ] Intégré dans Login
- [ ] Intégré dans Settings
- [ ] Tests iOS effectués
- [ ] Tests Android effectués
- [ ] Gestion d'erreurs complète
- [ ] Traductions ajoutées

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0.0

