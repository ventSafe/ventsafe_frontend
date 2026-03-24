"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useAdminAuthStore } from "../useAdminAuthStore";
import { ADMIN_API } from "../utils";

export default function AdminLoginClient() {
  const router = useRouter();
  const { setAdmin } = useAdminAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${ADMIN_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // CRITICAL: allows browser to store the httpOnly cookie
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials.");
        return;
      }

      // Store admin profile in Zustand (NOT the token — that is in httpOnly cookie)
      setAdmin(data.data.admin);

      // Navigate to dashboard
      router.replace("/admin");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ventsafe-background flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,5,98,0.06),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(0,5,98,0.04),transparent_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-white border border-ventsafe-border/40 rounded-2xl shadow-lg shadow-ventsafe-foreground/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ventsafe-foreground flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-ventsafe-foreground">
                Admin Portal
              </h1>
              <p className="text-xs text-ventsafe-foreground/50">
                Restricted access
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ventsafe-foreground/70 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
                autoComplete="username"
                className="w-full px-4 py-3 bg-ventsafe-foreground/5 border border-ventsafe-foreground/15 rounded-ventsafe-sm text-ventsafe-foreground text-sm placeholder-ventsafe-foreground/25 focus:outline-none focus:border-ventsafe-foreground transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ventsafe-foreground/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 bg-ventsafe-foreground/5 border border-ventsafe-foreground/15 rounded-ventsafe-sm text-ventsafe-foreground text-sm placeholder-ventsafe-foreground/25 focus:outline-none focus:border-ventsafe-foreground transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ventsafe-foreground/30 hover:text-ventsafe-foreground cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-ventsafe-foreground text-white py-3 rounded-ventsafe-sm text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 shadow-md shadow-ventsafe-foreground/20 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-ventsafe-foreground/25 mt-4">
          VentSafe Admin · Restricted Access
        </p>
      </motion.div>
    </div>
  );
}
