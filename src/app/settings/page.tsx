"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, GraduationCap, User, Bell, Lock } from "lucide-react";

const SECTION = "border border-ventsafe-border rounded-ventsafe-md bg-ventsafe-card overflow-hidden mb-4";
const ROW = "flex items-center justify-between px-5 py-4 border-b border-ventsafe-border/40 last:border-0";

export default function SettingsPage() {
  const { user, anonymousName } = useAuth();
  const role = user?.role ?? "student";
  const isCounsellor = role === "counselor";

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ventsafe-foreground">Settings</h1>
          <p className="text-sm text-ventsafe-foreground/50 mt-1">
            Manage your VentSafe account preferences.
          </p>
        </div>

        {/* Profile */}
        <div className={SECTION}>
          <div className="flex items-center gap-3 px-5 py-4 bg-ventsafe-muted/30 border-b border-ventsafe-border/40">
            <div className="w-12 h-12 rounded-full bg-ventsafe-foreground text-ventsafe-background flex items-center justify-center text-lg font-bold shrink-0">
              {(anonymousName || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-ventsafe-foreground">
                {anonymousName}
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${
                  isCounsellor
                    ? "bg-ventsafe-navy text-white"
                    : "bg-ventsafe-muted text-ventsafe-navy"
                }`}
              >
                {isCounsellor ? (
                  <><ShieldCheck size={9} /> Counsellor</>
                ) : (
                  <><GraduationCap size={9} /> Student</>
                )}
              </span>
            </div>
          </div>

          <div className={ROW}>
            <div className="flex items-center gap-2.5 text-sm text-ventsafe-foreground">
              <User size={15} className="text-ventsafe-foreground/40" />
              Anonymous name
            </div>
            <span className="text-sm text-ventsafe-foreground/50 truncate max-w-[160px]">
              {anonymousName}
            </span>
          </div>

          <div className={ROW}>
            <div className="flex items-center gap-2.5 text-sm text-ventsafe-foreground">
              <ShieldCheck size={15} className="text-ventsafe-foreground/40" />
              Account role
            </div>
            <span className="text-sm text-ventsafe-foreground/50 capitalize">
              {isCounsellor ? "Counsellor" : "Student"}
            </span>
          </div>
        </div>

        {/* Notifications — placeholder */}
        <div className={SECTION}>
          <div className="px-5 py-3 border-b border-ventsafe-border/40 bg-ventsafe-muted/20">
            <p className="text-xs font-bold text-ventsafe-foreground/50 uppercase tracking-wider">
              Notifications
            </p>
          </div>
          <div className={ROW}>
            <div className="flex items-center gap-2.5 text-sm text-ventsafe-foreground">
              <Bell size={15} className="text-ventsafe-foreground/40" />
              Push notifications
            </div>
            <span className="text-xs text-ventsafe-foreground/30 italic">Coming soon</span>
          </div>
        </div>

        {/* Privacy — placeholder */}
        <div className={SECTION}>
          <div className="px-5 py-3 border-b border-ventsafe-border/40 bg-ventsafe-muted/20">
            <p className="text-xs font-bold text-ventsafe-foreground/50 uppercase tracking-wider">
              Privacy
            </p>
          </div>
          <div className={ROW}>
            <div className="flex items-center gap-2.5 text-sm text-ventsafe-foreground">
              <Lock size={15} className="text-ventsafe-foreground/40" />
              Data &amp; privacy
            </div>
            <span className="text-xs text-ventsafe-foreground/30 italic">Coming soon</span>
          </div>
        </div>

        <p className="text-center text-xs text-ventsafe-foreground/30 pt-2">
          VentSafe — your safe space, always anonymous.
        </p>
      </div>
    </AppLayout>
  );
}
