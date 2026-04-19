#!/bin/bash
# start.sh — Khởi động Backend + Frontend
# Chạy sau khi đã chạy setup.sh thành công

set -e
GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}[+]${NC} $1"; }

# Kill on Ctrl+C
cleanup() {
  log "Đang dừng các service..."
  kill 0
}
trap cleanup SIGINT SIGTERM

log "Kiểm tra Fabric network..."
if ! docker ps | grep -q "peer0.org1"; then
  echo "⚠️  Fabric network chưa chạy. Chạy ./setup.sh trước!"
  exit 1
fi

log "Khởi động MongoDB (nếu chưa chạy)..."
if ! docker ps | grep -q mongodb; then
  docker start mongodb 2>/dev/null || docker run -d --name mongodb -p 27017:27017 mongo:4.4
fi

log "Khởi động Backend server (port 4000)..."
cd server && npm run dev &
SERVER_PID=$!

sleep 3

log "Khởi động Frontend (port 5173)..."
cd ../web-app && npm run dev &
FRONTEND_PID=$!

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  BlockCert đang chạy!                 ║"
echo "║  Frontend: http://localhost:5173       ║"
echo "║  Backend:  http://localhost:4000       ║"
echo "║  Nhấn Ctrl+C để dừng                  ║"
echo "╚═══════════════════════════════════════╝"
echo ""

wait
