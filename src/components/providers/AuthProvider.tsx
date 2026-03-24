/**
 * AuthProvider
 * Wraps the entire app. Calls checkAuth() once on mount so every
 * page knows immediately whether the user is logged in or not.
 */

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
