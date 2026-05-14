import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { logout as logoutApi } from "@/lib/auth";
import { STORAGE_KEYS } from "@/config/constants";

// ─── Safe localStorage helper ─────────────────────────────────────────────────

function safeLS(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    setUser,
    clearAuth,
  } = useAuthStore();

  // Gender — from Zustand user object first, then localStorage fallbacks
  const gender = (user?.gender ??
    safeLS(STORAGE_KEYS.GENDER) ??
    safeLS("ventsafe-signup-gender") ??
    safeLS("ventsafe-counsellor-gender") ??
    "male") as "male" | "female";

  // Anonymous name — from Zustand user object first (set by /auth/me), then localStorage
  const anonymousName =
    user?.anonymousName ??
    safeLS("ventsafe-anon-name") ??
    safeLS("ventsafe-counsellor-anon-name") ??
    "Anonymous";

  // Auth token — only available in browser; empty string on server
  const token = safeLS(STORAGE_KEYS.AUTH_TOKEN) ?? "";

  // ── Logout ──────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    // Save current page so the login page can redirect back after re-login
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const SKIP = ["/login", "/login/counsellor", "/signup", "/signup/counsellor", "/welcome", "/"];
      if (!SKIP.some((p) => currentPath.startsWith(p))) {
        localStorage.setItem("ventsafe-redirect-after-login", currentPath);
      }
    }

    try {
      await logoutApi();
    } catch {
      // API call failed — still proceed with local logout
    }

    clearAuth();

    // Full page reload so AuthProvider re-runs checkAuth from a clean state
    window.location.href = "/login";
  }, [clearAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    gender,
    anonymousName,
    token,
    logout,
    setUser,
  };
}
