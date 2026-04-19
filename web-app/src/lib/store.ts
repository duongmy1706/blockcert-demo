// store.ts — Kết nối trực tiếp API backend (Express + Fabric SDK)
// Mọi thao tác đều gọi chaincode thật qua server

import { api } from './api';

export interface Student {
  id: string; _id?: string; hoTen: string; email: string; maSV: string;
  password?: string; matKhauGoc?: string;
  ngaySinh: string; gioiTinh: string; khoa: string; nganh: string;
  khoaHoc: string; soDienThoai: string; diaChi: string; avatar?: string;
}

export interface Certificate {
  maChungChi: string; tenChungChi: string; studentId: string; maSV: string;
  hoTen: string; khoa: string; nganh: string; loaiChungChi: string;
  xepLoai: string; nguoiKy: string; ngayCap: string; moTa: string;
  trangThai: 'cho_ky' | 'da_ky'; ngayKy?: string;
  txId?: string; signTxId?: string; issuedAt?: string;
  fabricBlock?: number; fabricTimestamp?: string;
}

export interface VerifyResult {
  valid: boolean;
  certificate: Certificate;
  verifiedAt: string;
  txId: string;
}

// ── Students (từ MongoDB) ─────────────────────────────────────────────────
export const studentApi = {
  getAll: () => api.getStudents(),
  getById: (id: string) => api.getStudent(id),
};

// ── Certificates (từ Fabric ledger) ──────────────────────────────────────
export const certApi = {
  issue: (data: Omit<Certificate, 'trangThai'> & { studentId: string }) =>
    api.issueCert(data as any),

  sign: (maChungChi: string, nguoiKy: string) =>
    api.signCert(maChungChi, nguoiKy),

  verify: async (maChungChi: string): Promise<VerifyResult | null> => {
    try {
      const res = await api.verifyCert(maChungChi);
      return res.data;
    } catch {
      return null;
    }
  },

  delete: (maChungChi: string) => api.deleteCert(maChungChi),

  getByStudent: async (studentId: string): Promise<Certificate[]> => {
    const res = await api.getCertsByStudent(studentId);
    return res.data || [];
  },

  getAll: async () => {
    const res = await api.getAllCerts();
    return res.data?.results || [];
  },

  getHistory: (maChungChi: string) => api.getCertHistory(maChungChi),
};

// ── Legacy store shim (cho các component dùng store.xxx cũ) ──────────────
// Chỉ giữ lại các hàm synchronous trước đây, giờ đều là async
export const store = {
  // Students — từ MongoDB
  getStudents: async () => {
    const list = await api.getStudents();
    return list.map((s: any) => ({ ...s, id: s.id || s._id }));
  },
  getStudent: (id: string) => api.getStudent(id),

  // Certificates — từ Fabric
  getCertificates: () => certApi.getAll(),
  getCertificatesByStudent: (studentId: string) => certApi.getByStudent(studentId),

  addCertificate: (data: any) => api.issueCert(data),
  signCertificate: (maChungChi: string, nguoiKy: string) => api.signCert(maChungChi, nguoiKy),
  deleteCertificate: (maChungChi: string) => api.deleteCert(maChungChi),
  verifyCertificate: (maChungChi: string) => certApi.verify(maChungChi),

  getStats: async () => {
    const [certs, students]: [Certificate[], any[]] = await Promise.all([
      certApi.getAll().catch(() => []),
      api.getStudents().catch(() => []),
    ]);
    return {
      total: certs.length,
      signed: certs.filter(c => c.trangThai === 'da_ky').length,
      pending: certs.filter(c => c.trangThai === 'cho_ky').length,
      totalStudents: students.length,
    };
  },
};
