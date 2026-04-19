import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { store, type Certificate } from "@/lib/store";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Shield, LogOut, Award, Calendar, User, Mail, Phone, MapPin, BookOpen, GraduationCap, CheckCircle2, Clock, RefreshCw } from "lucide-react";

export default function StudentDashboard() {
  const { role, userId, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (role !== "student") navigate("/");
  }, [role, navigate]);

  const [student, setStudent] = useState<any>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadCerts = useCallback(() => {
    if (!userId) return;
    store.getCertificatesByStudent(userId).then(setCerts);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    store.getStudent(userId).then(setStudent).catch(() => navigate("/"));
    loadCerts();
  }, [userId]);

  // Auto-refresh chứng chỉ mỗi 10 giây để đồng bộ khi admin cấp mới
  useEffect(() => {
    const id = setInterval(loadCerts, 10000);
    return () => clearInterval(id);
  }, [loadCerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    loadCerts();
    setTimeout(() => setRefreshing(false), 800);
  };

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center">
      <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );

  const handleLogout = () => { logout(); navigate("/"); };
  const signedCount = certs.filter(c => c.trangThai === "da_ky").length;
  const pendingCount = certs.filter(c => c.trangThai === "cho_ky").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">BlockCert</p>
              <p className="text-[10px] text-slate-400 font-medium">ĐH Văn Lang</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} className={`p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-blue-500 transition-all ${refreshing ? "animate-spin text-blue-500" : ""}`} title="Làm mới chứng chỉ">
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{student.hoTen}</p>
              <p className="text-[10px] text-slate-400 font-medium">{student.maSV}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-200/60 hover:border-red-300 transition-all duration-200">
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-7 text-white relative overflow-hidden shadow-xl shadow-blue-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-3xl font-black">{student.hoTen.charAt(student.hoTen.lastIndexOf(" ") + 1)}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{student.hoTen}</h1>
              <p className="text-blue-100 text-sm">{student.khoa} - {student.nganh}</p>
              <p className="text-blue-200/60 text-xs mt-0.5">Khóa {student.khoaHoc}</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/15 rounded-xl px-5 py-3 text-center backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">{certs.length}</p>
                <p className="text-[10px] text-blue-100 font-medium">Chứng chỉ</p>
              </div>
              <div className="bg-white/15 rounded-xl px-5 py-3 text-center backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">{signedCount}</p>
                <p className="text-[10px] text-blue-100 font-medium">Đã ký</p>
              </div>
              <div className="bg-white/15 rounded-xl px-5 py-3 text-center backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-[10px] text-blue-100 font-medium">Chờ ký</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm"
        >
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            Thông tin cá nhân
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: BookOpen, label: "Mã sinh viên", value: student.maSV },
              { icon: Mail, label: "Email", value: student.email },
              { icon: Calendar, label: "Ngày sinh", value: student.ngaySinh },
              { icon: User, label: "Giới tính", value: student.gioiTinh },
              { icon: Phone, label: "Số điện thoại", value: student.soDienThoai },
              { icon: MapPin, label: "Địa chỉ", value: student.diaChi },
              { icon: GraduationCap, label: "Khoa", value: student.khoa },
              { icon: BookOpen, label: "Ngành", value: student.nganh },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3.5 hover:bg-blue-50/50 transition-colors group">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Chứng chỉ của tôi
              <span className="bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{certs.length}</span>
            </h2>
            <button onClick={handleRefresh} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          {certs.length > 0 ? (
            <div className="space-y-4">
              {certs.map((c, index) => (
                <motion.div
                  key={c.maChungChi}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.trangThai === "da_ky" ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-amber-400 to-orange-500"} shadow-lg ${c.trangThai === "da_ky" ? "shadow-emerald-500/25" : "shadow-amber-500/25"}`}>
                          {c.trangThai === "da_ky" ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Clock className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900">{c.tenChungChi}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">{c.maChungChi}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${c.trangThai === "da_ky" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                        {c.trangThai === "da_ky" ? "Đã ký điện tử" : "Chờ ký"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{c.moTa}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ["Loại chứng chỉ", c.loaiChungChi],
                        ["Xếp loại", c.xepLoai],
                        ["Ngày cấp", c.ngayCap],
                        ["Người ký", c.nguoiKy],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                          <p className="text-sm font-medium text-slate-700 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    {c.trangThai === "da_ky" && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-emerald-700">Chứng chỉ đã được ký điện tử trên Blockchain</p>
                          <p className="text-xs text-emerald-500">Ký bởi {c.nguoiKy}</p>
                          {(c as any).fabricTxId && (
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">⛓ block #{(c as any).fabricBlock} · {(c as any).fabricTxId.slice(0,24)}...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">Bạn chưa có chứng chỉ nào</p>
              <p className="text-xs text-slate-300 mt-1">Chứng chỉ sẽ hiển thị ở đây khi được cấp</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
