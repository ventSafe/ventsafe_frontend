"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/config/constants";

type MoodValue = "very-bad" | "bad" | "neutral" | "good" | "very-good";

interface MoodSliderProps {
  token: string;
  initialMood?: MoodValue;
  initialScore?: number;
}

const SLIDER_STEPS = [
  { value: 0, mood: "very-good" as MoodValue, emoji: "😊", label: "Happy" },
  { value: 25, mood: "good" as MoodValue, emoji: "🙂", label: "" },
  { value: 50, mood: "neutral" as MoodValue, emoji: "😐", label: "Not Happy" },
  { value: 75, mood: "bad" as MoodValue, emoji: "😔", label: "" },
  { value: 100, mood: "very-bad" as MoodValue, emoji: "😤", label: "Intense" },
];

function scoreToMood(score: number): MoodValue {
  if (score <= 10) return "very-good";
  if (score <= 30) return "good";
  if (score <= 55) return "neutral";
  if (score <= 75) return "bad";
  return "very-bad";
}

function moodToIntensity(mood: MoodValue): number {
  const map: Record<MoodValue, number> = {
    "very-good": 1,
    good: 3,
    neutral: 5,
    bad: 7,
    "very-bad": 9,
  };
  return map[mood];
}

export function MoodSlider({
  token,
  initialMood = "neutral",
  initialScore = 50,
}: MoodSliderProps) {
  const [sliderValue, setSliderValue] = useState(initialScore * 10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentMood = scoreToMood(sliderValue / 10);
  const nearestStep = SLIDER_STEPS.reduce((prev, curr) =>
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
    <div className="bg-white border border-ventsafe-border rounded-ventsafe-md p-4">
      <p className="text-sm font-semibold text-ventsafe-foreground mb-3">
        How Are You Today?
      </p>

      <div className="relative mb-2">
        {/* Emoji markers */}
        <div className="flex justify-between items-end mb-1">
          {SLIDER_STEPS.map((step) => (
            <div key={step.value} className="flex flex-col items-center">
              <span
                className={`text-xl transition-transform ${
                  nearestStep.value === step.value
                    ? "scale-125"
                    : "scale-90 opacity-50"
                }`}
              >
                {step.emoji}
              </span>
            </div>
          ))}
        </div>

        {/* Slider */}
        <input
          title="Range"
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
          onMouseUp={(e) =>
            saveMood(parseInt((e.target as HTMLInputElement).value, 10))
          }
          onTouchEnd={(e) =>
            saveMood(parseInt((e.target as HTMLInputElement).value, 10))
          }
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #000562 ${sliderValue}%, #e5e7f0 ${sliderValue}%)`,
          }}
        />

        {/* Labels */}
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
