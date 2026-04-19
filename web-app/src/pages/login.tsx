import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Building2, GraduationCap, UserCheck, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [tab, setTab] = useState<"university" | "student" | "verifier">("university");

  const tabs = [
    { key: "university" as const, label: "Trường Đại học", icon: Building2 },
    { key: "student" as const, label: "Sinh viên", icon: GraduationCap },
    { key: "verifier" as const, label: "Xác minh", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-500/30 rotate-3"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BlockCert</h1>
          <p className="text-slate-500 mt-2 text-sm">Hệ thống quản lý chứng chỉ - Đại học Văn Lang</p>
        </div>

        <div className="glass-card rounded-2xl border border-slate-200/80 shadow-2xl shadow-black/20 overflow-hidden">
          <div className="flex p-1.5 gap-1 bg-white/70">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 px-2 text-xs font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  tab === t.key ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 hover:bg-white/70"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                {tab === "university" && <UniversityLogin />}
                {tab === "student" && <StudentLogin />}
                {tab === "verifier" && <VerifierTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs mt-6">BlockCert v3.0 — HyperLedger Fabric + Docker</p>
      </motion.div>
    </div>
  );
}

// ─── University Login ──────────────────────────────────────────────────────
function UniversityLogin() {
  const [email, setEmail] = useState("admin@vanlanguni.vn");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { setAuth } = useAuth();
  const [, navigate] = useLocation();

  const handleLogin = async () => {
    if (!email || !password) { setError("Vui lòng nhập đầy đủ thông tin"); return; }
    setLoading(true); setError("");
    try {
      const { user } = await api.login(email, password, "university");
      setAuth("university", user.id, user.hoTen, user.email);
      navigate("/university");
    } catch (e: any) {
      setError(e.message || "Đăng nhập thất bại");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/20">
          <Building2 className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="font-bold text-lg text-slate-900">Trường Đại học Văn Lang</h3>
        <p className="text-sm text-slate-400 mt-1">Đăng nhập quản trị</p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Email</label>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
          className="w-full px-4 py-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm"
          placeholder="admin@vanlanguni.vn" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Mật khẩu</label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm pr-11"
            placeholder="Nhập mật khẩu..." />
          <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</motion.p>}
      </AnimatePresence>
      <button onClick={handleLogin} disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-70"
      >
        {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang đăng nhập...</> : <>Đăng nhập<ArrowRight className="w-4 h-4" /></>}
      </button>
      <p className="text-xs text-center text-slate-400">Demo: admin@vanlanguni.vn / admin123</p>
    </div>
  );
}

// ─── Student Login ─────────────────────────────────────────────────────────
function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { setAuth } = useAuth();
  const [, navigate] = useLocation();

  const handleLogin = async () => {
    if (!email || !password) { setError("Vui lòng nhập đầy đủ thông tin"); return; }
    setLoading(true); setError("");
    try {
      const { user } = await api.login(email, password, "student");
      setAuth("student", user.id, user.hoTen, user.email);
      navigate("/student");
    } catch (e: any) {
      setError(e.message || "Đăng nhập thất bại");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-400/20">
          <GraduationCap className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="font-bold text-lg text-slate-900">Sinh viên</h3>
        <p className="text-sm text-slate-400 mt-1">Đăng nhập bằng tài khoản do trường cấp</p>
      </div>
      {[{label:"Email", val:email, set:setEmail, type:"email", ph:"an.nguyen@vanlanguni.vn"}, {label:"Mật khẩu", val:password, set:setPassword, type:"password", ph:"Nhập mật khẩu"}].map(f => (
        <div key={f.label}>
          <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">{f.label}</label>
          <input type={f.type === "password" && showPw ? "text" : f.type} value={f.val}
            onChange={e => { f.set(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder={f.ph}
            className="w-full px-4 py-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm" />
        </div>
      ))}
      <AnimatePresence>
        {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</motion.p>}
      </AnimatePresence>
      <button onClick={handleLogin} disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-70"
      >
        {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang đăng nhập...</> : <>Đăng nhập<ArrowRight className="w-4 h-4" /></>}
      </button>
      <p className="text-xs text-center text-slate-400">Demo: an.nguyen@vanlanguni.vn / sv123456</p>
    </div>
  );
}

// ─── Verifier Tab ──────────────────────────────────────────────────────────
function VerifierTab() {
  const [mode, setMode] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [toChuc, setToChuc] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { setAuth } = useAuth();
  const [, navigate] = useLocation();

  const handleLogin = async () => {
    if (!email || !password) { setError("Vui lòng nhập đầy đủ thông tin"); return; }
    setLoading(true); setError("");
    try {
      const { user } = await api.login(email, password, "verifier");
      setAuth("verifier", user.id, user.hoTen, user.email);
      navigate("/verifier");
    } catch (e: any) {
      setError(e.message || "Đăng nhập thất bại");
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!hoTen || !email || !password || !toChuc) { setError("Vui lòng điền đầy đủ thông tin!"); return; }
    setLoading(true); setError("");
    try {
      await api.registerVerifier({ hoTen, email, password, toChuc });
      setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
      setMode("login"); setPassword("");
    } catch (e: any) {
      setError(e.message || "Đăng ký thất bại");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-400/20">
          <UserCheck className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="font-bold text-lg text-slate-900">Người xác minh</h3>
      </div>
      <div className="flex gap-1 bg-white/70 rounded-xl p-1">
        {(["login","register"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 text-xs rounded-lg font-semibold transition-all duration-200 ${mode === m ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >{m === "login" ? "Đăng nhập" : "Đăng ký"}</button>
        ))}
      </div>
      <AnimatePresence>
        {success && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">{success}</motion.p>}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Họ và tên</label>
                <input type="text" value={hoTen} onChange={e => { setHoTen(e.target.value); setError(""); }} placeholder="Nhập họ và tên" className="w-full px-4 py-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Tổ chức</label>
                <input type="text" value={toChuc} onChange={e => { setToChuc(e.target.value); setError(""); }} placeholder="Tên tổ chức / công ty" className="w-full px-4 py-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all text-sm" />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="email@example.com" className="w-full px-4 py-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Mật khẩu</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
                placeholder="Nhập mật khẩu" className="w-full px-4 py-3.5 rounded-xl bg-white/70 border border-slate-200/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all text-sm pr-11" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 transition">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</motion.p>}
      </AnimatePresence>
      <button onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-70"
      >
        {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang xử lý...</> : <>{mode === "login" ? "Đăng nhập" : "Đăng ký"}<ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}
