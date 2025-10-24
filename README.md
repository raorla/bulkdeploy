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

