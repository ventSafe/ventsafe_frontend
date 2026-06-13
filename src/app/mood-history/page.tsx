"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { API_BASE_URL } from "@/config/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Calendar, TrendingUp, Users, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface MoodEntry {
  id: string;
  mood: string;
  intensity_score: number;
  notes: string | null;
  created_at: string;
}

interface StudentMoodEntry {
  anonymousName: string;
  mood: string;
  intensityScore: number;
  createdAt: string;
}

function moodEmoji(mood: string): string {
  const map: Record<string, string> = {
    "very-good": "😊",
    good: "🙂",
    neutral: "😐",
    bad: "😔",
    "very-bad": "😤",
  };
  return map[mood] ?? "😐";
}

function moodLabel(mood: string): string {
  const map: Record<string, string> = {
    "very-good": "Happy",
    good: "Good",
    neutral: "Neutral",
    bad: "Sad",
    "very-bad": "Intense",
  };
  return map[mood] ?? "Unknown";
}

function moodPhrase(name: string, mood: string): string {
  const map: Record<string, string> = {
    "very-good": `${name} is doing great today`,
    good: `${name} is feeling good`,
    neutral: `${name} seems okay today`,
    bad: `${name} is not happy`,
    "very-bad": `${name} is feeling intense today`,
  };
  return map[mood] ?? `${name} logged their mood`;
}

function moodToScore(mood: string): number {
  const map: Record<string, number> = {
    "very-good": 10,
    good: 7,
    neutral: 5,
    bad: 3,
    "very-bad": 1,
  };
  return map[mood] ?? 5;
}

function moodColor(mood: string): string {
  const map: Record<string, string> = {
    "very-good": "#22c55e",
    good: "#84cc16",
    neutral: "#f59e0b",
    bad: "#f97316",
    "very-bad": "#ef4444",
  };
  return map[mood] ?? "#6b7280";
}

/**
 * Derive the real mood from intensity_score (0–10, 0=happy, 10=intense).
 * Used as a fallback because a past bug caused mood to always be saved as
 * "very-good" in the DB regardless of slider position.
 */
function intensityToMood(score: number): string {
  if (score <= 1) return "very-good";
  if (score <= 3) return "good";
  if (score <= 6) return "neutral";
  if (score <= 8) return "bad";
  return "very-bad";
}

/** Returns the best available mood: prefers DB value unless it's wrong. */
function resolvedMood(entry: { mood: string; intensity_score: number }): string {
  // If the DB mood is "very-good" but intensity_score indicates otherwise,
  // the entry was affected by the old bug — re-derive from score.
  const derivedMood = intensityToMood(entry.intensity_score);
  if (entry.mood === "very-good" && derivedMood !== "very-good") {
    return derivedMood;
  }
  return entry.mood;
}

// ─── Time Filter ──────────────────────────────────────────────────────────────

const PERIODS = [
  { label: "Week", days: 7 },
  { label: "Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "Year", days: 365 },
];

// ─── Student View ─────────────────────────────────────────────────────────────

function StudentMoodHistory({ token }: { token: string }) {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(
    async (selectedDays: number) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE_URL}/mood/history?days=${selectedDays}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) {
          setHistory(data.data.history);
        } else {
          throw new Error(data.message || "Failed to fetch history");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchHistory(days);
  }, [days, fetchHistory]);

  const chartData = [...history]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((entry) => {
      const mood = resolvedMood(entry);
      return {
        date: format(parseISO(entry.created_at), "MMM d"),
        score: 10 - entry.intensity_score,
        emoji: moodEmoji(mood),
        label: moodLabel(mood),
        fullDate: format(parseISO(entry.created_at), "MMMM d, yyyy 'at' h:mm a"),
      };
    });

  // Mood distribution for bar chart
  const moodCounts = history.reduce(
    (acc, e) => {
      const m = resolvedMood(e);
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const barData = [
    { name: "😊 Happy", count: moodCounts["very-good"] || 0, fill: "#22c55e" },
    { name: "🙂 Good", count: moodCounts["good"] || 0, fill: "#84cc16" },
    { name: "😐 Neutral", count: moodCounts["neutral"] || 0, fill: "#f59e0b" },
    { name: "😔 Sad", count: moodCounts["bad"] || 0, fill: "#f97316" },
    { name: "😤 Intense", count: moodCounts["very-bad"] || 0, fill: "#ef4444" },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ventsafe-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-ventsafe-navy" />
            My Mood History
          </h1>
          <p className="text-sm text-ventsafe-foreground/60 mt-1">
            Track your emotional wellbeing over time
          </p>
        </div>
        <div className="flex items-center gap-1 bg-ventsafe-card border border-ventsafe-border p-1 rounded-lg">
          {PERIODS.map(({ label, days: d }) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === d
                  ? "bg-ventsafe-navy text-white"
                  : "text-ventsafe-foreground/60 hover:text-ventsafe-foreground hover:bg-ventsafe-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-200">
          {error}
        </div>
      )}

      {/* Line Chart */}
      <div className="bg-ventsafe-card border border-ventsafe-border rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-ventsafe-foreground mb-6 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-ventsafe-foreground/50" />
          Mood Progress
        </h2>

        {loading ? (
          <div className="h-[260px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-ventsafe-border border-t-ventsafe-navy rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-ventsafe-foreground/50 text-sm">
            <span className="text-4xl">📊</span>
            No mood data for this period. Log your mood in Vent Space to start tracking!
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-ventsafe-border, #e5e7eb)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis
                  domain={[0, 10]}
                  tickFormatter={(val) => {
                    if (val === 10) return "😊";
                    if (val === 7) return "🙂";
                    if (val === 5) return "😐";
                    if (val === 3) return "😔";
                    if (val === 0) return "😤";
                    return "";
                  }}
                  tick={{ fontSize: 16 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
                          <p className="text-xs text-gray-500 mb-1">{d.fullDate}</p>
                          <p className="font-semibold text-sm flex items-center gap-1.5">
                            <span className="text-lg">{d.emoji}</span> {d.label}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#000562"
                  strokeWidth={3}
                  dot={{ fill: "#000562", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#4F5FD9", stroke: "#fff" }}
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bar Chart — Mood Distribution */}
      {!loading && history.length > 0 && (
        <div className="bg-ventsafe-card border border-ventsafe-border rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ventsafe-foreground mb-6">
            Mood Distribution
          </h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val: unknown) => { const v = val as number; return [`${v} time${v !== 1 ? "s" : ""}`, "Logged"]; }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Log Feed */}
      <div className="bg-ventsafe-card border border-ventsafe-border rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-ventsafe-foreground mb-4">
          Recent Logs
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-ventsafe-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-ventsafe-foreground/50 py-4 text-center">
            No logs yet. Start logging your mood in the Vent Space!
          </p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {history.map((entry) => {
              const mood = resolvedMood(entry);
              return (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-4 border border-ventsafe-border/50 rounded-lg hover:bg-ventsafe-muted/30 transition-colors"
              >
                <div className="text-3xl shrink-0">{moodEmoji(mood)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ventsafe-foreground">
                    Feeling {moodLabel(mood)}
                  </p>
                  <p className="text-xs text-ventsafe-foreground/50 mt-0.5">
                    {format(parseISO(entry.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-ventsafe-foreground/80 mt-2 italic bg-ventsafe-background p-2 rounded-md border border-ventsafe-border/30">
                      &quot;{entry.notes}&quot;
                    </p>
                  )}
                </div>
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: moodColor(mood) }}
                />
              </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Counsellor View ──────────────────────────────────────────────────────────

function CounsellorMoodDashboard({ token }: { token: string }) {
  const [moods, setMoods] = useState<StudentMoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudentMoods = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/mood/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setMoods(data.data.moods);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchStudentMoods();
    const interval = setInterval(() => fetchStudentMoods(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchStudentMoods]);

  // Group moods into chart data by mood value
  const moodDistribution = moods.reduce(
    (acc, e) => {
      acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const barData = [
    { name: "😊 Happy", count: moodDistribution["very-good"] || 0, fill: "#22c55e" },
    { name: "🙂 Good", count: moodDistribution["good"] || 0, fill: "#84cc16" },
    { name: "😐 Neutral", count: moodDistribution["neutral"] || 0, fill: "#f59e0b" },
    { name: "😔 Sad", count: moodDistribution["bad"] || 0, fill: "#f97316" },
    { name: "😤 Intense", count: moodDistribution["very-bad"] || 0, fill: "#ef4444" },
  ];

  const needsAttention = moods.filter(
    (m) => m.mood === "bad" || m.mood === "very-bad"
  );
  const doingWell = moods.filter(
    (m) => m.mood === "good" || m.mood === "very-good"
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ventsafe-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-ventsafe-navy" />
            Student Mood Dashboard
          </h1>
          <p className="text-sm text-ventsafe-foreground/60 mt-1">
            Live mood check-ins from students in the last 24 hours
          </p>
        </div>
        <button
          onClick={() => fetchStudentMoods(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-ventsafe-border rounded-lg text-sm text-ventsafe-foreground/70 hover:border-ventsafe-navy hover:text-ventsafe-navy transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Check-ins", value: moods.length, color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "Need Attention", value: needsAttention.length, color: "bg-red-50 text-red-700 border-red-200" },
          { label: "Doing Well", value: doingWell.length, color: "bg-green-50 text-green-700 border-green-200" },
          { label: "Neutral", value: moods.filter(m => m.mood === "neutral").length, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
        ].map((card) => (
          <div
            key={card.label}
            className={`p-4 rounded-xl border ${card.color} flex flex-col`}
          >
            <span className="text-2xl font-bold">{card.value}</span>
            <span className="text-xs font-medium mt-1 opacity-80">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {!loading && moods.length > 0 && (
        <div className="bg-ventsafe-card border border-ventsafe-border rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ventsafe-foreground mb-6">
            Mood Distribution
          </h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(val: unknown) => { const v = val as number; return [`${v} student${v !== 1 ? "s" : ""}`, "Count"]; }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ⚠️ Needs Attention Section */}
      {needsAttention.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
            ⚠️ Students Needing Support ({needsAttention.length})
          </h2>
          <div className="space-y-3">
            {needsAttention.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-lg"
              >
                <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {entry.anonymousName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {moodPhrase(entry.anonymousName, entry.mood)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(parseISO(entry.createdAt), "h:mm a")} today
                  </p>
                </div>
                <span className="text-2xl">{moodEmoji(entry.mood)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Students Feed */}
      <div className="bg-ventsafe-card border border-ventsafe-border rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-ventsafe-foreground mb-4">
          All Student Mood Check-ins
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-ventsafe-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : moods.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-ventsafe-foreground/50">
            <span className="text-4xl">😶</span>
            <p className="text-sm text-center">No students have logged their mood in the last 24 hours.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {moods.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 border border-ventsafe-border/50 rounded-lg hover:bg-ventsafe-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-ventsafe-muted flex items-center justify-center text-xs font-bold text-ventsafe-foreground shrink-0">
                  {entry.anonymousName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm text-ventsafe-foreground/80 flex-1 leading-snug">
                  {moodPhrase(entry.anonymousName, entry.mood)}
                </p>
                <span className="text-xl shrink-0">{moodEmoji(entry.mood)}</span>
                <div
                  className="w-1.5 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: moodColor(entry.mood) }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MoodHistoryPage() {
  const { user, token } = useAuth();
  const isCounsellor =
    user?.role === "counselor" || user?.role === "counsellor_pending";

  if (!token) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-ventsafe-border border-t-ventsafe-navy rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {isCounsellor ? (
        <CounsellorMoodDashboard token={token} />
      ) : (
        <StudentMoodHistory token={token} />
      )}
    </AppLayout>
  );
}
