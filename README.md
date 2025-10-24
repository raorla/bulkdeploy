## 📦 Installation

```bash
cd bulk-deployment
npm install
```

Dépendances :

- `iexec`: SDK officiel iExec
- `kubo-rpc-client`: Client IPFS pour uploads réels
- `ethers`: Pour la création de wallets


### Secrets configurés automatiquement

- **App Secret**: `1234567890` (valeur fixe)
- **Dataset Secret**: Clé de chiffrement unique par dataset
- **Requester Secrets**:
  - `my-api-key`: `demo-api-key-12345`
  - `my-password`: `demo-password-67890`

Les requester secrets peuvent être utilisés dans les requestorders avec `iexec_secrets`.

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

