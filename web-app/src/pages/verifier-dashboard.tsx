import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, LogOut, Search, CheckCircle2, Clock, AlertTriangle, Building2, User, Award, Calendar, BookOpen, GraduationCap } from "lucide-react";

export default function VerifierDashboard() {
  const { role, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchCode, setSearchCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (role !== "verifier") navigate("/");
  }, [role, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    setSearched(false);
    setResult(null);
    setNotFound(false);
    try {
      const r = await store.verifyCertificate(searchCode.trim());
      if (r) {
        setResult(r);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-slate-50 to-purple-50/30">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">BlockCert - Xac minh</p>
              <p className="text-[10px] text-slate-400 font-medium">Hệ thống xác minh chứng chỉ</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-200/60 hover:border-red-300 transition-all duration-200">
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-violet-200/60">
            <Search className="w-8 h-8 text-violet-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Xac minh chứng chỉ</h1>
          <p className="text-slate-400 text-sm">Nhập mã chứng chỉ để kiểm tra tính hợp lệ</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-10"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => { setSearchCode(e.target.value); setNotFound(false); setSearched(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nhập mã chứng chỉ (VD: VLU-TH-2024-0001)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm flex items-center gap-2 disabled:opacity-70"
            >
              {searching ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  verifyCredential...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Xác minh
                </>
              )}
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {notFound && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-red-200/60 p-10 text-center shadow-sm">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200/60">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <p className="font-bold text-red-600 text-lg mb-1">Không tìm thấy chứng chỉ</p>
                <p className="text-sm text-slate-400">Mã chứng chỉ không tồn tại trong hệ thống</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-lg">
                <div className={`px-7 py-5 flex items-center gap-4 ${result.valid ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-gradient-to-r from-amber-500 to-orange-500"} text-white`}>
                  <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    {result.valid ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {result.valid ? "Chứng chỉ hợp lệ - Đã ký điện tử" : "Chứng chỉ chờ ký điện tử"}
                    </p>
                    <p className="text-white/70 text-sm">
                      {result.valid ? "Duoc xac thuc bởi Truong ĐH Văn Lang" : "Chứng chỉ chưa được ký, đang chờ xử lý"}
                    </p>
                  </div>
                </div>

                <div className="p-7 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900">{result.certificate.tenChungChi}</h3>
                      <p className="text-sm text-slate-400 font-mono mt-0.5">{result.certificate.maChungChi}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: User, label: "Sinh viên", value: (result.certificate?.hoTen || "N/A") },
                      { icon: BookOpen, label: "Mã sinh viên", value: result.certificate?.maSV },
                      { icon: GraduationCap, label: "Loại chứng chỉ", value: result.certificate.loaiChungChi },
                      { icon: Award, label: "Xếp loại", value: result.certificate.xepLoai },
                      { icon: Calendar, label: "Ngày cấp", value: result.certificate.ngayCap },
                      { icon: User, label: "Người ký", value: result.certificate.nguoiKy },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-4 hover:bg-violet-50/50 transition-colors group">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3 h-3 text-slate-400 group-hover:text-violet-500 transition-colors" />
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Mô tả</p>
                    <p className="text-sm text-slate-600">{result.certificate.moTa}</p>
                  </div>

                  {result.certificate.ngayKy && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200/60">
                      <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mb-1">Ngày ký điện tử</p>
                      <p className="text-sm font-semibold text-emerald-700">{result.certificate.ngayKy}</p>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/60 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Cơ sở đào tạo</p>
                      <p className="text-sm font-bold text-blue-800">Trường Đại học Văn Lang</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/60">
                    <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-2">⛓ Hyperledger Fabric · verifyCredential</p>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-400 break-all">txId: {result.txId.slice(0,48)}...</p>
                      <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                        <span>block #{"N/A"}</span>
                        <span>channel: {"mychannel"}</span>
                        <span>{"Org1MSP"}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{"peer0.org1.example.com:7051"} · {new Date(result.verifiedAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {!searched && !notFound && !result && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto text-center py-10"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-300 text-sm">Nhập mã chứng chỉ để bắt đầu xác minh</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
