"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, GraduationCap, X } from "lucide-react";
import { API_BASE_URL } from "@/config/constants";
import { getInitials } from "@/lib/utils";

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

interface FollowerEntry {
  id: string;
  anonymous_name: string;
  is_online: boolean;
  public_key: string;
}

interface AvailableUsersProps {
  token: string;
  viewerRole: string; // 'student' | 'counselor'
}

// ─── Student view: Available Counsellors ─────────────────────────────────────

function StudentView({ token }: { token: string }) {
  const [counsellors, setCounsellors] = useState<CounsellorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/counsellors/online`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = (await res.json()) as {
        success: boolean;
        data: { counsellors: CounsellorEntry[] };
      };
      if (data.success) setCounsellors(data.data.counsellors);
    } catch (err) {
      console.error("Failed to fetch online counsellors:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetch_();
    const interval = setInterval(() => void fetch_(), 60_000);
    return () => clearInterval(interval);
  }, [fetch_]);

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
          c.id === counsellorId
            ? { ...c, is_following: data.data.following }
            : c,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div>
        <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
          Available Counsellor
        </p>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-ventsafe-muted" />
              <div className="w-16 h-2.5 bg-ventsafe-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (counsellors.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-ventsafe-foreground mb-1">
          Available Counsellor
        </p>
        <p className="text-xs text-ventsafe-foreground/40">
          No counsellors are active right now. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
        Available Counsellor
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        {counsellors.map((c) => (
          <div
            key={c.id}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-ventsafe-foreground text-ventsafe-primary-foreground flex items-center justify-center text-lg font-bold">
                {getInitials(c.anonymous_name)}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${c.is_online ? "bg-green-500" : "bg-gray-300"
                  }`}
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-ventsafe-foreground max-w-[64px] truncate">
                {c.anonymous_name}
              </p>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <ShieldCheck size={9} className="text-ventsafe-navy" />
                <span className="text-[9px] text-ventsafe-navy">
                  {c.tier === "professional" ? "Certified" : "Volunteer."}
                </span>
              </div>
              {/* Follow / Following button */}
              <button
                onClick={() => void handleFollow(c.id)}
                className={`mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium border transition-colors cursor-pointer ${c.is_following
                    ? "bg-ventsafe-foreground text-white border-ventsafe-foreground"
                    : "border-ventsafe-border text-ventsafe-foreground/60 hover:border-ventsafe-navy"
                  }`}
              >
                {c.is_following ? "Following" : "Follow"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Counsellor view: Followers (students following this counsellor) ─────────

function CounsellorView({ token }: { token: string }) {
  const router = useRouter();
  const [followers, setFollowers] = useState<FollowerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/counsellors/followers/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = (await res.json()) as {
        success: boolean;
        data: { followers: FollowerEntry[] };
      };
      if (data.success) setFollowers(data.data.followers);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetch_();
    const interval = setInterval(() => void fetch_(), 60_000);
    return () => clearInterval(interval);
  }, [fetch_]);

  const handleChat = (studentId: string) => {
    // Navigate to chat page with this student pre-selected
    router.push(`/chat?student=${studentId}`);
  };

  if (loading) {
    return (
      <div>
        <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
          Students Following You
        </p>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-ventsafe-muted" />
              <div className="w-16 h-2.5 bg-ventsafe-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-ventsafe-foreground mb-1">
          Students Following You
        </p>
        <p className="text-xs text-ventsafe-foreground/40">
          No students are following you yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
        Students Following You
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        {followers.map((s) => (
          <div
            key={s.id}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-ventsafe-muted text-ventsafe-foreground flex items-center justify-center text-lg font-bold">
                {getInitials(s.anonymous_name)}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${s.is_online ? "bg-green-500" : "bg-gray-300"
                  }`}
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-ventsafe-foreground max-w-[64px] truncate">
                {s.anonymous_name}
              </p>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <GraduationCap size={9} className="text-ventsafe-foreground/50" />
                <span className="text-[9px] text-ventsafe-foreground/50">
                  Student
                </span>
              </div>
              <button
                onClick={() => handleChat(s.id)}
                className="mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium border border-ventsafe-border text-ventsafe-foreground/60 hover:border-ventsafe-navy transition-colors cursor-pointer"
              >
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Non-follower popup (shown when triggered from other components) */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPopup(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm text-center z-10">
            <button onClick={() => setPopup(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={16} />
            </button>
            <p className="text-sm text-gray-700 leading-relaxed">{popup}</p>
            <button
              onClick={() => setPopup(null)}
              className="mt-4 px-4 py-2 bg-ventsafe-foreground text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AvailableUsers({ token, viewerRole }: AvailableUsersProps) {
  if (viewerRole === "counselor") {
    return <CounsellorView token={token} />;
  }
  return <StudentView token={token} />;
}