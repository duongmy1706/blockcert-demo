# BlockCert VanLang — HyperLedger Fabric + Docker

Hệ thống xác thực bằng cấp, chứng chỉ số cho Đại học Văn Lang, sử dụng **HyperLedger Fabric v2.2** chạy hoàn toàn trên **Docker**. Không mock, không giả lập — mọi thao tác đều ghi lên Fabric ledger thật.

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│              Web App  (React + Vite, port 5173)          │
│   Login │ University Dashboard │ Student │ Verifier      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP + Session Cookie
┌───────────────────────▼─────────────────────────────────┐
│          Express API Server (Node.js, port 4000)         │
│   /api/auth  ←→  MongoDB  (users, sessions)              │
│   /api/fabric ←→  fabric-network SDK                     │
└───────────────────────┬─────────────────────────────────┘
                        │ gRPC (fabric-network v2.2 SDK)
┌───────────────────────▼─────────────────────────────────┐
│         HyperLedger Fabric Network (Docker)              │
│                                                          │
│  peer0.org1:7051   peer0.org2:9051                       │
│  orderer:7050      ca_org1:7054   ca_org2:8054           │
│  couchdb0:5984                                           │
│                                                          │
│  Channel: mychannel                                      │
│  Chaincode: educert (JavaScript)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  issueCredential(maChungChi, tenChungChi, ...)    │  │
│  │  signCredential(maChungChi, nguoiKy)              │  │
│  │  verifyCredential(maChungChi) → {valid, cert}     │  │
│  │  deleteCredential(maChungChi)                     │  │
│  │  queryByStudent(studentId) [CouchDB rich query]   │  │
│  │  getHistory(maChungChi)    [audit trail]          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
┌────────▼──────────┐
│  MongoDB :27017    │  (users, sessions — off-chain)
└───────────────────┘
```

---

## Cấu trúc thư mục

```
blockcert-full/
├── chaincode/           # Fabric chaincode (JavaScript)
│   ├── index.js         # EduCertContract với 6 functions
│   └── package.json
├── server/              # Express API backend
│   ├── src/
│   │   ├── index.js     # Entry point
│   │   ├── fabric/
│   │   │   ├── gateway.js   # Fabric Gateway + enroll admin/appUser
│   │   │   └── chaincode.js # Wrapper cho mọi chaincode calls
│   │   ├── routes/
│   │   │   ├── auth.js      # Login/logout/register
│   │   │   └── fabric.js    # Chaincode REST endpoints
│   │   ├── models/
│   │   │   └── User.js      # MongoDB schemas
│   │   ├── middleware/
│   │   │   └── auth.js      # requireAuth, requireRole
│   │   └── seed.js          # Tạo dữ liệu demo
│   ├── package.json
│   └── .env.example
├── web-app/             # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts        # HTTP client → Express API
│   │   │   ├── auth.ts       # Zustand auth state
│   │   │   ├── store.ts      # Data layer → gọi api.ts
│   │   │   └── fabric.ts     # Fabric status (polling)
│   │   ├── components/
│   │   │   └── FabricStatus.tsx  # Network panel góc phải
│   │   └── pages/
│   │       ├── login.tsx
│   │       ├── university-dashboard.tsx
│   │       ├── student-dashboard.tsx
│   │       └── verifier-dashboard.tsx
│   └── .env             # VITE_API_URL=http://localhost:4000/api
├── setup.sh             # Script thiết lập toàn bộ (chạy 1 lần)
└── start.sh             # Script khởi động hàng ngày
```

---

## Điều kiện tiên quyết

| Công cụ | Phiên bản | Ghi chú |
|---------|-----------|---------|
| Docker Engine | 20+ | `docker --version` |
| Docker Compose | V2 | tích hợp trong Docker Desktop |
| Node.js | **16+** | server cần 16+, chaincode cần 12+ |
| npm | 8+ | |
| `curl` | bất kỳ | để tải Fabric binaries |

> **macOS/Linux:** Đảm bảo Docker Desktop đang chạy trước khi thực hiện các bước dưới.

---

## Bước 1 — Clone và giải nén

```bash
# Giải nén file đã tải
unzip blockcert-full.zip
cd blockcert-full
```

---

## Bước 2 — Chạy setup tự động (khuyến nghị)

```bash
chmod +x setup.sh
./setup.sh
```

Script này tự động thực hiện toàn bộ Bước 3–7 bên dưới. Nếu muốn làm thủ công, xem từng bước.

---

## Bước 3 — Tải Fabric binaries (nếu chưa có)

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.0 1.5.5
```

Kéo các Docker images:
- `hyperledger/fabric-peer:2.2.0`
- `hyperledger/fabric-orderer:2.2.0`
- `hyperledger/fabric-ca:1.5.5`
- `hyperledger/fabric-tools:2.2.0`
- `couchdb:3.1.1`

---

## Bước 4 — Khởi động Fabric Network

```bash
cd fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca -s couchdb
```

Kiểm tra containers:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Bước 5 — Deploy Chaincode `educert`

```bash
# Cài dependencies cho chaincode
cd ../../chaincode && npm install && cd ..

# Deploy
./fabric-samples/test-network/network.sh deployCC \
  -ccn educert \
  -ccp ./chaincode \
  -ccl javascript
```

---

## Bước 6 — Khởi động MongoDB

```bash
docker run -d --name mongodb -p 27017:27017 mongo:4.4
```

---

## Bước 7 — Cấu hình và chạy Backend

```bash
cd server
cp .env.example .env
```

Mở `.env` và cập nhật `CCP_PATH`:
```bash
# Ví dụ trên Linux/macOS:
CCP_PATH=/home/user/blockcert-full/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json
```

```bash
npm install
node src/seed.js   # Tạo dữ liệu demo
npm run dev        # Khởi động server
```

Server chạy tại: **http://localhost:4000**

---

## Bước 8 — Chạy Frontend

```bash
cd web-app
npm install
npm run dev
```

Mở trình duyệt: **http://localhost:5173**

---

## Khởi động lại hàng ngày

Sau lần setup đầu, mỗi lần muốn chạy lại:

```bash
# 1. Đảm bảo Fabric containers đang chạy
docker ps | grep peer

# Nếu không có, khởi động lại:
cd fabric-samples/test-network && ./network.sh up && cd ../..

# 2. Đảm bảo MongoDB chạy
docker start mongodb

# 3. Khởi động app
./start.sh
# Hoặc thủ công:
#   Terminal 1: cd server && npm run dev
#   Terminal 2: cd web-app && npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Lấy session hiện tại |
| POST | `/api/auth/register/verifier` | Đăng ký verifier mới |
| GET | `/api/auth/students` | Danh sách sinh viên |

### Fabric Chaincode
| Method | Endpoint | Chaincode | Mô tả |
|--------|----------|-----------|-------|
| GET | `/api/fabric/status` | — | Trạng thái network |
| POST | `/api/fabric/certificates` | `issueCredential` | Cấp chứng chỉ |
| GET | `/api/fabric/certificates/:ma` | `queryCredential` | Xem chứng chỉ |
| PUT | `/api/fabric/certificates/:ma/sign` | `signCredential` | Ký điện tử |
| GET | `/api/fabric/certificates/:ma/verify` | `verifyCredential` | Xác minh |
| DELETE | `/api/fabric/certificates/:ma` | `deleteCredential` | Xóa |
| GET | `/api/fabric/students/:id/certificates` | `queryByStudent` | Chứng chỉ của SV |
| GET | `/api/fabric/certificates/:ma/history` | `getHistory` | Audit trail |

---

## Tài khoản demo

| Role | Email | Mật khẩu |
|------|-------|----------|
| University Admin | `admin@vanlanguni.vn` | `admin123` |
| Sinh viên | `an.nguyen@vanlanguni.vn` | `sv123456` |
| Sinh viên | `binh.tran@vanlanguni.vn` | `sv654321` |
| Sinh viên | `duc.le@vanlanguni.vn` | `sv111222` |

---

## Dừng toàn bộ hệ thống

```bash
# Dừng Fabric network
cd fabric-samples/test-network && ./network.sh down

# Dừng MongoDB
docker stop mongodb

# Ctrl+C trên các terminal đang chạy server/frontend
```
