"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Crown,
  UserPlus,
  ArrowUpCircle,
  ArrowDownCircle,
  PowerOff,
  RefreshCw,
  Check,
} from "lucide-react";
import { useAdminAuth } from "../../_context/AdminAuthContext";
import { ADMIN_API, AdminUser, timeAgo } from "../../utils";

export default function AdminsClient() {
  const { admin: currentAdmin } = useAdminAuth();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if not super admin
  useEffect(() => {
    if (!currentAdmin.is_super_admin) router.replace("/admin");
  }, [currentAdmin]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${ADMIN_API}/admins`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAdmins(d.data.admins);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/admins`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          email: form.email,
          fullName: form.fullName,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setFormError(data.message);
        return;
      }
      setShowCreate(false);
      setForm({ fullName: "", username: "", email: "", password: "" });
      load();
    } catch {
      setFormError("Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  const doAction = async (
    adminId: string,
    action: "promote" | "demote" | "deactivate",
  ) => {
    const key = adminId + action;
    setActionLoading(key);
    try {
      const method = action === "deactivate" ? "DELETE" : "PATCH";
      const url =
        action === "deactivate"
          ? `${ADMIN_API}/admins/${adminId}`
          : `${ADMIN_API}/admins/${adminId}/${action}`;
      const res = await fetch(url, { method, credentials: "include" });
      const data = await res.json();
      if (!data.success) {
        alert(data.message);
        return;
      }
      load();
    } catch {
      alert("Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ventsafe-foreground">
            Manage Admins
          </h1>
          <p className="text-sm text-ventsafe-foreground/50 mt-1">
            Create, promote and manage admin accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={load}
            className="flex items-center gap-2 text-sm text-ventsafe-foreground/50 hover:text-ventsafe-foreground border border-ventsafe-foreground/15 px-3 py-2 rounded-ventsafe-sm hover:bg-ventsafe-foreground/5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-ventsafe-foreground text-white px-4 py-2 rounded-ventsafe-sm text-sm font-semibold hover:opacity-90 cursor-pointer shadow-md shadow-ventsafe-foreground/20"
          >
            <UserPlus className="w-4 h-4" />
            New Admin
          </motion.button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form
              onSubmit={createAdmin}
              className="bg-white border border-ventsafe-border/40 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <UserPlus className="w-4 h-4 text-ventsafe-foreground" />
                <h3 className="text-sm font-bold text-ventsafe-foreground">
                  Create New Admin
                </h3>
                <p className="text-xs text-ventsafe-foreground/40 ml-1">
                  · Starts as regular admin — promote after creation if needed
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  {
                    key: "fullName",
                    label: "Full Name",
                    type: "text",
                    placeholder: "John Doe",
                  },
                  {
                    key: "username",
                    label: "Username",
                    type: "text",
                    placeholder: "john_admin",
                  },
                  {
                    key: "email",
                    label: "Email",
                    type: "email",
                    placeholder: "john@ventsafe.com",
                  },
                  {
                    key: "password",
                    label: "Password",
                    type: "password",
                    placeholder: "Min. 8 characters",
                  },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-ventsafe-foreground/60 mb-1.5">
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      placeholder={placeholder}
                      required
                      className="w-full px-4 py-2.5 bg-ventsafe-foreground/5 border border-ventsafe-foreground/15 rounded-ventsafe-sm text-ventsafe-foreground text-sm placeholder-ventsafe-foreground/25 focus:outline-none focus:border-ventsafe-foreground transition-colors"
                    />
                  </div>
                ))}
              </div>

              {formError && (
                <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setFormError("");
                  }}
                  className="flex-1 border border-ventsafe-foreground/20 text-ventsafe-foreground/60 py-2.5 rounded-ventsafe-sm text-sm hover:bg-ventsafe-foreground/5 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-ventsafe-foreground text-white py-2.5 rounded-ventsafe-sm text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-60 shadow-md shadow-ventsafe-foreground/20"
                >
                  {formLoading ? "Creating..." : "Create Admin"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admins list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-ventsafe-foreground/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin, i) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.05,
                type: "spring",
                stiffness: 260,
                damping: 24,
              }}
              className={`bg-white border rounded-2xl p-5 shadow-sm ${
                !admin.is_active
                  ? "opacity-50 border-ventsafe-border/20"
                  : "border-ventsafe-border/40"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Info */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      admin.is_super_admin
                        ? "bg-yellow-100"
                        : "bg-ventsafe-foreground/8"
                    }`}
                  >
                    {admin.is_super_admin ? (
                      <Crown className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-ventsafe-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-ventsafe-foreground">
                        {admin.full_name}
                      </p>
                      {admin.id === currentAdmin.id && (
                        <span className="text-xs bg-ventsafe-foreground/10 text-ventsafe-foreground px-2 py-0.5 rounded-full font-medium">
                          You
                        </span>
                      )}
                      {admin.is_super_admin && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> Super Admin
                        </span>
                      )}
                      {!admin.is_active && (
                        <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ventsafe-foreground/40 mt-0.5">
                      @{admin.username} · {admin.email}
                    </p>
                    {admin.last_login && (
                      <p className="text-xs text-ventsafe-foreground/25 mt-0.5">
                        Last login {timeAgo(admin.last_login)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {admin.id !== currentAdmin.id && admin.is_active && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {admin.is_super_admin ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => doAction(admin.id, "demote")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 text-xs text-ventsafe-foreground/60 hover:text-ventsafe-foreground border border-ventsafe-foreground/15 hover:border-ventsafe-foreground/30 bg-ventsafe-foreground/5 hover:bg-ventsafe-foreground/10 px-3 py-1.5 rounded-full transition-all cursor-pointer disabled:opacity-50"
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        Demote
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => doAction(admin.id, "promote")}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-3 py-1.5 rounded-full transition-all cursor-pointer disabled:opacity-50"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        Promote to Super
                      </motion.button>
                    )}

                    {!admin.is_super_admin && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (confirm(`Deactivate ${admin.full_name}?`))
                            doAction(admin.id, "deactivate");
                        }}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-full transition-all cursor-pointer disabled:opacity-50"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        Deactivate
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Super admin note */}
                {admin.id !== currentAdmin.id && admin.is_super_admin && (
                  <div className="flex items-center gap-1.5 text-xs text-ventsafe-foreground/25">
                    <Check className="w-3 h-3" />
                    Can only be demoted
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
