# BlockCert VanLang — Hệ thống Xác thực Bằng cấp trên HyperLedger Fabric

Ứng dụng quản lý và xác thực chứng chỉ số cho Trường Đại học Văn Lang, sử dụng **HyperLedger Fabric v2.2** chạy trên **Docker**.

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                  Web App (React + Vite)              │
│  Login │ University Dashboard │ Student │ Verifier   │
└────────────────────┬────────────────────────────────┘
                     │ gọi chaincode qua SDK
┌────────────────────▼────────────────────────────────┐
│           Hyperledger Fabric Network (Docker)        │
│                                                      │
│  peer0.org1 (:7051)    peer0.org2 (:9051)           │
│  orderer.example.com (:7050)                         │
│  ca_org1 (:7054)       ca_org2 (:8054)              │
│  couchdb0 (:5984)      mongodb (:27017)             │
│                                                      │
│  Chaincode: educert (JavaScript)                     │
│  • issueCredential   • signCredential               │
│  • verifyCredential  • deleteCredential             │
└─────────────────────────────────────────────────────┘
```

---

## Điều kiện tiên quyết

| Công cụ | Phiên bản tối thiểu |
|---------|-------------------|
| Docker & Docker Compose | Engine 20+ |
| Node.js | 16+ (web app), 12+ (chaincode) |
| npm | 8+ |
| MongoDB | 4.0+ hoặc qua Docker |

---

## Bước 1 — Sao chép kho lưu trữ

```bash
git clone https://github.com/gautam0309/Veritas-Ledger.git
cd Veritas-Ledger
```

---

## Bước 2 — Tải xuống Fabric binaries và Docker images

```bash
# Tải Fabric v2.2.0 binaries + images
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.0 1.5.5
```

Lệnh này kéo xuống các Docker images:

- `hyperledger/fabric-peer:2.2.0`
- `hyperledger/fabric-orderer:2.2.0`
- `hyperledger/fabric-ca:1.5.5`
- `hyperledger/fabric-tools:2.2.0`
- `hyperledger/fabric-ccenv:2.2.0`
- `couchdb:3.1.1`

---

## Bước 3 — Khởi động Fabric Network

```bash
cd fabric-samples/test-network

# Khởi động network với CouchDB và tạo channel
./network.sh up createChannel -c mychannel -ca -s couchdb
```

Kiểm tra containers đang chạy:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Kết quả mong đợi:

```
NAMES                              STATUS
peer0.org1.example.com             Up X minutes
peer0.org2.example.com             Up X minutes
orderer.example.com                Up X minutes
ca_org1                            Up X minutes
ca_org2                            Up X minutes
couchdb0                           Up X minutes
```

---

## Bước 4 — Deploy Chaincode `educert`

```bash
# Đảm bảo đang ở trong fabric-samples/test-network
./network.sh deployCC -ccn educert -ccp ../../chaincode -ccl javascript
```

Chaincode này cung cấp 4 hàm chính:

| Hàm | Mô tả |
|-----|-------|
| `issueCredential` | Phát hành chứng chỉ mới lên ledger |
| `signCredential` | Ký điện tử chứng chỉ |
| `verifyCredential` | Xác minh tính hợp lệ |
| `deleteCredential` | Xóa chứng chỉ khỏi ledger |

---

## Bước 5 — Khởi động MongoDB

```bash
# Option A: MongoDB cài sẵn
mongod --dbpath /data/db

# Option B: Qua Docker
docker run -d --name mongodb -p 27017:27017 mongo:4.4
```

---

## Bước 6 — Cấu hình và chạy Web App

```bash
cd ../../web-app
npm install

# Tạo file .env
cat > .env << 'EOF'
MONGODB_URI_LOCAL=mongodb://localhost:27017/blockchaincertificate
PORT=4000
LOG_LEVEL=debug
EXPRESS_SESSION_SECRET=your-long-random-secret-string-here
CCP_PATH=/absolute/path/to/Veritas-Ledger/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json
FABRIC_CHANNEL_NAME=mychannel
FABRIC_CHAINCODE_NAME=educert
EOF

# Cập nhật CCP_PATH theo đường dẫn thực trên máy bạn!

# Khởi chạy (dev mode)
npm run dev
```

Mở trình duyệt: **http://localhost:4000**

---

## Tài khoản demo

### Trường Đại học (Admin)
| Trường | Giá trị |
|--------|---------|
| Email | `admin@vanlanguni.vn` |
| Mật khẩu | `admin123` |

### Sinh viên
| Tên | Email | Mật khẩu |
|-----|-------|----------|
| Nguyễn Văn An | `an.nguyen@vanlanguni.vn` | `sv123456` |
| Trần Thị Bình | `binh.tran@vanlanguni.vn` | `sv654321` |
| Lê Minh Đức | `duc.le@vanlanguni.vn` | `sv111222` |
| Phạm Thanh Hằng | `hang.pham@vanlanguni.vn` | `sv333444` |
| Võ Quốc Khánh | `khanh.vo@vanlanguni.vn` | `sv555666` |

### Xác minh (Verifier)
Đăng ký tài khoản mới tại tab "Xác minh" trên trang đăng nhập.

---

## Mã chứng chỉ để test xác minh

| Mã | Trạng thái |
|----|-----------|
| `VLU-TH-2024-0001` | ✅ Đã ký |
| `VLU-TH-2024-0003` | ✅ Đã ký |
| `VLU-TH-2024-0004` | ✅ Đã ký |
| `VLU-CN-2024-0006` | ✅ Đã ký |
| `VLU-NN-2024-0002` | ⏳ Chờ ký |

---

## Tính năng Fabric trong demo

Panel **HyperLedger Fabric Network** ở góc phải màn hình hiển thị:
- Danh sách Docker containers và trạng thái
- Block height hiện tại
- Transaction log với txId, block number, MSP ID

Mỗi khi bạn:
- **Cấp chứng chỉ mới** → gọi `issueCredential` chaincode
- **Ký điện tử** → gọi `signCredential` chaincode  
- **Xác minh** → gọi `verifyCredential` chaincode
- **Xóa** → gọi `deleteCredential` chaincode

Transaction ID và block number được hiển thị trực tiếp trong UI.

---

## Dừng network

```bash
cd fabric-samples/test-network
./network.sh down
```
