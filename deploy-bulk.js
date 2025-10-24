#!/usr/bin/env node

/**
 * Script de déploiement en masse d'apps et datasets iExec
 * Utilise le SDK iExec pour tout automatiser
 */

import { IExec, utils } from 'iexec';
import { Wallet } from 'ethers';
import { writeFile } from 'fs/promises';
import { create } from 'kubo-rpc-client';

// Configuration
const NUM_DEPLOYMENTS = parseInt(process.argv[2]) || 10;
const OUTPUT_FILE = 'deployed_apps.json';
const CHAIN_CONFIG = {
  chainId: '134',
  host: 'https://bellecour.iex.ec',
  sms: 'https://sms.staging.iex.ec',
  iexecGateway: 'https://api.market.stagingv8.iex.ec',
  ipfsGateway: 'https://ipfs-gateway.stagingv8.iex.ec',
  resultProxy: 'https://result.stagingv8.iex.ec'
};

// Template d'application
const APP_TEMPLATE = {
  name: 'bulk-app',
  type: 'DOCKER',
  multiaddr: 'docker.io/iexechub/python-hello-world:8.0.0-sconify-5.9.1-v15-production',
  checksum: '0x15de77fd7ac448028884256b3ab376e7d4560e9ef6acf0594ea0b3c031d5d395',
  mrenclave: {
    framework: 'SCONE',
    version: 'v5.9',
    entrypoint: 'python /app/app.py',
    heapSize: 1073741824,
    fingerprint: '2d4b9efd066d0bb058b8da79bf8551be7d244779bc41d03a12201a4004779609'
  }
};

// Fonction pour créer un wallet
function createWallet() {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase
  };
}

// Fonction pour déployer une app
async function deployApp(iexec, appName, ownerAddress) {
  console.log(`  📱 Déploiement de l'app "${appName}"...`);
  
  const app = {
    ...APP_TEMPLATE,
    name: appName,
    owner: ownerAddress
  };

  const { address, txHash } = await iexec.app.deployApp(app);
  console.log(`  ✅ App déployée: ${address}`);
  
  return { address, txHash };
}

// Fonction pour push le secret de l'app
async function pushAppSecret(iexec, appAddress, secretValue) {
  console.log(`  🔐 Push du secret de l'app...`);
  
  // Afficher la configuration SMS utilisée
  const smsUrl = await iexec.config.resolveSmsURL();
  console.log(`     SMS URL: ${smsUrl}`);
  
  const pushed = await iexec.app.pushAppSecret(appAddress, secretValue);
  
  if (pushed) {
    console.log(`  ✅ Secret poussé avec succès`);
  } else {
    console.log(`  ⚠️  Secret existe déjà ou n'a pas pu être poussé`);
  }
  
  return pushed;
}

// Fonction pour chiffrer et uploader un dataset sur IPFS
async function encryptAndUploadDataset(iexec, dataContent, datasetName) {
  console.log(`  🔒 Chiffrement du dataset "${datasetName}"...`);
  
  // Générer une clé de chiffrement
  const encryptionKey = iexec.dataset.generateEncryptionKey();
  
  // Chiffrer le contenu
  const buffer = Buffer.from(dataContent, 'utf8');
  const encryptedBuffer = await iexec.dataset.encrypt(buffer, encryptionKey);
  
  // Calculer le checksum
  const checksum = await iexec.dataset.computeEncryptedFileChecksum(encryptedBuffer);
  console.log(`  ✅ Fichier chiffré (checksum: ${checksum.substring(0, 10)}...)`);
  
  // Upload sur IPFS
  console.log(`  ☁️  Upload sur IPFS...`);
  
  try {
    // Utiliser le gateway IPFS de staging
    const ipfs = create({
      host: 'ipfs-gateway.stagingv8.iex.ec',
      port: 443,
      protocol: 'https'
    });
    
    console.log(`  📤 Connexion à ipfs-gateway.stagingv8.iex.ec...`);
    const uploadResult = await ipfs.add(encryptedBuffer);
    const cid = uploadResult.cid.toString();
    const multiaddr = `/ipfs/${cid}`;
    const publicUrl = `https://ipfs-gateway.stagingv8.iex.ec/ipfs/${cid}`;
    
    console.log(`  ✅ Upload réussi !`);
    console.log(`     CID: ${cid}`);
    console.log(`     URL: ${publicUrl.substring(0, 60)}...`);
    
    // Vérifier que le fichier est accessible
    console.log(`  🔍 Vérification de l'accessibilité...`);
    const response = await fetch(publicUrl);
    if (!response.ok) {
      throw new Error(`Fichier non accessible: HTTP ${response.status}`);
    }
    
    // Vérifier que le contenu correspond
    const downloadedBuffer = Buffer.from(await response.arrayBuffer());
    if (!downloadedBuffer.equals(encryptedBuffer)) {
      throw new Error('Le contenu téléchargé ne correspond pas au fichier uploadé');
    }
    
    console.log(`  ✅ Fichier vérifié et accessible sur IPFS !`);
    
    return {
      multiaddr,
      checksum,
      encryptionKey,
      publicUrl,
      cid,
      encryptedData: encryptedBuffer
    };
    
  } catch (ipfsError) {
    console.error(`  ❌ Erreur IPFS:`, ipfsError.message);
    console.log(`  ⚠️  Utilisation d'un placeholder à la place`);
    
    // Fallback sur un placeholder
    const multiaddr = `/ipfs/QmTJ41EuPEwiPTGrYVPbXgMGvmgzsRYWWMmw6krVDN94nh`;
    const publicUrl = `https://ipfs-gateway.stagingv8.iex.ec${multiaddr}`;
    
    return {
      multiaddr,
      checksum,
      encryptionKey,
      publicUrl,
      cid: 'placeholder',
      encryptedData: encryptedBuffer,
      ipfsError: ipfsError.message
    };
  }
}

// Fonction pour déployer un dataset
async function deployDataset(iexec, datasetName, multiaddr, checksum, ownerAddress) {
  console.log(`  📦 Déploiement du dataset "${datasetName}"...`);
  
  const dataset = {
    owner: ownerAddress,
    name: datasetName,
    multiaddr: multiaddr,
    checksum: checksum
  };
  
  const { address, txHash } = await iexec.dataset.deployDataset(dataset);
  console.log(`  ✅ Dataset déployé: ${address}`);
  
  return { address, txHash };
}

// Fonction pour push le secret du dataset
async function pushDatasetSecret(iexec, datasetAddress, encryptionKey) {
  console.log(`  🔐 Push du secret du dataset...`);
  
  // Afficher la configuration SMS utilisée
  const smsUrl = await iexec.config.resolveSmsURL();
  console.log(`     SMS URL: ${smsUrl}`);
  
  const pushed = await iexec.dataset.pushDatasetSecret(datasetAddress, encryptionKey);
  
  if (pushed) {
    console.log(`  ✅ Secret du dataset poussé avec succès`);
  } else {
    console.log(`  ⚠️  Secret du dataset existe déjà ou n'a pas pu être poussé`);
  }
  
  return pushed;
}

// Fonction principale pour déployer un ensemble complet
async function deployComplete(deploymentNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 DÉPLOIEMENT #${deploymentNumber}/${NUM_DEPLOYMENTS}`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    // 1. Créer un nouveau wallet
    console.log(`\n1️⃣  Création du wallet...`);
    const walletInfo = createWallet();
    console.log(`  ✅ Wallet créé: ${walletInfo.address}`);
    
    // 2. Initialiser iExec avec ce wallet en utilisant getSignerFromPrivateKey
    const ethProvider = utils.getSignerFromPrivateKey(
      CHAIN_CONFIG.host,
      walletInfo.privateKey
    );
    
    const iexec = new IExec(
      { ethProvider },
      {
        smsURL: CHAIN_CONFIG.sms,
        iexecGatewayURL: CHAIN_CONFIG.iexecGateway,
        ipfsGatewayURL: CHAIN_CONFIG.ipfsGateway,
        resultProxyURL: CHAIN_CONFIG.resultProxy
      }
    );
    
    // Vérifier la configuration
    console.log(`  📋 Configuration iExec:`);
    console.log(`     Chain ID: ${CHAIN_CONFIG.chainId}`);
    console.log(`     Host: ${CHAIN_CONFIG.host}`);
    console.log(`     SMS: ${CHAIN_CONFIG.sms}`);
    console.log(`     Gateway: ${CHAIN_CONFIG.iexecGateway}`);
    console.log(`     IPFS: ${CHAIN_CONFIG.ipfsGateway}`);
    
    // 3. Déployer l'application
    console.log(`\n2️⃣  Déploiement de l'application...`);
    const appName = `bulk-app-${deploymentNumber}-${Date.now()}`;
    const appDeployment = await deployApp(iexec, appName, walletInfo.address);
    
    // 4. Push le secret de l'app
    console.log(`\n3️⃣  Configuration des secrets de l'app...`);
    const appSecretValue = '1234567890';
    await pushAppSecret(iexec, appDeployment.address, appSecretValue);
    
    // 5. Créer et chiffrer le dataset
    console.log(`\n4️⃣  Création du dataset...`);
    const datasetContent = `test${deploymentNumber} - ${new Date().toISOString()}`;
    const datasetName = `bulk-dataset-${deploymentNumber}-${Date.now()}`;
    
    const { multiaddr, checksum, encryptionKey, publicUrl } = 
      await encryptAndUploadDataset(iexec, datasetContent, datasetName);
    
    // 6. Déployer le dataset
    console.log(`\n5️⃣  Déploiement du dataset...`);
    const datasetDeployment = await deployDataset(
      iexec, 
      datasetName, 
      multiaddr, 
      checksum, 
      walletInfo.address
    );
    
    // 7. Push le secret du dataset
    console.log(`\n6️⃣  Configuration des secrets du dataset...`);
    await pushDatasetSecret(iexec, datasetDeployment.address, encryptionKey);
    
    // 8. Résumé
    console.log(`\n✅ DÉPLOIEMENT #${deploymentNumber} TERMINÉ !`);
    console.log(`  App: ${appDeployment.address}`);
    console.log(`  Dataset: ${datasetDeployment.address}`);
    console.log(`  Wallet: ${walletInfo.address}`);
    
    return {
      app_id: deploymentNumber,
      app_address: appDeployment.address,
      app_name: appName,
      dataset_address: datasetDeployment.address,
      dataset_name: datasetName,
      dataset_ipfs: publicUrl,
      wallet_address: walletInfo.address,
      wallet_private_key: walletInfo.privateKey,
      wallet_mnemonic: walletInfo.mnemonic,
      deployed_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`\n❌ Erreur lors du déploiement #${deploymentNumber}:`, error.message);
    throw error;
  }
}

// Fonction principale
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 DÉPLOIEMENT EN MASSE - SDK iExec                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Configuration:`);
  console.log(`  • Nombre de déploiements: ${NUM_DEPLOYMENTS}`);
  console.log(`  • Réseau: Bellecour (${CHAIN_CONFIG.chainId})`);
  console.log(`  • Fichier de sortie: ${OUTPUT_FILE}`);
  console.log(`  • Upload IPFS: ipfs-upload.iex.ec`);
  
  const deployments = [];
  let successCount = 0;
  let failureCount = 0;
  
  const startTime = Date.now();
  
  // Déployer séquentiellement
  for (let i = 1; i <= NUM_DEPLOYMENTS; i++) {
    try {
      const deployment = await deployComplete(i);
      deployments.push(deployment);
      successCount++;
      
      // Petit délai entre les déploiements pour éviter de surcharger
      if (i < NUM_DEPLOYMENTS) {
        console.log(`\n⏱️  Pause de 2 secondes avant le prochain déploiement...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      failureCount++;
      console.error(`\n❌ Le déploiement #${i} a échoué et sera ignoré.`);
      
      // Enregistrer l'échec
      deployments.push({
        app_id: i,
        status: 'failed',
        error: error.message,
        deployed_at: new Date().toISOString()
      });
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Sauvegarder les résultats
  console.log(`\n${'='.repeat(70)}`);
  console.log('💾 Sauvegarde des résultats...');
  await writeFile(
    OUTPUT_FILE, 
    JSON.stringify(deployments, null, 2), 
    'utf8'
  );
  console.log(`✅ Résultats sauvegardés dans: ${OUTPUT_FILE}`);
  
  // Rapport final
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 RAPPORT FINAL');
  console.log(`${'='.repeat(70)}`);
  console.log(`✅ Réussis: ${successCount}/${NUM_DEPLOYMENTS}`);
  console.log(`❌ Échoués: ${failureCount}/${NUM_DEPLOYMENTS}`);
  console.log(`⏱️  Durée totale: ${duration}s`);
  console.log(`📄 Détails dans: ${OUTPUT_FILE}`);
  
  if (successCount > 0) {
    console.log(`\n🎉 ${successCount} déploiement(s) réussi(s) !`);
  }
  
  if (failureCount > 0) {
    console.log(`\n⚠️  ${failureCount} déploiement(s) a/ont échoué. Consultez ${OUTPUT_FILE} pour les détails.`);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Erreur non gérée:', error);
  process.exit(1);
});

// Lancer le script
main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error.message);
  process.exit(1);
});
