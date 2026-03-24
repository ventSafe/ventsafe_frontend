"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, GraduationCap, Clock, CheckCircle2,
  XCircle, RefreshCw, AlertTriangle, ChevronRight, TrendingUp,
} from "lucide-react";
import { useAdminAuth } from "../_context/AdminAuthContext";
import { ADMIN_API, DashboardStats } from "../utils";


export default function DashboardClient() {
  const { admin } = useAdminAuth();
  const router = useRouter();

  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${ADMIN_API}/dashboard`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const statCards = stats ? [
    { label: "Total Students",     value: stats.totalStudents,          icon: Users,        bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-600",    iconBg: "bg-blue-100"    },
    { label: "Active Counsellors", value: stats.totalCounsellors,       icon: GraduationCap,bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", iconBg: "bg-emerald-100" },
    { label: "Pending Review",     value: stats.pendingApplications,    icon: Clock,        bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-600",   iconBg: "bg-amber-100"   },
    { label: "Approved",           value: stats.approvedApplications,   icon: CheckCircle2, bg: "bg-green-50",   border: "border-green-200",   text: "text-green-600",   iconBg: "bg-green-100"   },
    { label: "Rejected",           value: stats.rejectedApplications,   icon: XCircle,      bg: "bg-red-50",     border: "border-red-200",     text: "text-red-600",     iconBg: "bg-red-100"     },
  ] : [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ventsafe-foreground">Dashboard</h1>
          <p className="text-sm text-ventsafe-foreground/50 mt-1">
            Welcome back, {admin.full_name} 👋
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={load}
          className="flex items-center gap-2 text-sm text-ventsafe-foreground/50 hover:text-ventsafe-foreground border border-ventsafe-foreground/15 px-3 py-2 rounded-ventsafe-sm hover:bg-ventsafe-foreground/5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-ventsafe-foreground/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, bg, border, text, iconBg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
              className={`border rounded-2xl p-5 ${bg} ${border}`}
            >
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${text}`} />
              </div>
              <p className={`text-3xl font-bold ${text}`}>{value}</p>
              <p className="text-xs text-ventsafe-foreground/50 mt-1 font-medium">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pending alert */}
      {stats && stats.pendingApplications > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.998 }}
          onClick={() => router.push("/admin/applications")}
          className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between mb-6 cursor-pointer text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ventsafe-foreground">
                {stats.pendingApplications} application{stats.pendingApplications > 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-xs text-ventsafe-foreground/50">
                Click to review counsellor applications
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-500 shrink-0" />
        </motion.button>
      )}

      {/* Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-ventsafe-border/40 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-ventsafe-foreground" />
            <h2 className="text-sm font-bold text-ventsafe-foreground">Platform Overview</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "Counsellor approval rate",
                pct:   stats.approvedApplications + stats.rejectedApplications > 0
                  ? (stats.approvedApplications / (stats.approvedApplications + stats.rejectedApplications)) * 100
                  : 0,
                value: stats.approvedApplications + stats.rejectedApplications > 0
                  ? `${Math.round((stats.approvedApplications / (stats.approvedApplications + stats.rejectedApplications)) * 100)}%`
                  : "N/A",
                color: "bg-emerald-500",
              },
              {
                label: "Community members",
                pct:   100,
                value: `${stats.totalStudents + stats.totalCounsellors}`,
                color: "bg-ventsafe-foreground",
              },
            ].map(({ label, pct, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-ventsafe-foreground/60">{label}</span>
                  <span className="font-bold text-ventsafe-foreground">{value}</span>
                </div>
                <div className="h-2 bg-ventsafe-foreground/8 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}