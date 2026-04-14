/**
 * AuthProvider
 * Wraps the entire app. Calls checkAuth() once on mount so every
 * page knows immediately whether the user is logged in or not.
 */

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE_URL, STORAGE_KEYS } from "@/config/constants";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Send heartbeat immediately on load if authenticated
    const sendHeartbeat = () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        fetch(`${API_BASE_URL}/auth/heartbeat`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    };

    sendHeartbeat(); // Fire once immediately
    // Then fire every 60 seconds
    const interval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return <>{children}</>;
}
