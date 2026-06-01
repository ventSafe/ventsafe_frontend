"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config/constants";

// ─── Mood helpers ─────────────────────────────────────────────────────────────

type MoodValue = "very-bad" | "bad" | "neutral" | "good" | "very-good";

// Point 1: "Musa is not happy" style display text
function moodPhrase(name: string, mood: string): string {
  const map: Record<string, string> = {
    "very-good": `${name} is doing great today 😊`,
    good: `${name} is feeling good 🙂`,
    neutral: `${name} seems okay today 😐`,
    bad: `${name} is not happy 😔`,
    "very-bad": `${name} is feeling intense today 😤`,
  };
  return map[mood] ?? `${name} logged their mood`;
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

function scoreToMood(score: number): MoodValue {
  if (score <= 10) return "very-good";
  if (score <= 30) return "good";
  if (score <= 55) return "neutral";
  if (score <= 75) return "bad";
  return "very-bad";
}

// ─── Student Mood Picker ──────────────────────────────────────────────────────

interface StudentMoodSliderProps {
  token: string;
  initialScore?: number;
}

function StudentMoodSlider({ token, initialScore = 50 }: StudentMoodSliderProps) {
  const [sliderValue, setSliderValue] = useState(initialScore);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const STEPS = [
    { value: 0, emoji: "😊", label: "Happy" },
    { value: 25, emoji: "🙂", label: "" },
    { value: 50, emoji: "😐", label: "Not Happy" },
    { value: 75, emoji: "😔", label: "" },
    { value: 100, emoji: "😤", label: "Intense" },
  ];

  const nearestStep = STEPS.reduce((prev, curr) =>
    Math.abs(curr.value - sliderValue) < Math.abs(prev.value - sliderValue)
      ? curr
      : prev,
  );

  const saveMood = useCallback(
    async (value: number) => {
      setSaving(true);
      try {
        await fetch(`${API_BASE_URL}/mood`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mood: scoreToMood(value / 10),
            intensity_score: Math.round(value / 10),
          }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  return (
    <div className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md p-4">
      <p className="text-sm font-semibold text-ventsafe-foreground mb-3">
        How Are You Today?
      </p>

      <div className="relative mb-2">
        <div className="flex justify-between items-end mb-1">
          {STEPS.map((step) => (
            <div key={step.value} className="flex flex-col items-center">
              <span
                className={`text-xl transition-transform ${nearestStep.value === step.value
                    ? "scale-125"
                    : "scale-90 opacity-50"
                  }`}
              >
                {step.emoji}
              </span>
            </div>
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
          onMouseUp={(e) =>
            void saveMood(parseInt((e.target as HTMLInputElement).value, 10))
          }
          onTouchEnd={(e) =>
            void saveMood(parseInt((e.target as HTMLInputElement).value, 10))
          }
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-ventsafe-navy) ${sliderValue}%, var(--color-ventsafe-muted) ${sliderValue}%)`,
          }}
        />

        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-ventsafe-foreground/50">Happy</span>
          <span className="text-[11px] text-ventsafe-foreground/50">
            Not Happy
          </span>
          <span className="text-[11px] text-ventsafe-foreground/50">
            Intense
          </span>
        </div>
      </div>

      {saved && (
        <p className="text-[11px] text-green-600 font-medium mt-1">
          Mood saved ✓
        </p>
      )}
    </div>
  );
}

// ─── Counsellor Mood Feed ─────────────────────────────────────────────────────
// Point 7: Counsellors see student moods, not their own tracker.

interface StudentMoodEntry {
  anonymousName: string;
  mood: string;
  intensityScore: number;
  createdAt: string;
}

function CounsellorMoodFeed({ token }: { token: string }) {
  const [moods, setMoods] = useState<StudentMoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMoods = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mood/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        success: boolean;
        data: { moods: StudentMoodEntry[] };
      };
      if (data.success) setMoods(data.data.moods);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchMoods();
    const interval = setInterval(() => void fetchMoods(), 60_000);
    return () => clearInterval(interval);
  }, [fetchMoods]);

  if (loading) {
    return (
      <div className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md p-4">
        <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
          Student Moods
        </p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 bg-ventsafe-muted rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (moods.length === 0) {
    return (
      <div className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md p-4">
        <p className="text-sm font-semibold text-ventsafe-foreground mb-1">
          Student Moods
        </p>
        <p className="text-xs text-ventsafe-foreground/40">
          No students have logged their mood in the last 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-ventsafe-card border border-ventsafe-border rounded-ventsafe-md p-4">
      <p className="text-sm font-semibold text-ventsafe-foreground mb-3">
        Student Moods
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
        {moods.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 py-1.5"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-ventsafe-muted text-ventsafe-foreground flex items-center justify-center text-xs font-bold shrink-0">
              {entry.anonymousName.charAt(0)}
            </div>
            {/* Point 1: "Musa is not happy" style text */}
            <p className="text-xs text-ventsafe-foreground/80 flex-1 leading-snug">
              {moodPhrase(entry.anonymousName, entry.mood)}
            </p>
            <span className="text-base shrink-0">{moodEmoji(entry.mood)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface MoodSectionProps {
  token: string;
  viewerRole: string;
  initialScore?: number;
}

export function MoodSection({ token, viewerRole, initialScore }: MoodSectionProps) {
  if (viewerRole === "counselor") {
    // Point 7: Counsellors do NOT see the mood picker — only student mood feed
    return <CounsellorMoodFeed token={token} />;
  }
  return <StudentMoodSlider token={token} initialScore={initialScore} />;
}