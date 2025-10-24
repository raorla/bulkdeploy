# 🚀 Déploiement en Masse - SDK iExec

Script automatisé pour déployer plusieurs applications et datasets iExec en une seule commande.

## ✨ Fonctionnalités

Pour chaque déploiement, le script :

1. ✅ Crée un **nouveau wallet** (address + private key + mnemonic)
2. ✅ Déploie une **application iExec**
3. ✅ Push le **secret de l'application**
4. ✅ Crée et **chiffre un dataset**
5. ✅ **Upload automatique sur IPFS** (ipfs-upload.iex.ec)
6. ✅ Déploie le **dataset sur la blockchain**
7. ✅ Push le **secret du dataset**
8. ✅ Sauvegarde toutes les informations dans un fichier JSON

## 📦 Installation

```bash
cd bulk-deployment
npm install
```

Dépendances :

- `iexec`: SDK officiel iExec
- `kubo-rpc-client`: Client IPFS
- `ethers`: Pour la création de wallets

## 🎯 Utilisation

### Déployer 10 apps/datasets (par défaut)

```bash
npm run deploy
# ou
node deploy-bulk.js
```

### Déployer 5 apps/datasets

```bash
npm run deploy:5
# ou
node deploy-bulk.js 5
```

### Déployer 20 apps/datasets

```bash
npm run deploy:20
# ou
node deploy-bulk.js 20
```

### Nombre personnalisé

```bash
node deploy-bulk.js 50
```

## 📊 Exemple de sortie

```
╔═══════════════════════════════════════════════════════════════════╗
║     🚀 DÉPLOIEMENT EN MASSE - SDK iExec                          ║
╚═══════════════════════════════════════════════════════════════════╝

📊 Configuration:
  • Nombre de déploiements: 10
  • Réseau: Bellecour (134)
  • Fichier de sortie: deployed_apps.json
  • Upload IPFS: ipfs-upload.iex.ec

======================================================================
🚀 DÉPLOIEMENT #1/10
======================================================================

1️⃣  Création du wallet...
  ✅ Wallet créé: 0x1234...

2️⃣  Déploiement de l'application...
  📱 Déploiement de l'app "bulk-app-1-1729756800000"...
  ✅ App déployée: 0xabcd...

3️⃣  Configuration des secrets de l'app...
  🔐 Push du secret de l'app...
  ✅ Secret poussé avec succès

4️⃣  Création du dataset...
  🔒 Chiffrement du dataset "bulk-dataset-1-1729756800000"...
  ✅ Fichier chiffré (checksum: 0xf7a8...)
  ☁️  Upload sur IPFS...
  ✅ Upload réussi: https://ipfs.iex.ec/ipfs/QmXYZ...

5️⃣  Déploiement du dataset...
  📦 Déploiement du dataset "bulk-dataset-1-1729756800000"...
  ✅ Dataset déployé: 0x5678...

6️⃣  Configuration des secrets du dataset...
  🔐 Push du secret du dataset...
  ✅ Secret du dataset poussé avec succès

✅ DÉPLOIEMENT #1 TERMINÉ !
  App: 0xabcd...
  Dataset: 0x5678...
  Wallet: 0x1234...

⏱️  Pause de 2 secondes avant le prochain déploiement...

[... continue pour les 9 autres déploiements ...]

======================================================================
💾 Sauvegarde des résultats...
✅ Résultats sauvegardés dans: deployed_apps.json

======================================================================
📊 RAPPORT FINAL
======================================================================
✅ Réussis: 10/10
❌ Échoués: 0/10
⏱️  Durée totale: 245.67s
📄 Détails dans: deployed_apps.json

🎉 10 déploiement(s) réussi(s) !
```

## 📄 Format du fichier JSON de sortie

Le fichier `deployed_apps.json` contient :

```json
[
  {
    "app_id": 1,
    "app_address": "0xabcd1234...",
    "app_name": "bulk-app-1-1729756800000",
    "dataset_address": "0x5678efgh...",
    "dataset_name": "bulk-dataset-1-1729756800000",
    "dataset_ipfs": "https://ipfs.iex.ec/ipfs/QmXYZ...",
    "wallet_address": "0x1234abcd...",
    "wallet_private_key": "0xprivatekey...",
    "wallet_mnemonic": "word1 word2 word3 ...",
    "deployed_at": "2024-10-24T10:30:00.000Z"
  },
  {
    "app_id": 2,
    "app_address": "0xijkl5678...",
    ...
  }
]
```

## 🔧 Configuration

### Modifier le nombre de déploiements par défaut

Dans `deploy-bulk.js` :

```javascript
const NUM_DEPLOYMENTS = parseInt(process.argv[2]) || 10; // Changez 10
```

### Changer le réseau

Dans `deploy-bulk.js` :

```javascript
const CHAIN_CONFIG = {
  chainId: "134", // Bellecour
  host: "https://bellecour.iex.ec",
  sms: "https://sms.scone-prod.v8-bellecour.iex.ec",
};
```

### Modifier le template d'application

Dans `deploy-bulk.js` :

```javascript
const APP_TEMPLATE = {
  name: "bulk-app",
  type: "DOCKER",
  multiaddr: "registry.hub.docker.com/iexechub/python-hello-world:1.0.0",
  // ... modifiez selon vos besoins
};
```

### Changer le secret de l'app

Dans la fonction `deployComplete()` :

```javascript
const appSecretValue = "1234567890"; // Changez la valeur
```

## 🆚 Comparaison avec la méthode Bash

### Ancienne méthode (Bash + CLI)

```bash
# Script bash complexe
# Gestion manuelle de wallet.json, iexec.json
# Parsing JSON avec jq
# Nettoyage manuel des fichiers
# Upload manuel sur GitHub/IPFS
```

**Inconvénients** :

- ❌ Dépendance à `jq` et autres outils système
- ❌ Gestion complexe des fichiers temporaires
- ❌ Upload manuel des datasets
- ❌ Difficile à debugger

### Nouvelle méthode (Node.js + SDK)

```bash
npm run deploy
```

**Avantages** :

- ✅ Tout en JavaScript/Node.js
- ✅ SDK iExec officiel
- ✅ Upload IPFS automatique
- ✅ Pas de fichiers temporaires
- ✅ Gestion d'erreurs robuste
- ✅ Wallets créés programmatiquement
- ✅ JSON natif (pas besoin de jq)

## ⚡ Performance

- **Durée moyenne** : ~20-30 secondes par déploiement
- **Pause entre déploiements** : 2 secondes (pour éviter de surcharger)
- **Gestion des échecs** : Continue même si un déploiement échoue

## 🔒 Sécurité

⚠️ **IMPORTANT** :

- Les **private keys** et **mnemonics** sont sauvegardés dans `deployed_apps.json`
- **Protégez ce fichier** ! Ne le commitez JAMAIS dans Git
- Ajoutez `deployed_apps.json` dans `.gitignore`

```bash
echo "deployed_apps.json" >> .gitignore
```

## 🐛 Dépannage

### Erreur : "Module not found"

```bash
npm install
```

### Erreur : "IPFS upload failed"

```bash
# Vérifiez votre connexion
ping ipfs-upload.iex.ec

# Essayez avec moins de déploiements
node deploy-bulk.js 1
```

### Erreur : "Missing Signer"

Le script crée automatiquement des wallets, pas besoin de configuration préalable.

### Déploiements lents

- C'est normal, chaque déploiement nécessite plusieurs transactions blockchain
- Ajustez la pause entre déploiements si nécessaire

## 📚 Structure du projet

```
bulk-deployment/
├── package.json           # Configuration npm
├── chain.json            # Configuration réseau Bellecour
├── app-template.json     # Template d'application
├── deploy-bulk.js        # Script principal
├── README.md             # Cette documentation
└── deployed_apps.json    # Résultats (généré)
```

## 🎓 Cas d'usage

### Test de charge

```bash
# Déployer 50 apps pour tester la scalabilité
node deploy-bulk.js 50
```

### Environnement de développement

```bash
# Créer 5 apps de test rapidement
npm run deploy:5
```

### Production

```bash
# Déployer plusieurs instances d'une même app
node deploy-bulk.js 20
```

## 📊 Statistiques

Chaque déploiement inclut :

- 2 transactions blockchain (app + dataset)
- 1 upload IPFS
- 2 push de secrets (app + dataset)
- 1 création de wallet

**Total pour 10 déploiements** :

- 20 transactions blockchain
- 10 uploads IPFS
- 20 secrets poussés
- 10 wallets créés

## 🎉 Avantages clés

1. ✅ **100% automatique** - Zéro intervention manuelle
2. ✅ **IPFS intégré** - Upload direct vers l'infrastructure iExec
3. ✅ **Wallets uniques** - Chaque déploiement a son propre wallet
4. ✅ **Traçabilité complète** - Toutes les infos dans un JSON
5. ✅ **Gestion d'erreurs** - Continue même en cas d'échec
6. ✅ **Production-ready** - Basé sur le SDK officiel

---

**Créé avec ❤️ pour automatiser les déploiements iExec**
