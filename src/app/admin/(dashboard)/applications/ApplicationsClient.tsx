"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
  FileCheck,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { useAdminAuth } from "../../_context/AdminAuthContext";
import { ADMIN_API, Application, timeAgo, formatDate } from "../../utils";

type Filter = "pending" | "approved" | "rejected" | "all";

// ─── Application Detail Modal ─────────────────────────────────────────────────

function ApplicationModal({
  app,
  onClose,
  onStatusChange,
}: {
  app: Application;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const approve = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${ADMIN_API}/applications/${app.id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      onStatusChange(app.id, "approved");
      onClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${ADMIN_API}/applications/${app.id}/reject`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
        return;
      }
      onStatusChange(app.id, "rejected");
      onClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  }[app.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-ventsafe-card border border-ventsafe-border/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ventsafe-border/30 sticky top-0 bg-ventsafe-card rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                app.tier === "professional" ? "bg-emerald-100" : "bg-blue-100"
              }`}
            >
              {app.tier === "professional" ? (
                <Stethoscope className="w-5 h-5 text-emerald-600" />
              ) : (
                <GraduationCap className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-ventsafe-foreground">
                {app.realName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors}`}
                >
                  {app.status}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    app.tier === "professional"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {app.tier}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ventsafe-foreground/30 hover:text-ventsafe-foreground cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Anonymous Name", value: app.anonymous_name },
              { label: "Gender", value: app.gender },
              { label: "Email", value: app.email },
              { label: "Submitted", value: formatDate(app.created_at) },
              ...(app.institution
                ? [{ label: "Institution", value: app.institution }]
                : []),
              ...(app.licenseNumber
                ? [{ label: "License Number", value: app.licenseNumber }]
                : []),
              ...(app.reviewed_by_name
                ? [{ label: "Reviewed By", value: app.reviewed_by_name }]
                : []),
              ...(app.reviewed_at
                ? [{ label: "Reviewed", value: formatDate(app.reviewed_at) }]
                : []),
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-ventsafe-foreground/3 rounded-xl p-3"
              >
                <p className="text-xs text-ventsafe-foreground/40 mb-1">
                  {label}
                </p>
                <p className="text-sm font-semibold text-ventsafe-foreground break-all">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Specialisations */}
          <div>
            <p className="text-xs font-semibold text-ventsafe-foreground/40 mb-2 uppercase tracking-wide">
              Specialisations
            </p>
            <div className="flex flex-wrap gap-2">
              {app.specialisations?.map((s) => (
                <span
                  key={s}
                  className="text-xs bg-ventsafe-foreground/8 text-ventsafe-foreground border border-ventsafe-foreground/15 px-3 py-1.5 rounded-full font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Statement */}
          <div>
            <p className="text-xs font-semibold text-ventsafe-foreground/40 mb-2 uppercase tracking-wide">
              Statement
            </p>
            <p className="text-sm text-ventsafe-foreground/70 bg-ventsafe-foreground/3 border border-ventsafe-foreground/8 rounded-xl p-4 leading-relaxed">
              {app.statement}
            </p>
          </div>

          {/* Document */}
          {app.document_url && (
            <div>
              <p className="text-xs font-semibold text-ventsafe-foreground/40 mb-2 uppercase tracking-wide">
                Certificate / Document
              </p>
              <a
                href={app.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-ventsafe-foreground font-medium bg-ventsafe-foreground/5 border border-ventsafe-foreground/15 px-4 py-2 rounded-ventsafe-sm hover:bg-ventsafe-foreground/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Document
              </a>
            </div>
          )}

          {/* Rejection note */}
          {app.admin_note && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-600 mb-1">
                Rejection Reason
              </p>
              <p className="text-sm text-red-700">{app.admin_note}</p>
            </div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2"
            >
              {error}
            </motion.p>
          )}

          {/* Actions */}
          {app.status === "pending" && (
            <div className="space-y-3 pt-2 border-t border-ventsafe-border/30">
              {showRejectForm ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ventsafe-foreground/60 mb-1.5">
                      Reason for rejection{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this application is being rejected..."
                      rows={3}
                      className="w-full px-4 py-3 bg-ventsafe-foreground/5 border border-ventsafe-foreground/20 rounded-ventsafe-sm text-ventsafe-foreground text-sm placeholder-ventsafe-foreground/25 focus:outline-none focus:border-ventsafe-foreground transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                        setError("");
                      }}
                      className="flex-1 border border-ventsafe-foreground/20 text-ventsafe-foreground/60 py-2.5 rounded-ventsafe-sm text-sm hover:bg-ventsafe-foreground/5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={reject}
                      disabled={loading}
                      className="flex-1 bg-red-500 text-white py-2.5 rounded-ventsafe-sm text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? "Rejecting..." : "Confirm Rejection"}
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 border border-red-200 text-red-500 py-3 rounded-ventsafe-sm text-sm font-semibold hover:bg-red-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reject
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={approve}
                    disabled={loading}
                    className="flex-1 bg-ventsafe-foreground text-ventsafe-background py-3 rounded-ventsafe-sm text-sm font-semibold hover:opacity-90 cursor-pointer disabled:opacity-60 shadow-md shadow-ventsafe-foreground/20 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? "Approving..." : "Approve"}
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Applications Page ────────────────────────────────────────────────────────

export default function ApplicationsClient() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((background = false) => {
    if (!background) setLoading(true);
    const url =
      filter === "all"
        ? `${ADMIN_API}/applications`
        : `${ADMIN_API}/applications?status=${filter}`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setApps(d.data.applications);
      })
      .finally(() => {
        if (!background) setLoading(false);
      });
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const statusIcon = (s: string) =>
    ({
      pending: <Clock className="w-4 h-4 text-amber-500" />,
      approved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      rejected: <XCircle className="w-4 h-4 text-red-500" />,
    })[s];

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ventsafe-foreground">
            Applications
          </h1>
          <p className="text-sm text-ventsafe-foreground/50 mt-1">
            Review counsellor applications
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => load()}
          className="flex items-center gap-2 text-sm text-ventsafe-foreground/50 hover:text-ventsafe-foreground border border-ventsafe-foreground/15 px-3 py-2 rounded-ventsafe-sm hover:bg-ventsafe-foreground/5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              filter === key
                ? "bg-ventsafe-foreground text-ventsafe-background shadow-md shadow-ventsafe-foreground/20"
                : "bg-ventsafe-foreground/8 text-ventsafe-foreground/60 hover:text-ventsafe-foreground hover:bg-ventsafe-foreground/15"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-ventsafe-foreground/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-ventsafe-foreground/5 flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-7 h-7 text-ventsafe-foreground/20" />
          </div>
          <p className="text-ventsafe-foreground/40 font-medium">
            No {filter} applications
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app, i) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.04,
                type: "spring",
                stiffness: 260,
                damping: 24,
              }}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.998 }}
              onClick={() => setSelected(app)}
              className="w-full bg-ventsafe-card border border-ventsafe-border/40 hover:border-ventsafe-foreground/30 rounded-2xl p-5 text-left transition-all cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      app.tier === "professional"
                        ? "bg-emerald-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {app.tier === "professional" ? (
                      <Stethoscope className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-ventsafe-foreground">
                        {app.realName}
                      </p>
                      <span className="text-xs text-ventsafe-foreground/30">
                        ({app.anonymous_name})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs font-semibold capitalize ${
                          app.tier === "professional"
                            ? "text-emerald-600"
                            : "text-blue-600"
                        }`}
                      >
                        {app.tier}
                      </span>
                      <span className="text-ventsafe-foreground/20">·</span>
                      <span className="text-xs text-ventsafe-foreground/40">
                        {timeAgo(app.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {statusIcon(app.status)}
                  <ChevronRight className="w-4 h-4 text-ventsafe-foreground/20 group-hover:text-ventsafe-foreground/50 transition-colors" />
                </div>
              </div>
              {app.specialisations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {app.specialisations.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-ventsafe-foreground/5 text-ventsafe-foreground/50 px-2 py-0.5 rounded-full border border-ventsafe-foreground/8"
                    >
                      {s}
                    </span>
                  ))}
                  {app.specialisations.length > 4 && (
                    <span className="text-xs text-ventsafe-foreground/30">
                      +{app.specialisations.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <ApplicationModal
            app={selected}
            onClose={() => setSelected(null)}
            onStatusChange={(id, newStatus) => {
              if (filter === "all") {
                setApps((prev) =>
                  prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
                );
              } else {
                setApps((prev) => prev.filter((a) => a.id !== id));
              }
              load(true); // background refresh
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
