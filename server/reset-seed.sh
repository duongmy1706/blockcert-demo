#!/bin/bash
# reset-seed.sh — Xóa toàn bộ dữ liệu cũ và seed lại từ đầu
# Chạy từ thư mục server/: bash reset-seed.sh

echo "═══════════════════════════════════════"
echo "  BlockCert — Reset & Seed dữ liệu mẫu"
echo "═══════════════════════════════════════"

echo ""
echo "⚠️  Sẽ XÓA SẠCH toàn bộ students, certs trong MongoDB."
read -p "   Tiếp tục? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Đã hủy."
  exit 0
fi

echo ""
echo "▶ Xóa dữ liệu MongoDB..."
mongosh blockchaincertificate --quiet --eval "
  db.students.deleteMany({});
  db.universities.deleteMany({});
  db.verifiers.deleteMany({});
  print('✅ Đã xóa: students, universities, verifiers');
" 2>/dev/null || echo "⚠️  mongosh không chạy được — tiếp tục seed sẽ báo 'already exists'"

echo ""
echo "▶ Chạy seed.js..."
cd "$(dirname "$0")"
node src/seed.js

echo ""
echo "✅ Xong! Bây giờ truy cập http://localhost:5173"
