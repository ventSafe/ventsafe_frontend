"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthContext } from "../_context/AdminAuthContext";
import { AdminSidebar } from "./_components/AdminSidebar";
import { useAdminAuthStore } from "../useAdminAuthStore";
import { ADMIN_API } from "../utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    admin,
    isAuthenticated,
    isLoading,
    isInitialized,
    checkAuth,
    logout,
  } = useAdminAuthStore();

  const [pending, setPending] = useState(0);

  // Verify session on mount by calling /api/admin/me
  // Backend reads the httpOnly cookie automatically
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect to login if not authenticated after check
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isInitialized, isAuthenticated]);

  // Load pending applications count
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${ADMIN_API}/applications/pending`, {
      credentials: "include", // sends httpOnly cookie automatically
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPending(d.data.total);
      })
      .catch(() => {});
  }, [isAuthenticated, pathname]);

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  // Loading — verifying session
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-ventsafe-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[0, 150, 300].map((d) => (
              <div
                key={d}
                className="w-2.5 h-2.5 bg-ventsafe-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          <p className="text-xs text-ventsafe-foreground/40">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated — render nothing (redirect in progress)
  if (!isAuthenticated || !admin) return null;

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        logout: handleLogout,
        isSuperAdmin: admin.is_super_admin,
      }}
    >
      <div className="min-h-screen bg-ventsafe-background flex relative">
        <AdminSidebar pendingCount={pending} />
        
        {/* Global Theme Toggle for Admin */}
        <div className="fixed top-4 right-4 z-40 lg:absolute lg:top-6 lg:right-8 lg:z-50 bg-ventsafe-card border border-ventsafe-border/40 rounded-full shadow-sm">
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto min-w-0 lg:pt-0 pt-16 relative">
          {children}
        </main>
      </div>
    </AdminAuthContext.Provider>
  );
}
