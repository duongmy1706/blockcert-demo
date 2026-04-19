// fabric.ts — Kết nối status panel với backend thật
// Gọi /api/fabric/status để lấy thông tin network

export interface FabricNetworkStatus {
  connected: boolean;
  channel: string;
  chaincode: string;
  version?: string;
  lastChecked: string;
  error?: string;
}

export interface DockerContainer {
  name: string;
  image: string;
  status: 'running' | 'stopped';
  port?: string;
  uptime: string;
}

// Các container cố định theo cấu hình Fabric test-network
export const EXPECTED_CONTAINERS: DockerContainer[] = [
  { name: 'peer0.org1.example.com', image: 'hyperledger/fabric-peer:2.2.0',    status: 'running', port: '7051', uptime: '-' },
  { name: 'peer0.org2.example.com', image: 'hyperledger/fabric-peer:2.2.0',    status: 'running', port: '9051', uptime: '-' },
  { name: 'orderer.example.com',    image: 'hyperledger/fabric-orderer:2.2.0', status: 'running', port: '7050', uptime: '-' },
  { name: 'ca_org1',                image: 'hyperledger/fabric-ca:1.5.5',      status: 'running', port: '7054', uptime: '-' },
  { name: 'ca_org2',                image: 'hyperledger/fabric-ca:1.5.5',      status: 'running', port: '8054', uptime: '-' },
  { name: 'couchdb0',               image: 'couchdb:3.1.1',                    status: 'running', port: '5984', uptime: '-' },
  { name: 'mongodb',                image: 'mongo:4.4',                        status: 'running', port: '27017', uptime: '-' },
];

export async function fetchNetworkStatus(): Promise<FabricNetworkStatus> {
  try {
    const BASE = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${BASE}/fabric/status`, { credentials: 'include' });
    const data = await res.json();
    return { ...data, lastChecked: new Date().toLocaleTimeString('vi-VN') };
  } catch (err: any) {
    return {
      connected: false,
      channel: 'mychannel',
      chaincode: 'educert',
      lastChecked: new Date().toLocaleTimeString('vi-VN'),
      error: err.message,
    };
  }
}
