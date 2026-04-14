"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, GraduationCap } from "lucide-react";
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

interface StudentEntry {
  id: string;
  anonymous_name: string;
  is_online: boolean;
  last_seen: string | null;
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
                className={`mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium border transition-colors ${c.is_following
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

// ─── Counsellor view: Active Students ────────────────────────────────────────

function CounsellorView({ token }: { token: string }) {
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/counsellors/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = (await res.json()) as {
        success: boolean;
        data: { students: StudentEntry[] };
      };
      if (data.success) setStudents(data.data.students);
    } catch (err) {
      console.error("Failed to fetch active students:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetch_();
    const interval = setInterval(() => void fetch_(), 60_000);
    return () => clearInterval(interval);
  }, [fetch_]);

  if (loading) {
    return (
      <div>
        <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
          Active Students
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

  if (students.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-ventsafe-foreground mb-1">
          Active Students
        </p>
        <p className="text-xs text-ventsafe-foreground/40">
          No students are active right now.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ventsafe-foreground mb-2">
        Active Students
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
        {students.map((s) => (
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
              {/* Counsellors can chat with any student — no follow button */}
              <button className="mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium border border-ventsafe-border text-ventsafe-foreground/60 hover:border-ventsafe-navy transition-colors">
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>
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