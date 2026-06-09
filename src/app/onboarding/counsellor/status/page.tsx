"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  RefreshCw,
  LogIn,
  Mail,
  Shield,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/config/constants";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type AppStatus = "pending" | "approved" | "rejected" | "none" | "loading";

interface ApplicationData {
  status: AppStatus;
  tier?: string;
  admin_note?: string;
  specialisations?: string[];
  reviewed_at?: string;
  created_at?: string;
}

export default function CounsellorStatusPage() {
  const router = useRouter();
  const [data, setData] = useState<ApplicationData>({ status: "loading" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_BASE}/counsellor/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        router.push("/login");
        return;
      }

      setData(json.data || { status: "none" });
    } catch {
      setData({ status: "none" });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchStatus(), 60_000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    loading: {
      icon: Clock,
      color: "text-ventsafe-foreground",
      bg: "bg-ventsafe-foreground/10",
      border: "border-ventsafe-foreground/20",
      title: "Checking status...",
      message: "",
    },
    pending: {
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      title: "Application Under Review",
      message:
        "Your application has been received and is currently being reviewed by our admin team. This typically takes 2–5 business days. You will receive an email when a decision is made.",
    },
    approved: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      title: "Application Approved! 🎉",
      message:
        "Congratulations! Your application has been approved. Your account is now fully active as a counsellor. You can log in and start supporting students.",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      title: "Application Not Approved",
      message:
        "Unfortunately your application was not approved at this time. You can still use VentSafe as a student. You are welcome to reapply in the future.",
    },
    none: {
      icon: Shield,
      color: "text-ventsafe-foreground",
      bg: "bg-ventsafe-foreground/5",
      border: "border-ventsafe-foreground/20",
      title: "No Application Found",
      message: "We could not find a counsellor application for your account.",
    },
  };

  const config = statusConfig[data.status] || statusConfig.loading;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col">
      <header className="p-6 md:pl-25 flex items-center justify-between w-full relative">
        <div className="flex-1 flex justify-center md:justify-start">
          <Logo />
        </div>
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-3">
              <div className="flex items-center gap-2 bg-ventsafe-foreground/8 border border-ventsafe-foreground/20 rounded-full px-4 py-1.5">
                <BadgeCheck className="w-4 h-4 text-ventsafe-foreground" />
                <span className="text-xs font-semibold text-ventsafe-foreground tracking-wide">
                  Application Status
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-ventsafe-foreground">
              Counsellor Application
            </h1>
          </motion.div>

          {/* Status card */}
          <AnimatePresence mode="wait">
            {data.status !== "loading" && (
              <motion.div
                key={data.status}
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -16 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className={`rounded-2xl border-2 p-8 ${config.bg} ${config.border} mb-6`}
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    delay: 0.1,
                  }}
                  className="flex justify-center mb-5"
                >
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${config.bg} border-2 ${config.border}`}
                  >
                    <Icon className={`w-10 h-10 ${config.color}`} />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-xl font-bold text-center mb-3 ${config.color}`}
                >
                  {config.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm text-ventsafe-foreground/70 text-center leading-relaxed"
                >
                  {config.message}
                </motion.p>

                {/* Rejection reason */}
                {data.status === "rejected" && data.admin_note && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 bg-red-100 border border-red-300 rounded-xl p-4"
                  >
                    <p className="text-xs font-semibold text-red-700 mb-1">
                      Reason:
                    </p>
                    <p className="text-sm text-red-800">{data.admin_note}</p>
                  </motion.div>
                )}

                {/* Application details */}
                {data.status !== "none" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="mt-5 pt-5 border-t border-current/10 grid grid-cols-2 gap-3"
                  >
                    {data.tier && (
                      <div className="text-center">
                        <p className="text-xs text-ventsafe-foreground/40 mb-0.5">
                          Tier
                        </p>
                        <p className="text-sm font-semibold text-ventsafe-foreground capitalize">
                          {data.tier}
                        </p>
                      </div>
                    )}
                    {data.created_at && (
                      <div className="text-center">
                        <p className="text-xs text-ventsafe-foreground/40 mb-0.5">
                          Submitted
                        </p>
                        <p className="text-sm font-semibold text-ventsafe-foreground">
                          {new Date(data.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {data.reviewed_at && (
                      <div className="text-center col-span-2">
                        <p className="text-xs text-ventsafe-foreground/40 mb-0.5">
                          Reviewed
                        </p>
                        <p className="text-sm font-semibold text-ventsafe-foreground">
                          {new Date(data.reviewed_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          {data.status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <RefreshCw className="w-8 h-8 text-ventsafe-foreground/40" />
              </motion.div>
              <p className="text-sm text-ventsafe-foreground/50">
                Checking your application status...
              </p>
            </motion.div>
          )}

          {/* Action buttons */}
          {data.status !== "loading" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-3"
            >
              {/* Approved — go to vent space */}
              {data.status === "approved" && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/vent-space")}
                  className="w-full flex items-center justify-center gap-2 bg-ventsafe-foreground text-white px-6 py-3.5 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-ventsafe-foreground/20"
                >
                  <LogIn className="w-5 h-5" />
                  Go to Vent Space
                </motion.button>
              )}

              {/* Rejected — reapply or continue as student */}
              {data.status === "rejected" && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/onboarding/counsellor")}
                  className="w-full flex items-center justify-center gap-2 bg-ventsafe-foreground text-white px-6 py-3.5 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-ventsafe-foreground/20"
                >
                  Reapply
                </motion.button>
              )}

              {/* No application — start onboarding */}
              {data.status === "none" && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/onboarding/counsellor")}
                  className="w-full flex items-center justify-center gap-2 bg-ventsafe-foreground text-white px-6 py-3.5 rounded-ventsafe-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-ventsafe-foreground/20"
                >
                  Start Onboarding
                </motion.button>
              )}

              {/* Pending — email reminder */}
              {data.status === "pending" && (
                <div className="flex items-center justify-center gap-2 text-xs text-ventsafe-foreground/50 bg-ventsafe-foreground/5 rounded-xl py-3 px-4">
                  <Mail className="w-4 h-4" />
                  You will be notified by email when a decision is made.
                </div>
              )}

              {/* Refresh button — always visible except approved */}
              {data.status !== "approved" && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fetchStatus(true)}
                  disabled={isRefreshing}
                  className="w-full flex items-center justify-center gap-2 border border-ventsafe-foreground/20 text-ventsafe-foreground/70 px-6 py-3 rounded-ventsafe-sm text-sm font-medium hover:bg-ventsafe-foreground/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh Status"}
                </motion.button>
              )}

              {/* Always — browse as student */}
              {data.status !== "approved" && (
                <button
                  onClick={() => router.push("/vent-space")}
                  className="text-sm text-ventsafe-foreground/40 hover:text-ventsafe-foreground text-center cursor-pointer transition-colors"
                >
                  Continue browsing as a student →
                </button>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
