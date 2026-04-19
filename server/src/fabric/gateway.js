'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

const CHANNEL_NAME = process.env.FABRIC_CHANNEL_NAME || 'mychannel';
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE_NAME || 'educert';
const ORG1_MSP = 'Org1MSP';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'adminpw';
const APP_USER = 'appUser';

let gateway = null;
let network = null;
let contract = null;
let wallet = null;

// ─── Load Connection Profile ───────────────────────────────────────────────
function loadCCP() {
  const ccpPath = process.env.CCP_PATH || path.resolve(
    __dirname, '..', '..', '..', 'fabric-samples', 'test-network',
    'organizations', 'peerOrganizations', 'org1.example.com',
    'connection-org1.json'
  );
  if (!fs.existsSync(ccpPath)) {
    throw new Error(`Connection profile not found at: ${ccpPath}\nHãy chạy ./network.sh up trước`);
  }
  const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
  return JSON.parse(ccpJSON);
}

// ─── Enroll Admin ─────────────────────────────────────────────────────────
async function enrollAdmin(ccp) {
  const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

  const adminIdentity = await wallet.get(ADMIN_USER);
  if (adminIdentity) {
    console.log('[Fabric] Admin already enrolled in wallet');
    return;
  }

  const enrollment = await ca.enroll({ enrollmentID: ADMIN_USER, enrollmentSecret: ADMIN_PASS });
  const x509Identity = {
    credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
    mspId: ORG1_MSP,
    type: 'X.509',
  };
  await wallet.put(ADMIN_USER, x509Identity);
  console.log('[Fabric] Admin enrolled and stored in wallet');
}

// ─── Register & Enroll App User ───────────────────────────────────────────
async function enrollAppUser(ccp) {
  const userIdentity = await wallet.get(APP_USER);
  if (userIdentity) {
    console.log('[Fabric] appUser already enrolled in wallet');
    return;
  }

  const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

  const adminIdentity = await wallet.get(ADMIN_USER);
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, ADMIN_USER);

  const secret = await ca.register({
    affiliation: 'org1.department1',
    enrollmentID: APP_USER,
    role: 'client',
  }, adminUser);

  const enrollment = await ca.enroll({ enrollmentID: APP_USER, enrollmentSecret: secret });
  const x509Identity = {
    credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
    mspId: ORG1_MSP,
    type: 'X.509',
  };
  await wallet.put(APP_USER, x509Identity);
  console.log('[Fabric] appUser registered and enrolled in wallet');
}

// ─── Connect Gateway ──────────────────────────────────────────────────────
async function connectFabric() {
  const walletPath = process.env.WALLET_PATH || path.join(__dirname, '..', '..', 'wallet');
  wallet = await Wallets.newFileSystemWallet(walletPath);

  const ccp = loadCCP();
  await enrollAdmin(ccp);
  await enrollAppUser(ccp);

  gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: APP_USER,
    discovery: { enabled: true, asLocalhost: process.env.AS_LOCALHOST !== 'false' },
  });

  network = await gateway.getNetwork(CHANNEL_NAME);
  contract = network.getContract(CHAINCODE_NAME);

  console.log(`[Fabric] Connected to channel "${CHANNEL_NAME}", chaincode "${CHAINCODE_NAME}"`);
}

// ─── Get Contract (singleton) ─────────────────────────────────────────────
function getContract() {
  if (!contract) throw new Error('Fabric chưa kết nối. Vui lòng đảm bảo Fabric network đang chạy.');
  return contract;
}

function getNetwork() {
  if (!network) throw new Error('Fabric network chưa sẵn sàng.');
  return network;
}

function isFabricConnected() {
  return contract !== null && network !== null;
}

async function disconnectFabric() {
  if (gateway) gateway.disconnect();
  gateway = null; network = null; contract = null;
}

module.exports = { connectFabric, getContract, getNetwork, isFabricConnected, disconnectFabric };
