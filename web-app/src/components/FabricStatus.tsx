import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchNetworkStatus, EXPECTED_CONTAINERS, type FabricNetworkStatus } from "@/lib/fabric";
import { Server, Cpu, Activity, ChevronDown, ChevronUp, CheckCircle2, XCircle, Layers, Wifi, WifiOff } from "lucide-react";

export default function FabricStatus() {
  const [status, setStatus] = useState<FabricNetworkStatus | null>(null);
  const [expanded, setExpanded] = useState(false);

  const refresh = async () => {
    const s = await fetchNetworkStatus();
    setStatus(s);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  const isConnected = status.connected;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px]">
      <motion.div
        onClick={() => setExpanded(e => !e)}
        className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl px-4 py-3 cursor-pointer select-none shadow-2xl border border-slate-700/60"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-xs font-bold text-slate-100 tracking-wide">HyperLedger Fabric Network</span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected
              ? <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">Connected</span>
              : <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold border border-red-500/30">Offline</span>
            }
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{status.channel}</span>
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{status.chaincode}</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" />Fabric v2.2</span>
          {isConnected ? <Wifi className="w-3 h-3 text-emerald-400 ml-auto" /> : <WifiOff className="w-3 h-3 text-red-400 ml-auto" />}
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-2.5 border-b border-slate-700/60">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Docker Containers</p>
            </div>
            <div className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto">
              {EXPECTED_CONTAINERS.map(c => (
                <div key={c.name} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${isConnected ? "bg-slate-800/60 hover:bg-slate-800" : "bg-slate-800/30"}`}>
                  {isConnected
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-slate-100 truncate">{c.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{c.image}</p>
                  </div>
                  {c.port && <p className="text-[9px] text-slate-400 font-mono flex-shrink-0">:{c.port}</p>}
                </div>
              ))}
            </div>
            {!isConnected && (
              <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/20">
                <p className="text-[10px] text-red-400 font-semibold">⚠ Backend không phản hồi</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Kiểm tra server đang chạy trên port 4000</p>
                {status.error && <p className="text-[9px] text-red-500 mt-0.5 font-mono">{status.error}</p>}
              </div>
            )}
            <div className="px-3 py-2 border-t border-slate-700/60">
              <p className="text-[9px] text-slate-500 text-center">
                <Server className="w-2.5 h-2.5 inline mr-1" />
                Cập nhật lúc {status.lastChecked} · mỗi 10 giây
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
