import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { store, type Student, type Certificate } from "@/lib/store";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar
} from "recharts";
import {
  Shield, LayoutDashboard, Users, Award, LogOut, Plus, Pencil, Trash2, Eye, X,
  TrendingUp, CheckCircle2, Clock, FileText, ChevronDown, GraduationCap, Search,
  Calendar, User, Mail, Phone, MapPin, BookOpen, Filter, RefreshCw
} from "lucide-react";

export default function UniversityDashboard() {
  const { role, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "students" | "certificates">("dashboard");
  // refreshKey: tăng lên mỗi khi có thay đổi dữ liệu → DashboardTab tự reload
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (role !== "university") navigate("/");
  }, [role, navigate]);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleLogout = () => { logout(); navigate("/"); };

  const tabs = [
    { key: "dashboard" as const, label: "Tổng quan", icon: LayoutDashboard },
    { key: "students" as const, label: "Sinh viên", icon: Users },
    { key: "certificates" as const, label: "Chứng chỉ", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex">
      <aside className="w-[260px] bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">BlockCert</p>
              <p className="text-[10px] text-slate-400 font-medium">ĐH Văn Lang - Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === t.key
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <t.icon className="w-[18px] h-[18px]" />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && <DashboardTab refreshKey={refreshKey} />}
            {activeTab === "students" && <StudentsTab onRefresh={triggerRefresh} />}
            {activeTab === "certificates" && <CertificatesTab onRefresh={triggerRefresh} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const CHART_COLORS = {
  blue: "#6366f1", green: "#10b981", amber: "#f59e0b",
  red: "#ef4444", purple: "#8b5cf6", teal: "#14b8a6",
  pink: "#ec4899", cyan: "#06b6d4",
};

// ── DashboardTab: nhận refreshKey để tự reload khi có thay đổi ──────────
function DashboardTab({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = useState({ total: 0, signed: 0, pending: 0, totalStudents: 0 });
  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    // Tách riêng 2 fetch để Fabric lỗi không ảnh hưởng đến danh sách sinh viên
    const svPromise = store.getStudents().catch(() => [] as Student[]);
    const ccPromise = store.getCertificates().catch(() => [] as Certificate[]);

    Promise.all([svPromise, ccPromise])
      .then(([sv, cc]) => {
        setStudents(sv);
        setCertificates(cc);
        setStats({
          totalStudents: sv.length,
          total: cc.length,
          signed: cc.filter((c: Certificate) => c.trangThai === 'da_ky').length,
          pending: cc.filter((c: Certificate) => c.trangThai === 'cho_ky').length,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  // Re-load khi refreshKey thay đổi (có thêm sinh viên / chứng chỉ mới)
  useEffect(() => { loadData(); }, [loadData, refreshKey]);
  // Auto-refresh mỗi 15s
  useEffect(() => {
    const id = setInterval(loadData, 15000);
    return () => clearInterval(id);
  }, [loadData]);

  const pieData = [
    { name: "Đã ký", value: stats.signed, color: CHART_COLORS.green },
    { name: "Chờ ký", value: stats.pending, color: CHART_COLORS.amber },
  ];
  const khoaData = students.reduce((acc, s) => {
    const k = acc.find((a) => a.name === s.khoa);
    if (k) k.value++; else acc.push({ name: s.khoa, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);
  const loaiData = certificates.reduce((acc, c) => {
    const k = acc.find((a) => a.name === c.loaiChungChi);
    if (k) k.value++; else acc.push({ name: c.loaiChungChi, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Tạo monthData động từ certificates thực tế
  const monthData = (() => {
    const map: Record<string, { capMoi: number; daKy: number }> = {};
    certificates.forEach((c) => {
      if (!c.ngayCap) return;
      const d = new Date(c.ngayCap);
      const key = `T${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!map[key]) map[key] = { capMoi: 0, daKy: 0 };
      map[key].capMoi++;
      if (c.trangThai === 'da_ky') map[key].daKy++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
  })();

  const statCards = [
    { title: "Tổng sinh viên", value: stats.totalStudents, icon: Users, gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
    { title: "Tổng chứng chỉ", value: stats.total, icon: FileText, gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20" },
    { title: "Đã ký điện tử", value: stats.signed, icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
    { title: "Chờ ký", value: stats.pending, icon: Clock, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-400 mt-1">Quản lý chứng chỉ Đại học Văn Lang</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200/60 px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">{new Date().toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{card.value}</p>
              </div>
              <div className={`w-11 h-11 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg ${card.shadow}`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="chart-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              Trạng thái chứng chỉ
            </h3>
          </div>
          {stats.total > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={6} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">{item.name}</span>
                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                      </div>
                      <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / stats.total) * 100}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Tỉ lệ hoàn thành</p>
                  <p className="text-2xl font-black text-slate-900">{stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 0}%</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-16 text-sm">Chưa có dữ liệu</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="chart-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full" />
              Sinh viên theo khoa
            </h3>
          </div>
          {khoaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={khoaData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Số sinh viên" />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.blue} />
                    <stop offset="100%" stopColor={CHART_COLORS.purple} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-16 text-sm">Chưa có dữ liệu</p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="chart-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Xu hướng cấp chứng chỉ
            </h3>
          </div>
          {monthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <defs>
                  <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="capMoi" stroke={CHART_COLORS.blue} fill="url(#areaBlue)" strokeWidth={2.5} name="Cấp mới" dot={{ r: 4, fill: CHART_COLORS.blue }} />
                <Area type="monotone" dataKey="daKy" stroke={CHART_COLORS.green} fill="url(#areaGreen)" strokeWidth={2.5} name="Đã ký" dot={{ r: 4, fill: CHART_COLORS.green }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-16 text-sm">Chưa có dữ liệu</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="chart-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full" />
              Theo loại
            </h3>
          </div>
          <div className="space-y-3">
            {loaiData.map((item, i) => {
              const colors = [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.purple];
              const color = colors[i % colors.length];
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{item.name}</span>
                    <span className="text-xs font-bold text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / certificates.length) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
            {loaiData.length === 0 && <p className="text-slate-400 text-center py-10 text-sm">Chưa có dữ liệu</p>}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="chart-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            Chứng chỉ gần đây
          </h3>
        </div>
        {certificates.length > 0 ? (
          <div className="space-y-2">
            {[...certificates].reverse().slice(0, 8).map((c, i) => {
              const sv = students.find((s: Student) => s.id === c.studentId || s._id === c.studentId);
              return (
                <motion.div
                  key={c.maChungChi}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.trangThai === "da_ky" ? "bg-emerald-100" : "bg-amber-100"}`}>
                      {c.trangThai === "da_ky" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{c.tenChungChi}</p>
                      <p className="text-xs text-slate-400">{sv?.hoTen || c.hoTen} · {c.maChungChi}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${c.trangThai === "da_ky" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                    {c.trangThai === "da_ky" ? "Đã ký" : "Chờ ký"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-10 text-sm">Chưa có chứng chỉ nào</p>
        )}
      </motion.div>
    </div>
  );
}
function StudentsTab({ onRefresh }: { onRefresh: () => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [svLoading, setSvLoading] = useState(true);

  const refreshStudents = useCallback(() => {
    store.getStudents().then(setStudents).finally(() => setSvLoading(false));
    onRefresh(); // cũng cập nhật DashboardTab
  }, [onRefresh]);

  useEffect(() => { refreshStudents(); }, []);

  const handleDelete = async (s: Student) => {
    if (!confirm(`Xóa sinh viên ${s.hoTen}?`)) return;
    try {
      await api.deleteStudent(s._id || s.id);
      refreshStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = searchQuery
    ? students.filter(sv =>
        sv.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sv.maSV.includes(searchQuery) ||
        sv.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý sinh viên</h1>
          <p className="text-sm text-slate-400 mt-1">{students.length} sinh viên trong hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshStudents} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setShowForm(true); setEditingStudent(null); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo tài khoản
          </button>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sinh viên..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
          />
        </div>
      </div>

      {viewingStudent && (
        <StudentDetailModal student={viewingStudent} onClose={() => setViewingStudent(null)} onEdit={(s) => { setViewingStudent(null); setEditingStudent(s); setShowForm(true); }} />
      )}

      {showForm && (
        <StudentFormModal
          student={editingStudent}
          onClose={() => { setShowForm(false); setEditingStudent(null); }}
          onSave={() => { setShowForm(false); setEditingStudent(null); refreshStudents(); }}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã SV</th>
                <th className="text-left py-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Họ và tên</th>
                <th className="text-left py-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left py-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khoa</th>
                <th className="text-left py-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mật khẩu</th>
                <th className="text-right py-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {svLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-300 text-sm">Đang tải...</td></tr>
              ) : filtered.map((s, i) => (
                <motion.tr
                  key={s._id || s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="py-3.5 px-5 text-xs font-mono text-slate-500">{s.maSV}</td>
                  <td className="py-3.5 px-5">
                    <button onClick={() => setViewingStudent(s)} className="flex items-center gap-3 group/name">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {s.hoTen.charAt(s.hoTen.lastIndexOf(" ") + 1)}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 group-hover/name:text-blue-600 transition-colors">{s.hoTen}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-sm text-slate-400">{s.email}</td>
                  <td className="py-3.5 px-5">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{s.khoa}</span>
                  </td>
                  <td className="py-3.5 px-5 text-xs font-mono">
                    {s.matKhauGoc ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded select-all">{s.matKhauGoc}</span>
                        <button onClick={() => navigator.clipboard.writeText(s.matKhauGoc || '')} className="text-slate-300 hover:text-blue-500 transition-colors" title="Copy mật khẩu">⧉</button>
                      </span>
                    ) : <span className="text-slate-300 italic">—</span>}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingStudent(s)} className="p-2 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingStudent(s); setShowForm(true); }} className="p-2 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s)} className="p-2 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!svLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-slate-300 text-sm">Không tìm thấy sinh viên nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function StudentDetailModal({ student, onClose, onEdit }: { student: Student; onClose: () => void; onEdit: (s: Student) => void }) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  useEffect(() => { store.getCertificatesByStudent(student._id || student.id).then(setCerts); }, [student]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Thông tin sinh viên</h2>
          <div className="flex gap-2">
            <button onClick={() => onEdit(student)} className="btn-primary text-xs px-4 py-2">Chỉnh sửa</button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-black text-white">{student.hoTen.charAt(student.hoTen.lastIndexOf(" ") + 1)}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{student.hoTen}</h3>
              <p className="text-sm text-slate-400 font-mono">{student.maSV}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Mail, label: "Email", value: student.email },
              { icon: Calendar, label: "Ngày sinh", value: student.ngaySinh },
              { icon: User, label: "Giới tính", value: student.gioiTinh },
              { icon: GraduationCap, label: "Khoa", value: student.khoa },
              { icon: BookOpen, label: "Ngành", value: student.nganh },
              { icon: Calendar, label: "Khóa học", value: student.khoaHoc },
              { icon: Phone, label: "Số điện thoại", value: student.soDienThoai },
              { icon: MapPin, label: "Địa chỉ", value: student.diaChi },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3 h-3 text-slate-400" /><p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p></div>
                <p className="text-sm font-medium text-slate-700">{value || "—"}</p>
              </div>
            ))}
          </div>
          {certs.length > 0 && (
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-blue-500" />Chứng chỉ ({certs.length})</h4>
              <div className="space-y-2">
                {certs.map((c) => (
                  <div key={c.maChungChi} className="flex items-center justify-between bg-slate-50 rounded-xl p-3.5">
                    <div><p className="text-sm font-semibold text-slate-800">{c.tenChungChi}</p><p className="text-xs text-slate-400 font-mono">{c.maChungChi}</p></div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.trangThai === "da_ky" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                      {c.trangThai === "da_ky" ? "Đã ký" : "Chờ ký"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StudentFormModal({ student, onClose, onSave }: { student: Student | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    hoTen: student?.hoTen || "",
    email: student?.email || "",
    password: "",
    maSV: student?.maSV || "",
    ngaySinh: student?.ngaySinh || "",
    gioiTinh: student?.gioiTinh || "Nam",
    khoa: student?.khoa || "",
    nganh: student?.nganh || "",
    khoaHoc: student?.khoaHoc || "",
    soDienThoai: student?.soDienThoai || "",
    diaChi: student?.diaChi || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.hoTen || !form.email || !form.maSV) { setError("Vui lòng điền đầy đủ thông tin bắt buộc"); return; }
    if (!student && !form.password) { setError("Mật khẩu là bắt buộc khi tạo tài khoản mới"); return; }
    setSubmitting(true);
    setError("");
    try {
      if (student) {
        // Cập nhật sinh viên
        await api.updateStudent(student._id || student.id, form);
      } else {
        // Tạo mới
        await api.registerStudent({ ...form, matKhauGoc: form.password });
      }
      onSave();
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: "hoTen", label: "Họ và tên", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "password", label: student ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu", type: "text", required: !student },
    { key: "maSV", label: "Mã sinh viên", type: "text", required: true },
    { key: "ngaySinh", label: "Ngày sinh", type: "date", required: false },
    { key: "khoa", label: "Khoa", type: "text", required: false },
    { key: "nganh", label: "Ngành", type: "text", required: false },
    { key: "khoaHoc", label: "Khóa học", type: "text", required: false },
    { key: "soDienThoai", label: "Số điện thoại", type: "text", required: false },
    { key: "diaChi", label: "Địa chỉ", type: "text", required: false },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{student ? "Chỉnh sửa sinh viên" : "Tạo tài khoản sinh viên"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Giới tính</label>
            <select value={form.gioiTinh} onChange={(e) => setForm({ ...form, gioiTinh: e.target.value })} className="input-field">
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              <input type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="input-field" />
            </div>
          ))}
          <div className="flex gap-3 pt-3">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Hủy</button>
            <button onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
              {submitting ? (<><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang lưu...</>) : (student ? "Cập nhật" : "Tạo tài khoản")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
function CertificatesTab({ onRefresh }: { onRefresh: () => void }) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "da_ky" | "cho_ky">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [txNotif, setTxNotif] = useState<{ msg: string; txId: string; block: number } | null>(null);

  const refreshCerts = useCallback(() => {
    store.getCertificates().catch(() => [] as Certificate[]).then(setCertificates);
    store.getStudents().catch(() => [] as Student[]).then(setStudents);
    onRefresh(); // đồng bộ DashboardTab
  }, [onRefresh]);

  useEffect(() => { refreshCerts(); }, []);

  const showTxNotif = (msg: string, txId: string, block: number) => {
    setTxNotif({ msg, txId, block });
    setTimeout(() => setTxNotif(null), 5000);
  };

  const handleSign = async (cert: Certificate) => {
    setLoadingId(cert.maChungChi);
    try {
      const signed = await store.signCertificate(cert.maChungChi, cert.nguoiKy);
      if (signed?.data?.signTxId) showTxNotif(`signCredential: ${cert.maChungChi}`, signed.data.signTxId, 0);
      refreshCerts();
    } finally { setLoadingId(null); }
  };

  const handleDeleteCert = async (cert: Certificate) => {
    if (!confirm("Bạn có chắc muốn xóa chứng chỉ này?")) return;
    setLoadingId(cert.maChungChi);
    try { await store.deleteCertificate(cert.maChungChi); refreshCerts(); }
    finally { setLoadingId(null); }
  };

  const visibleStudents = students.filter((s) => {
    if (filterStatus === "all") return true;
    return certificates.some((c) => (c.studentId === s._id || c.studentId === s.id) && c.trangThai === filterStatus);
  });

  return (
    <div>
      <AnimatePresence>
        {txNotif && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-slate-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-400">✓ Fabric Transaction Committed</p>
              <p className="text-[10px] text-slate-300">{txNotif.msg}</p>
              <p className="text-[10px] font-mono text-slate-400 truncate">txId: {txNotif.txId.slice(0, 32)}... · block #{txNotif.block}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cấp chứng chỉ</h1>
          <p className="text-sm text-slate-400 mt-1">Chọn sinh viên để quản lý chứng chỉ</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshCerts} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200/60 p-1 shadow-sm">
            {[{ key: "all" as const, label: "Tất cả" }, { key: "da_ky" as const, label: "Đã ký" }, { key: "cho_ky" as const, label: "Chờ ký" }].map((f) => (
              <button key={f.key} onClick={() => setFilterStatus(f.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${filterStatus === f.key ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentCertModal
          student={selectedStudent}
          onClose={() => { setSelectedStudent(null); refreshCerts(); }}
          onAddCert={() => { setShowCertForm(true); setEditingCert(null); }}
          onEditCert={(c) => { setEditingCert(c); setShowCertForm(true); }}
          onSign={handleSign}
          onRefresh={refreshCerts}
          onDeleteCert={handleDeleteCert}
          loadingId={loadingId}
        />
      )}

      {showCertForm && selectedStudent && (
        <CertFormModal
          student={selectedStudent}
          cert={editingCert}
          onClose={() => { setShowCertForm(false); setEditingCert(null); }}
          onSave={() => { setShowCertForm(false); setEditingCert(null); refreshCerts(); }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleStudents.map((s, i) => {
          const certs = certificates.filter((c) => c.studentId === s._id || c.studentId === s.id);
          const signed = certs.filter((c) => c.trangThai === "da_ky").length;
          const pending = certs.filter((c) => c.trangThai === "cho_ky").length;
          return (
            <motion.button key={s._id || s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedStudent(s)}
              className="bg-white rounded-2xl border border-slate-200/60 p-5 text-left hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 hover:border-blue-300/50 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                  {s.hoTen.charAt(s.hoTen.lastIndexOf(" ") + 1)}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{s.hoTen}</p>
                  <p className="text-xs text-slate-400 font-mono">{s.maSV}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-200/60">{certs.length} chứng chỉ</span>
                {signed > 0 && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-200/60">{signed} đã ký</span>}
                {pending > 0 && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-200/60">{pending} chờ ký</span>}
              </div>
            </motion.button>
          );
        })}
        {visibleStudents.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-300 text-sm">Không có sinh viên nào</div>
        )}
      </div>
    </div>
  );
}

function StudentCertModal({ student, onClose, onAddCert, onEditCert, onSign, onRefresh, onDeleteCert, loadingId }: {
  student: Student; onClose: () => void; onAddCert: () => void;
  onEditCert: (c: Certificate) => void; onSign: (c: Certificate) => void; onRefresh: () => void; onDeleteCert: (c: Certificate) => void;
  loadingId: string | null;
}) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const loadCerts = useCallback(() => store.getCertificatesByStudent(student._id || student.id).then(setCerts), [student]);
  useEffect(() => { loadCerts(); }, [student, loadingId]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              {student.hoTen.charAt(student.hoTen.lastIndexOf(" ") + 1)}
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{student.hoTen}</h2>
              <p className="text-xs text-slate-400 font-mono">{student.maSV}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onAddCert} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />Cấp chứng chỉ
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6">
          {certs.length > 0 ? (
            <div className="space-y-3">
              {certs.map((c) => (
                <div key={c.maChungChi} className="bg-slate-50 rounded-xl p-5 hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{c.tenChungChi}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{c.maChungChi}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${c.trangThai === "da_ky" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                      {c.trangThai === "da_ky" ? "Đã ký" : "Chờ ký"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{c.moTa}</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-xs"><span className="text-slate-400">Loại:</span> <span className="font-medium text-slate-600">{c.loaiChungChi}</span></div>
                    <div className="text-xs"><span className="text-slate-400">Xếp loại:</span> <span className="font-medium text-slate-600">{c.xepLoai}</span></div>
                    <div className="text-xs"><span className="text-slate-400">Ngày cấp:</span> <span className="font-medium text-slate-600">{c.ngayCap}</span></div>
                  </div>
                  <div className="flex gap-2">
                    {c.trangThai === "cho_ky" && (
                      <button onClick={() => onSign(c)} disabled={loadingId === c.maChungChi}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-1 disabled:opacity-70">
                        {loadingId === c.maChungChi ? (<><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang ký...</>) : (<><CheckCircle2 className="w-3 h-3" />Ký điện tử</>)}
                      </button>
                    )}
                    <button onClick={() => onEditCert(c)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-1">
                      <Pencil className="w-3 h-3" />Sửa
                    </button>
                    <button onClick={() => onDeleteCert(c)} className="px-3 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-50 transition-all flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Chưa có chứng chỉ nào</p>
              <button onClick={onAddCert} className="btn-primary text-xs mt-4 px-4 py-2">Cấp chứng chỉ mới</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CertFormModal({ student, cert, onClose, onSave }: {
  student: Student; cert: Certificate | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    tenChungChi: cert?.tenChungChi || "",
    moTa: cert?.moTa || "",
    ngayCap: cert?.ngayCap || new Date().toISOString().split("T")[0],
    loaiChungChi: cert?.loaiChungChi || "Tốt nghiệp",
    xepLoai: cert?.xepLoai || "Giỏi",
    nguoiKy: cert?.nguoiKy || "PGS.TS Nguyễn Cao Trí",
    maChungChi: cert?.maChungChi || `VLU-${Date.now().toString().slice(-8)}`,
  });

  const [submitting, setSubmitting] = useState(false);
  const [fabricInfo, setFabricInfo] = useState<{ txId: string; block: number } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.tenChungChi || !form.maChungChi) { setError("Vui lòng điền tên và mã chứng chỉ"); return; }
    setSubmitting(true);
    setError("");
    try {
      const newCert = await store.addCertificate({
        ...form,
        studentId: student._id || student.id,
        maSV: student.maSV,
        hoTen: student.hoTen,
        khoa: student.khoa,
        nganh: student.nganh,
      });
      if (newCert?.data?.txId) {
        setFabricInfo({ txId: newCert.data.txId, block: newCert.data.fabricBlock || 0 });
        setTimeout(() => onSave(), 2000);
      } else {
        onSave();
      }
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{cert ? "Sửa chứng chỉ" : "Cấp chứng chỉ mới"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200/60">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-800">{student.hoTen}</p>
              <p className="text-xs text-blue-500 font-mono">{student.maSV}</p>
            </div>
          </div>
          {[
            { key: "tenChungChi", label: "Tên chứng chỉ", type: "text" },
            { key: "moTa", label: "Mô tả", type: "text" },
            { key: "maChungChi", label: "Mã chứng chỉ", type: "text" },
            { key: "ngayCap", label: "Ngày cấp", type: "date" },
            { key: "nguoiKy", label: "Người ký", type: "text" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="input-field" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Loại chứng chỉ</label>
              <select value={form.loaiChungChi} onChange={(e) => setForm({ ...form, loaiChungChi: e.target.value })} className="input-field">
                <option>Tốt nghiệp</option><option>Chứng chỉ nghề</option><option>Học bổng</option>
                <option>Tin học</option><option>Ngoại ngữ</option><option>Kỹ năng mềm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wider">Xếp loại</label>
              <select value={form.xepLoai} onChange={(e) => setForm({ ...form, xepLoai: e.target.value })} className="input-field">
                <option>Xuất sắc</option><option>Giỏi</option><option>Khá</option><option>Trung bình</option><option>Đạt</option>
              </select>
            </div>
          </div>
          <AnimatePresence>
            {fabricInfo && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-slate-900 rounded-xl p-3 flex items-start gap-2">
                <div className="w-2 h-2 mt-1 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-emerald-400">✓ issueCredential — Committed to Fabric Ledger</p>
                  <p className="text-[10px] font-mono text-slate-400 break-all">txId: {fabricInfo.txId.slice(0, 40)}...</p>
                  <p className="text-[10px] text-slate-500">Block #{fabricInfo.block} · channel: mychannel · peer0.org1</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-3 pt-3">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={submitting}>Hủy</button>
            <button onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={submitting}>
              {submitting ? (<><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Gọi issueCredential...</>) : (cert ? "Cập nhật" : "Cấp chứng chỉ")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
