// api.ts — HTTP client gọi Express backend thật (kết nối Fabric SDK)

const BASE = import.meta.env.VITE_API_URL || '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────
  login: (email: string, password: string, role: string) =>
    req<{ success: boolean; user: { id: string; email: string; hoTen: string; role: string } }>(
      'POST', '/auth/login', { email, password, role }
    ),
  logout: () => req('POST', '/auth/logout'),
  me: () => req<{ user: { id: string; email: string; hoTen: string; role: string } }>('GET', '/auth/me'),
  registerVerifier: (data: { hoTen: string; email: string; password: string; toChuc: string }) =>
    req('POST', '/auth/register/verifier', data),
  registerStudent: (data: any) =>
    req<{ success: boolean; id: string; student: any }>('POST', '/auth/register/student', data),
  updateStudent: (id: string, data: any) =>
    req<{ success: boolean; student: any }>('PUT', `/auth/students/${id}`, data),
  deleteStudent: (id: string) =>
    req<{ success: boolean }>('DELETE', `/auth/students/${id}`),
  getStudents: () => req<any[]>('GET', '/auth/students'),
  getStudent: (id: string) => req<any>('GET', `/auth/students/${id}`),

  // ── Fabric Chaincode ──────────────────────────────────────────────────
  fabricStatus: () =>
    req<{ connected: boolean; channel: string; chaincode: string }>('GET', '/fabric/status'),

  issueCert: (data: {
    maChungChi: string; tenChungChi: string; studentId: string; maSV: string;
    hoTen: string; khoa: string; nganh: string; loaiChungChi: string;
    xepLoai: string; nguoiKy: string; ngayCap: string; moTa: string;
  }) => req<{ success: boolean; data: any }>('POST', '/fabric/certificates', data),

  getCert: (maChungChi: string) =>
    req<{ success: boolean; data: any }>('GET', `/fabric/certificates/${encodeURIComponent(maChungChi)}`),

  signCert: (maChungChi: string, nguoiKy: string) =>
    req<{ success: boolean; data: any }>('PUT', `/fabric/certificates/${encodeURIComponent(maChungChi)}/sign`, { nguoiKy }),

  verifyCert: (maChungChi: string) =>
    req<{ success: boolean; data: { valid: boolean; certificate: any; verifiedAt: string; txId: string } }>(
      'GET', `/fabric/certificates/${encodeURIComponent(maChungChi)}/verify`
    ),

  deleteCert: (maChungChi: string) =>
    req<{ success: boolean }>('DELETE', `/fabric/certificates/${encodeURIComponent(maChungChi)}`),

  getCertsByStudent: (studentId: string) =>
    req<{ success: boolean; data: any[] }>('GET', `/fabric/students/${studentId}/certificates`),

  getAllCerts: (pageSize = 50, bookmark = '') =>
    req<{ success: boolean; data: { results: any[]; bookmark: string } }>(
      'GET', `/fabric/certificates?pageSize=${pageSize}&bookmark=${bookmark}`
    ),

  getCertHistory: (maChungChi: string) =>
    req<{ success: boolean; data: any[] }>(
      'GET', `/fabric/certificates/${encodeURIComponent(maChungChi)}/history`
    ),
};
