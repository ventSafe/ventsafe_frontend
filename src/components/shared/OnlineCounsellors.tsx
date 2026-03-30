"use client";
 
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/config/constants";
 
interface Counsellor {
  id: string;
  anonymous_name: string;
  tier: "volunteer" | "professional";
  specialisations: string[];
  is_online: boolean;
  is_following: boolean;
  follower_count: number;
}
 
interface OnlineCounsellorsProps {
  token: string;
}
 
export function OnlineCounsellors({ token }: OnlineCounsellorsProps) {
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
 
  const fetchCounsellors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/counsellors/online`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCounsellors(data.data.counsellors);
    } finally {
      setLoading(false);
    }
  }, [token]);
 
  useEffect(() => {
    fetchCounsellors();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCounsellors, 60_000);
    return () => clearInterval(interval);
  }, [fetchCounsellors]);
 
  const handleFollow = async (counsellorId: string) => {
    const res = await fetch(`${API_BASE_URL}/counsellors/${counsellorId}/follow`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
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
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ventsafe-foreground">
          Available Counsellor
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse"
            >
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
          No counsellors online right now. Check back soon.
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
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            onClick={() => handleFollow(c.id)}
          >
            {/* Avatar with online dot */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-ventsafe-foreground text-ventsafe-primary-foreground flex items-center justify-center text-sm font-bold group-hover:opacity-90 transition-opacity">
                {c.anonymous_name.charAt(0)}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            </div>
 
            {/* Name + badge */}
            <div className="text-center">
              <p className="text-[11px] font-medium text-ventsafe-foreground max-w-[64px] truncate">
                {c.anonymous_name}
              </p>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <ShieldCheck size={9} className="text-ventsafe-navy" />
                <span className="text-[9px] text-ventsafe-navy">
                  {c.tier === "professional" ? "Certified" : "Vol."}
                </span>
              </div>
              {/* Follow button */}
              <button
                className={`mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                  c.is_following
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