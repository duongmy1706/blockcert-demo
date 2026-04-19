#!/bin/bash
# ============================================================
# setup.sh — Thiết lập và khởi động toàn bộ BlockCert stack
# Chạy: chmod +x setup.sh && ./setup.sh
# ============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[x]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   BlockCert VanLang — HyperLedger Fabric Setup       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Kiểm tra prerequisites ──────────────────────────────────
log "Kiểm tra prerequisites..."

command -v docker >/dev/null 2>&1 || err "Docker chưa được cài. Cài tại https://docs.docker.com/get-docker/"
command -v node >/dev/null 2>&1 || err "Node.js chưa được cài. Cài phiên bản 16+"
command -v npm >/dev/null 2>&1 || err "npm chưa được cài."

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 16 ]; then
  err "Node.js cần >= 16. Phiên bản hiện tại: $(node -v)"
fi

log "Docker: $(docker --version | cut -d' ' -f3)"
log "Node.js: $(node -v)"
log "npm: $(npm -v)"

# ── Tải Fabric binaries ─────────────────────────────────────
if [ ! -d "fabric-samples" ]; then
  log "Tải HyperLedger Fabric v2.2.0 binaries và Docker images..."
  curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.0 1.5.5
  log "Fabric binaries đã tải xong"
else
  warn "Thư mục fabric-samples đã tồn tại, bỏ qua bước tải"
fi

# ── Khởi động Fabric Network ────────────────────────────────
log "Khởi động Fabric test-network..."
cd fabric-samples/test-network

# Dừng network cũ nếu có
./network.sh down 2>/dev/null || true

# Khởi động với CouchDB + CA
./network.sh up createChannel -c mychannel -ca -s couchdb
log "Fabric network đã khởi động trên channel: mychannel"

# Kiểm tra containers
echo ""
info "Docker containers đang chạy:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "peer|orderer|ca_|couchdb|NAME"

# ── Deploy Chaincode ────────────────────────────────────────
log "Deploy chaincode 'educert'..."
cd ../../

# Cài npm packages cho chaincode
cd chaincode && npm install --quiet && cd ..

./fabric-samples/test-network/network.sh deployCC \
  -ccn educert \
  -ccp ./chaincode \
  -ccl javascript

log "Chaincode 'educert' đã được deploy thành công"

# ── Khởi động MongoDB ───────────────────────────────────────
if ! docker ps | grep -q mongodb; then
  log "Khởi động MongoDB..."
  docker run -d --name mongodb -p 27017:27017 mongo:4.4
  sleep 3
else
  warn "MongoDB đã đang chạy"
fi

# ── Cấu hình Server ─────────────────────────────────────────
log "Cấu hình Express server..."
cd server

if [ ! -f .env ]; then
  CCP_PATH=$(pwd)/../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json
  cat > .env << ENVEOF
MONGODB_URI_LOCAL=mongodb://localhost:27017/blockchaincertificate
PORT=4000
LOG_LEVEL=debug
EXPRESS_SESSION_SECRET=blockcert-vanlang-$(openssl rand -hex 16 2>/dev/null || echo "secret-change-me")
FRONTEND_URL=http://localhost:5173
CCP_PATH=${CCP_PATH}
FABRIC_CHANNEL_NAME=mychannel
FABRIC_CHAINCODE_NAME=educert
WALLET_PATH=./wallet
AS_LOCALHOST=true
ENVEOF
  log ".env đã được tạo với CCP_PATH=$CCP_PATH"
else
  warn ".env đã tồn tại, bỏ qua"
fi

# Cài npm packages server
npm install --quiet
log "Server dependencies đã cài"

# Seed dữ liệu
log "Seed dữ liệu demo vào MongoDB..."
node src/seed.js

cd ..

# ── Cài Frontend ────────────────────────────────────────────
log "Cài frontend dependencies..."
cd web-app
npm install --quiet
cd ..

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅ Setup hoàn tất!                                  ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║   Để chạy hệ thống, mở 2 terminal:                  ║"
echo "║                                                      ║"
echo "║   Terminal 1 (Backend):                              ║"
echo "║     cd server && npm run dev                         ║"
echo "║                                                      ║"
echo "║   Terminal 2 (Frontend):                             ║"
echo "║     cd web-app && npm run dev                        ║"
echo "║                                                      ║"
echo "║   Mở trình duyệt: http://localhost:5173              ║"
echo "║                                                      ║"
echo "║   Tài khoản demo:                                    ║"
echo "║     University: admin@vanlanguni.vn / admin123       ║"
echo "║     Student:    an.nguyen@vanlanguni.vn / sv123456   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
