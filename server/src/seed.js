'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const { Student, University } = require('./models/User');
const { connectFabric, disconnectFabric } = require('./fabric/gateway');
const cc = require('./fabric/chaincode');

const MONGODB_URI = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/blockchaincertificate';

const students = [
  { hoTen: 'Nguyễn Văn An',   email: 'an.nguyen@vanlanguni.vn',  password: 'sv123456', matKhauGoc: 'sv123456', maSV: '2274801030001', ngaySinh: '2004-05-15', gioiTinh: 'Nam', khoa: 'Công nghệ thông tin', nganh: 'Kỹ thuật phần mềm',   khoaHoc: '2022-2026', soDienThoai: '0901234567', diaChi: 'Quận 7, TP.HCM' },
  { hoTen: 'Trần Thị Bình',   email: 'binh.tran@vanlanguni.vn',  password: 'sv654321', matKhauGoc: 'sv654321', maSV: '2274801030002', ngaySinh: '2003-11-20', gioiTinh: 'Nữ',  khoa: 'Kinh tế',            nganh: 'Quản trị kinh doanh', khoaHoc: '2021-2025', soDienThoai: '0912345678', diaChi: 'Quận 1, TP.HCM' },
  { hoTen: 'Lê Minh Đức',     email: 'duc.le@vanlanguni.vn',     password: 'sv111222', matKhauGoc: 'sv111222', maSV: '2274801030003', ngaySinh: '2003-08-10', gioiTinh: 'Nam', khoa: 'Công nghệ thông tin', nganh: 'Khoa học máy tính',  khoaHoc: '2021-2025', soDienThoai: '0923456789', diaChi: 'Quận 3, TP.HCM' },
  { hoTen: 'Phạm Thanh Hằng', email: 'hang.pham@vanlanguni.vn',  password: 'sv333444', matKhauGoc: 'sv333444', maSV: '2274801030004', ngaySinh: '2004-02-28', gioiTinh: 'Nữ',  khoa: 'Ngoại ngữ',          nganh: 'Ngôn ngữ Anh',        khoaHoc: '2022-2026', soDienThoai: '0934567890', diaChi: 'Quận Bình Thạnh, TP.HCM' },
  { hoTen: 'Võ Quốc Khánh',   email: 'khanh.vo@vanlanguni.vn',   password: 'sv555666', matKhauGoc: 'sv555666', maSV: '2274801030005', ngaySinh: '2003-12-05', gioiTinh: 'Nam', khoa: 'Kinh tế',            nganh: 'Tài chính ngân hàng', khoaHoc: '2021-2025', soDienThoai: '0945678901', diaChi: 'Quận Tân Bình, TP.HCM' },
  { hoTen: 'Đặng Minh Tuấn',  email: 'tuan.dang@vanlanguni.vn',  password: 'sv777888', matKhauGoc: 'sv777888', maSV: '2274801030006', ngaySinh: '2004-07-22', gioiTinh: 'Nam', khoa: 'Công nghệ thông tin', nganh: 'An toàn thông tin',   khoaHoc: '2022-2026', soDienThoai: '0956789012', diaChi: 'Quận 10, TP.HCM' },
  { hoTen: 'Nguyễn Thị Lan',  email: 'lan.nguyen@vanlanguni.vn', password: 'sv999000', matKhauGoc: 'sv999000', maSV: '2274801030007', ngaySinh: '2003-03-14', gioiTinh: 'Nữ',  khoa: 'Ngoại ngữ',          nganh: 'Ngôn ngữ Nhật',       khoaHoc: '2021-2025', soDienThoai: '0967890123', diaChi: 'Quận Gò Vấp, TP.HCM' },
  { hoTen: 'Trần Hoàng Nam',  email: 'nam.tran@vanlanguni.vn',   password: 'sv112233', matKhauGoc: 'sv112233', maSV: '2274801030008', ngaySinh: '2004-09-30', gioiTinh: 'Nam', khoa: 'Kinh tế',            nganh: 'Kế toán',             khoaHoc: '2022-2026', soDienThoai: '0978901234', diaChi: 'Quận 5, TP.HCM' },
];

// Nhiều chứng chỉ mẫu đa dạng cho đủ biểu đồ
const certTemplates = [
  // Nguyễn Văn An — 3 chứng chỉ
  { maSV: '2274801030001', loaiChungChi: 'Tốt nghiệp',     xepLoai: 'Giỏi',    ngayCap: '2026-03-01', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Bằng tốt nghiệp Đại học chính quy hệ chính quy', ky: true },
  { maSV: '2274801030001', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Đạt',     ngayCap: '2025-06-10', nguoiKy: 'TS. Trần Văn Bình',         moTa: 'Chứng chỉ lập trình Web nâng cao - NodeJS & React', ky: true },
  { maSV: '2274801030001', loaiChungChi: 'Học bổng',       xepLoai: 'Xuất sắc',ngayCap: '2025-09-15', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Học bổng khuyến khích học tập HK1 2025-2026', ky: true },

  // Trần Thị Bình — 2 chứng chỉ
  { maSV: '2274801030002', loaiChungChi: 'Tốt nghiệp',     xepLoai: 'Xuất sắc',ngayCap: '2025-11-15', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Bằng tốt nghiệp Đại học chính quy hệ chính quy', ky: true },
  { maSV: '2274801030002', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Giỏi',    ngayCap: '2025-04-20', nguoiKy: 'TS. Lê Thị Mai',            moTa: 'Chứng chỉ Quản trị dự án PMP cơ bản', ky: false },

  // Lê Minh Đức — 2 chứng chỉ
  { maSV: '2274801030003', loaiChungChi: 'Học bổng',       xepLoai: 'Xuất sắc',ngayCap: '2025-09-01', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Học bổng tài năng CNTT HK1 2025-2026', ky: true },
  { maSV: '2274801030003', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Giỏi',    ngayCap: '2025-12-01', nguoiKy: 'TS. Trần Văn Bình',         moTa: 'Chứng chỉ Trí tuệ nhân tạo ứng dụng', ky: false },

  // Phạm Thanh Hằng — 2 chứng chỉ
  { maSV: '2274801030004', loaiChungChi: 'Tốt nghiệp',     xepLoai: 'Giỏi',    ngayCap: '2026-03-01', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Bằng tốt nghiệp Đại học chính quy hệ chính quy', ky: true },
  { maSV: '2274801030004', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Xuất sắc',ngayCap: '2025-08-15', nguoiKy: 'TS. Phạm Văn Hùng',         moTa: 'Chứng chỉ IELTS 7.0 - Ngoại ngữ quốc tế', ky: true },

  // Võ Quốc Khánh — 2 chứng chỉ
  { maSV: '2274801030005', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Giỏi',    ngayCap: '2025-12-20', nguoiKy: 'TS. Lê Thị Mai',            moTa: 'Chứng chỉ phân tích tài chính CFA cơ bản', ky: false },
  { maSV: '2274801030005', loaiChungChi: 'Học bổng',       xepLoai: 'Khá',     ngayCap: '2025-10-01', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Học bổng hỗ trợ sinh viên vượt khó HK2 2024-2025', ky: true },

  // Đặng Minh Tuấn — 2 chứng chỉ
  { maSV: '2274801030006', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Giỏi',    ngayCap: '2026-01-10', nguoiKy: 'TS. Trần Văn Bình',         moTa: 'Chứng chỉ An toàn thông tin CEH cơ bản', ky: true },
  { maSV: '2274801030006', loaiChungChi: 'Học bổng',       xepLoai: 'Xuất sắc',ngayCap: '2025-09-01', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Học bổng tài năng bảo mật HK1 2025-2026', ky: true },

  // Nguyễn Thị Lan — 2 chứng chỉ
  { maSV: '2274801030007', loaiChungChi: 'Tốt nghiệp',     xepLoai: 'Khá',     ngayCap: '2025-11-20', nguoiKy: 'PGS.TS Nguyễn Khánh Thuật', moTa: 'Bằng tốt nghiệp Đại học chính quy hệ chính quy', ky: true },
  { maSV: '2274801030007', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Giỏi',    ngayCap: '2025-07-05', nguoiKy: 'TS. Phạm Văn Hùng',         moTa: 'Chứng chỉ Nhật ngữ JLPT N2', ky: true },

  // Trần Hoàng Nam — 1 chứng chỉ
  { maSV: '2274801030008', loaiChungChi: 'Chứng chỉ nghề', xepLoai: 'Khá',     ngayCap: '2026-02-14', nguoiKy: 'TS. Lê Thị Mai',            moTa: 'Chứng chỉ Kế toán thực hành nâng cao', ky: false },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('[Seed] ✅ Connected to MongoDB');

  // Admin
  if (!await University.findOne({ email: 'admin@vanlanguni.vn' })) {
    await new University({ hoTen: 'Admin - ĐH Văn Lang', email: 'admin@vanlanguni.vn', password: 'admin123' }).save();
    console.log('[Seed] Created admin: admin@vanlanguni.vn / admin123');
  } else {
    console.log('[Seed] Admin already exists');
  }

  // Students
  const docs = {};
  for (const s of students) {
    let doc = await Student.findOne({ email: s.email });
    if (!doc) {
      doc = await new Student(s).save();
      console.log(`[Seed] ✅ Created student: ${s.hoTen} (${s.email} / ${s.matKhauGoc})`);
    } else {
      console.log(`[Seed] ℹ  Exists: ${s.hoTen}`);
    }
    docs[s.maSV] = doc;
  }

  // Fabric certs
  console.log('\n[Seed] Kết nối Fabric...');
  let ok = false;
  try {
    await connectFabric();
    ok = true;
    console.log('[Seed] ✅ Fabric OK');
  } catch (e) {
    console.warn(`[Seed] ⚠️  Fabric offline, bỏ qua chứng chỉ: ${e.message}`);
    console.warn('[Seed]    Chạy lại sau khi Fabric đã khởi động để tạo chứng chỉ mẫu.');
  }

  if (ok) {
    let issued = 0, skipped = 0, errors = 0;
    for (let i = 0; i < certTemplates.length; i++) {
      const t = certTemplates[i];
      const doc = docs[t.maSV];
      if (!doc) { console.warn(`[Seed] ⚠️  Không tìm thấy sinh viên maSV=${t.maSV}`); continue; }

      const maCC = `CC-VLU-${String(i + 1).padStart(3, '0')}`;
      const tenChungChi = `${t.loaiChungChi} - ${doc.nganh}`;

      // Kiểm tra đã tồn tại chưa
      try {
        await cc.queryCredential(maCC);
        console.log(`[Seed] ℹ  Cert exists: ${maCC} (${doc.hoTen})`);
        skipped++;
        continue;
      } catch (_) {}

      // Tạo mới
      try {
        await cc.issueCredential({
          maChungChi: maCC,
          tenChungChi,
          studentId: doc._id.toString(),
          maSV: t.maSV,
          hoTen: doc.hoTen,
          khoa: doc.khoa,
          nganh: doc.nganh,
          loaiChungChi: t.loaiChungChi,
          xepLoai: t.xepLoai,
          nguoiKy: t.nguoiKy,
          ngayCap: t.ngayCap,
          moTa: t.moTa,
        });
        console.log(`[Seed] ✅ Issued: ${maCC} → ${doc.hoTen} (${t.loaiChungChi}, ${t.xepLoai})`);
        issued++;

        if (t.ky) {
          await cc.signCredential(maCC, t.nguoiKy);
          console.log(`[Seed]    ✍  Đã ký: ${maCC}`);
        }
      } catch (e) {
        console.warn(`[Seed] ❌ Lỗi ${maCC}: ${e.message}`);
        errors++;
      }
    }
    console.log(`\n[Seed] Tổng kết chứng chỉ: ${issued} tạo mới | ${skipped} đã có | ${errors} lỗi`);
    await disconnectFabric();
  }

  console.log('\n[Seed] ═══════════════════════════════════════');
  console.log('[Seed] ✅ HOÀN TẤT! Tài khoản đăng nhập:');
  console.log('[Seed] ───────────────────────────────────────');
  console.log('[Seed] 🔑 Admin:');
  console.log('[Seed]    admin@vanlanguni.vn / admin123');
  console.log('[Seed] 🎓 Sinh viên:');
  students.forEach(s => console.log(`[Seed]    ${s.email} / ${s.matKhauGoc}`));
  console.log('[Seed] ═══════════════════════════════════════');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('[Seed] FATAL:', err); process.exit(1); });
