"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: "student" | "counsellor_pending" | "counselor" | "admin";
}

export function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role === "counsellor_pending" && !requiredRole) {
      router.replace("/onboarding/counsellor/status");
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace("/vent-space");
    }
  }, [isAuthenticated, isInitialized, user, requiredRole, router]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-ventsafe-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className="w-2.5 h-2.5 bg-ventsafe-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-ventsafe-foreground/60">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (user?.role === "counsellor_pending" && !requiredRole) return null;
  if (requiredRole && user?.role !== requiredRole) return null;

  return <>{children}</>;
}
