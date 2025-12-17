# Dossier Sécurité - Aurora Society

**Version** : 1.0.0  
**Date** : Décembre 2024

---

## 📋 Présentation

Ce dossier contient toute la documentation relative à la sécurité de l'application Aurora Society, incluant l'intégration d'Onfido pour la vérification d'identité, Capacitor pour les applications mobiles, et l'authentification biométrique.

---

## 📚 Documents Disponibles

### 1. [Plan Général de Sécurité](./00-PLAN_GENERAL_SECURITE.md)

**Vue d'ensemble** : Document maître présentant le plan complet de sécurisation de l'application.

**Contenu** :
- Vue d'ensemble de l'architecture de sécurité
- Objectifs de sécurité
- Plan d'implémentation global (12 semaines)
- Ordre de priorité
- Checklist de sécurité

**À lire en premier** : Ce document donne une vue d'ensemble de toute la stratégie de sécurité.

---

### 2. [Intégration Onfido API](./01-ONFIDO_INTEGRATION.md)

**Vue d'ensemble** : Guide complet pour intégrer Onfido pour la vérification d'identité et l'authentification des documents (CNI, passeports, permis de conduire).

**Contenu** :
- Configuration initiale Onfido
- Intégration backend (Supabase Edge Functions)
- Intégration frontend (React)
- Webhooks et notifications
- Migration base de données
- Plan d'implémentation (10-15 jours)
- Coûts et budget (~125€/mois)

**Temps d'implémentation** : 10-15 jours  
**Priorité** : Critique (Priorité 1)

---

### 3. [Capacitor iOS/Android](./02-CAPACITOR_MOBILE.md)

**Vue d'ensemble** : Guide complet pour transformer l'application web en applications mobiles natives pour iOS et Android.

**Contenu** :
- Installation et configuration Capacitor
- Configuration iOS (Xcode, permissions, build)
- Configuration Android (Android Studio, permissions, build)
- Plugins Capacitor essentiels
- Build et publication (App Store / Google Play)
- Plan d'implémentation (5 semaines)

**Temps d'implémentation** : 5 semaines  
**Priorité** : Important (Priorité 2)

---

### 4. [Authentification Biométrique](./03-BIOMETRIE_AUTH.md)

**Vue d'ensemble** : Guide pour implémenter l'authentification biométrique (Face ID, Touch ID, empreinte digitale) sur iOS et Android.

**Contenu** :
- Architecture biométrique
- Implémentation iOS (Face ID / Touch ID)
- Implémentation Android (Fingerprint)
- Service biométrique
- Stockage sécurisé (Keychain / Keystore)
- Intégration dans l'application
- Plan d'implémentation (7 jours)

**Temps d'implémentation** : 7 jours  
**Priorité** : Amélioration (Priorité 3)  
**Dépendances** : Capacitor doit être installé

---

### 5. [Guide de Sécurité](./04-GUIDE_SECURITE.md)

**Vue d'ensemble** : Bonnes pratiques de sécurité et conformité pour Aurora Society.

**Contenu** :
- Sécurité des données (chiffrement, stockage)
- Sécurité de l'authentification (MFA, biométrie, sessions)
- Sécurité des API (Edge Functions, rate limiting)
- Sécurité mobile (iOS/Android)
- Conformité (RGPD, KYC/AML, PCI DSS)
- Audit et monitoring
- Checklist de sécurité complète

**À consulter régulièrement** : Ce document doit être consulté régulièrement pour maintenir la sécurité de l'application.

---

## 🗺️ Parcours de Lecture Recommandé

### Pour Commencer

1. **Lire d'abord** : [Plan Général de Sécurité](./00-PLAN_GENERAL_SECURITE.md)
   - Comprendre la vision globale
   - Voir le plan d'implémentation

### Pour Implémenter

2. **Intégrer Onfido** : [Intégration Onfido API](./01-ONFIDO_INTEGRATION.md)
   - Priorité 1 : Critique
   - Nécessaire pour la vérification des membres

3. **Intégrer Capacitor** : [Capacitor iOS/Android](./02-CAPACITOR_MOBILE.md)
   - Priorité 2 : Important
   - Base pour les applications mobiles

4. **Intégrer Biométrie** : [Authentification Biométrique](./03-BIOMETRIE_AUTH.md)
   - Priorité 3 : Amélioration
   - Nécessite Capacitor

5. **Consulter régulièrement** : [Guide de Sécurité](./04-GUIDE_SECURITE.md)
   - Bonnes pratiques
   - Checklist de sécurité

---

## 📅 Timeline Global

```
Semaines 1-3  : Intégration Onfido
Semaines 4-7  : Intégration Capacitor iOS/Android
Semaines 8-10 : Intégration Biométrie
Semaines 11-12: Tests et Documentation

Total : 12 semaines (3 mois)
```

---

## 🎯 Objectifs de Sécurité

1. ✅ **Vérification d'identité** : Via Onfido pour tous les membres
2. ✅ **Applications mobiles** : iOS et Android natives via Capacitor
3. ✅ **Authentification biométrique** : Face ID / Touch ID / Fingerprint
4. ✅ **Conformité** : RGPD, KYC/AML
5. ✅ **Sécurité renforcée** : Chiffrement, stockage sécurisé, authentification

---

## 💰 Budget Estimé

- **Onfido** : ~125€/mois (50-100 vérifications)
- **Capacitor** : Gratuit (open source)
- **Biométrie** : Gratuit (APIs natives)
- **Développement** : 12 semaines (selon tarifs équipe)

---

## ✅ Checklist Globale

### Phase 1 : Onfido (Semaines 1-3)
- [ ] Compte Onfido créé
- [ ] Edge Functions créées et déployées
- [ ] Frontend intégré
- [ ] Webhooks configurés
- [ ] Tests effectués

### Phase 2 : Capacitor (Semaines 4-7)
- [ ] Capacitor installé et configuré
- [ ] iOS configuré et testé
- [ ] Android configuré et testé
- [ ] Plugins installés
- [ ] Apps publiées sur App Store / Google Play

### Phase 3 : Biométrie (Semaines 8-10)
- [ ] Service biométrique créé
- [ ] Face ID/Touch ID implémenté (iOS)
- [ ] Fingerprint implémenté (Android)
- [ ] Stockage sécurisé configuré
- [ ] Tests effectués

### Phase 4 : Sécurité (Semaines 11-12)
- [ ] Audit de sécurité effectué
- [ ] Checklist de sécurité complétée
- [ ] Documentation complète
- [ ] Formation équipe

---

## 📞 Support

Pour toute question concernant la sécurité :

1. **Consulter la documentation** dans ce dossier
2. **Vérifier les guides** spécifiques selon le besoin
3. **Consulter l'équipe** de développement pour questions techniques
4. **Contacter les services** (Onfido, Capacitor) pour support externe

---

## 🔄 Mises à Jour

Ce dossier sera mis à jour régulièrement pour refléter :

- ✅ Les évolutions des technologies
- ✅ Les nouvelles vulnérabilités découvertes
- ✅ Les améliorations de sécurité
- ✅ Les changements de conformité

**Dernière mise à jour** : Décembre 2024

---

## 📚 Ressources Externes

- **Onfido** : [documentation.onfido.com](https://documentation.onfido.com)
- **Capacitor** : [capacitorjs.com/docs](https://capacitorjs.com/docs)
- **Supabase Security** : [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **OWASP** : [owasp.org](https://owasp.org)
- **CNIL (RGPD)** : [cnil.fr](https://www.cnil.fr)

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0.0  
**Maintenu par** : Équipe de développement Aurora Society

