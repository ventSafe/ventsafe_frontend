"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Search, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CounsellorEntry {
  id: string;
  anonymous_name: string;
  tier: "volunteer" | "professional";
  specialisations: string[];
  is_online: boolean;
  is_following: boolean;
  follower_count: number;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AvailableCounsellorsPage() {
  const { token } = useAuth();
  const [counsellors, setCounsellors] = useState<CounsellorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOnline, setFilterOnline] = useState(false);

  const fetchCounsellors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/counsellors/online`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        success: boolean;
        data: { counsellors: CounsellorEntry[] };
      };
      if (data.success) setCounsellors(data.data.counsellors);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void fetchCounsellors(); }, [fetchCounsellors]);

  const handleFollow = async (counsellorId: string) => {
    const res = await fetch(
      `${API_BASE_URL}/counsellors/${counsellorId}/follow`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );
    const data = (await res.json()) as {
      success: boolean;
      data: { following: boolean };
    };
    if (data.success) {
      setCounsellors((prev) =>
        prev.map((c) =>
          c.id === counsellorId ? { ...c, is_following: data.data.following } : c,
        ),
      );
    }
  };

  const filtered = counsellors.filter((c) => {
    const matchSearch =
      !search ||
      c.anonymous_name.toLowerCase().includes(search.toLowerCase()) ||
      c.specialisations.some((s) =>
        s.toLowerCase().includes(search.toLowerCase()),
      );
    const matchOnline = !filterOnline || c.is_online;
    return matchSearch && matchOnline;
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ventsafe-foreground">
            Available Counsellors
          </h1>
          <p className="text-sm text-ventsafe-foreground/50 mt-1">
            Follow a counsellor to see their posts in your feed and get support.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ventsafe-foreground/30"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or specialisation…"
              className="w-full pl-9 pr-4 py-2.5 border border-ventsafe-border rounded-ventsafe-md text-sm focus:outline-none focus:border-ventsafe-navy"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 text-sm text-ventsafe-foreground/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterOnline}
                onChange={(e) => setFilterOnline(e.target.checked)}
                className="rounded accent-ventsafe-navy"
              />
              Online only
            </label>
            <button
              onClick={() => void fetchCounsellors()}
              className="p-2 border border-ventsafe-border rounded-ventsafe-md hover:border-ventsafe-navy transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className="text-ventsafe-foreground/50" />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md p-5 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-ventsafe-muted shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-ventsafe-muted rounded w-28" />
                    <div className="h-2.5 bg-ventsafe-muted rounded w-16" />
                  </div>
                </div>
                <div className="h-8 bg-ventsafe-muted rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md p-10 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-base font-semibold text-ventsafe-foreground">
              No counsellors found
            </p>
            <p className="text-sm text-ventsafe-foreground/50 mt-1">
              {filterOnline
                ? "No counsellors are online right now. Try again later or remove the online filter."
                : "No counsellors match your search. Try a different keyword."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md p-5 flex flex-col gap-3"
              >
                {/* Avatar + name row */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-ventsafe-foreground text-ventsafe-background flex items-center justify-center text-lg font-bold">
                      {(c.anonymous_name || "?").charAt(0)}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-ventsafe-card ${
                        c.is_online ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ventsafe-foreground truncate">
                      {c.anonymous_name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.tier === "professional"
                            ? "bg-ventsafe-navy text-white"
                            : "bg-ventsafe-muted text-ventsafe-navy"
                        }`}
                      >
                        <ShieldCheck size={9} />
                        {c.tier === "professional" ? "Certified" : "Volunteer"}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          c.is_online
                            ? "text-green-600"
                            : "text-ventsafe-foreground/40"
                        }`}
                      >
                        {c.is_online ? "● Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specialisations */}
                {c.specialisations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.specialisations.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 bg-ventsafe-muted text-ventsafe-foreground/60 rounded-full capitalize"
                      >
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                    {c.specialisations.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 bg-ventsafe-muted text-ventsafe-foreground/40 rounded-full">
                        +{c.specialisations.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Stats + follow */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-xs text-ventsafe-foreground/40">
                    {c.follower_count} follower
                    {c.follower_count !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => void handleFollow(c.id)}
                    className={`text-xs px-4 py-1.5 rounded-ventsafe-full font-semibold border transition-colors ${
                      c.is_following
                        ? "bg-ventsafe-foreground text-ventsafe-background border-ventsafe-foreground hover:opacity-80"
                        : "border-ventsafe-border text-ventsafe-foreground/70 hover:border-ventsafe-navy hover:text-ventsafe-navy"
                    }`}
                  >
                    {c.is_following ? "Following" : "Follow"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
