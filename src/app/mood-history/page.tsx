"use client";

import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { API_BASE_URL } from "@/config/constants";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { Calendar, TrendingUp } from "lucide-react";

interface MoodEntry {
  id: string;
  mood: string;
  intensity_score: number;
  notes: string | null;
  created_at: string;
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

export default function MoodHistoryPage() {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(7); // Default 7 days
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async (selectedDays: number) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("ventsafe-auth-token");
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE_URL}/mood/history?days=${selectedDays}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
  }, []);

  useEffect(() => {
    fetchHistory(days);
  }, [days, fetchHistory]);

  // Format data for Recharts
  // We want to sort chronologically for the chart
  const chartData = [...history]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(entry => ({
      date: format(parseISO(entry.created_at), "MMM d, h:mm a"),
      // Invert score so higher is happier for the chart: 
      // original intensity_score: 0 = very happy, 10 = very sad/intense
      // We map it so 10 = happy, 0 = intense
      score: 10 - entry.intensity_score,
      emoji: moodEmoji(entry.mood),
      label: moodLabel(entry.mood),
      rawScore: entry.intensity_score
    }));

  return (
    <AppLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-24 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ventsafe-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-ventsafe-navy" />
              Mood History
            </h1>
            <p className="text-sm text-ventsafe-foreground/60 mt-1">
              Track your mood progress over time
            </p>
          </div>

          <div className="flex items-center gap-2 bg-ventsafe-card border border-ventsafe-border p-1 rounded-lg">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  days === d
                    ? "bg-ventsafe-navy text-white"
                    : "text-ventsafe-foreground/60 hover:text-ventsafe-foreground hover:bg-ventsafe-muted"
                }`}
              >
                {d === 365 ? "Year" : d === 90 ? "3 Months" : d === 30 ? "Month" : "Week"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="bg-ventsafe-card border border-ventsafe-border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-ventsafe-foreground mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ventsafe-foreground/50" />
            Progress Chart
          </h2>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-ventsafe-border border-t-ventsafe-navy rounded-full animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-ventsafe-foreground/50 text-sm">
              No mood data found for this time period.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
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
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg">
                            <p className="text-xs text-gray-500 mb-1">{data.date}</p>
                            <p className="font-semibold text-sm flex items-center gap-1.5">
                              <span className="text-lg">{data.emoji}</span> {data.label}
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
                    dot={{ fill: '#000562', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#4F5FD9', stroke: '#fff' }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-ventsafe-card border border-ventsafe-border rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ventsafe-foreground mb-4">
            Recent Logs
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-ventsafe-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-ventsafe-foreground/50 py-4">No logs available.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 border border-ventsafe-border/50 rounded-lg hover:bg-ventsafe-muted/30 transition-colors">
                  <div className="text-3xl shrink-0">
                    {moodEmoji(entry.mood)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ventsafe-foreground">
                      Feeling {moodLabel(entry.mood)}
                    </p>
                    <p className="text-xs text-ventsafe-foreground/50 mt-0.5">
                      {format(parseISO(entry.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-ventsafe-foreground/80 mt-2 italic bg-ventsafe-background p-2 rounded-md border border-ventsafe-border/30">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
