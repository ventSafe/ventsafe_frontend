/**
 * Global Auth Store — Zustand
 *
 * Token lifecycle:
 * - Access token (JWT): short-lived (15min), stored in localStorage
 * - Refresh token: long-lived (30 days), stored as httpOnly cookie by backend
 *
 * On every app load:
 *   1. Try /auth/me with access token
 *   2. If 401 (expired) → try /auth/refresh (uses httpOnly cookie automatically)
 *   3. If refresh succeeds → save new access token, retry /auth/me
 *   4. If refresh fails → clear everything, redirect to login
 */

import { create } from "zustand";
import { User } from "@/types";
import { API_BASE_URL, STORAGE_KEYS, ROUTES } from "@/config/constants";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isInitialized: true,
      isLoading: false,
    }),

  // ── Step 2: Try refreshing the access token ──────────────────────────────
  refreshAccessToken: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends httpOnly refresh token cookie automatically
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) return false;

      const data = await res.json();
      const newToken = data.data?.token;
      if (!newToken) return false;

      // Save the new access token
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      return true;
    } catch {
      return false;
    }
  },

  // ── Step 1: Check session on app load ────────────────────────────────────
  checkAuth: async () => {
    set({ isLoading: true });

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (!token) {
      // No access token — try refresh (maybe they have a valid refresh cookie)
      const refreshed = await get().refreshAccessToken();
      if (!refreshed) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }
    }

    // Try /auth/me with current (or newly refreshed) access token
    const tryFetchMe = async (): Promise<boolean> => {
      const currentToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!currentToken) return false;

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
          credentials: "include",
        });

        if (res.status === 401) {
          // Access token expired — try to refresh
          const refreshed = await get().refreshAccessToken();
          if (!refreshed) return false;

          // Retry with new token
          const retryToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          const retry = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${retryToken}` },
            credentials: "include",
          });

          if (!retry.ok) return false;

          const retryData = await retry.json();
          const user: User = retryData.data?.user ?? retryData.data;
          if (user?.anonymousName) {
            localStorage.setItem("ventsafe-anon-name", user.anonymousName);
          }
          set({ user, isAuthenticated: true });
          return true;
        }

        if (!res.ok) return false;

        const data = await res.json();
        const user: User = data.data?.user ?? data.data;
        if (user?.anonymousName) {
          localStorage.setItem("ventsafe-anon-name", user.anonymousName);
        }
        set({ user, isAuthenticated: true });
        return true;
      } catch {
        return false;
      }
    };

    const success = await tryFetchMe();

    if (!success) {
      // Server could not verify the user — account deleted or token invalid
      // Clear everything so RouteGuard redirects to login
      get().clearAuth();
      return;
    }

    set({ isLoading: false, isInitialized: true });
  },

  clearAuth: () => {
    // ── Wipe session-sensitive data ──────────────────────────────────────────
    // Auth tokens
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    // Encrypted / raw private keys — these must NEVER persist after logout
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY);
    localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_ID);
    localStorage.removeItem("ventsafe-signup-private-key");
    localStorage.removeItem("ventsafe-signup-anon-name");
    localStorage.removeItem("ventsafe-signup-gender");
    localStorage.removeItem("ventsafe-signup-agreed");
    localStorage.removeItem("ventsafe-counsellor-private-key");
    localStorage.removeItem("ventsafe-counsellor-anon-name");
    localStorage.removeItem("ventsafe-counsellor-gender");
    localStorage.removeItem("ventsafe-counsellor-agreed");
    localStorage.removeItem("ventsafe-counsellor-encrypted-key");
    localStorage.removeItem("ventsafe-anon-name");

    // ── Intentionally NOT removed ────────────────────────────────────────────
    // "ventsafe-signup-public-key"      — public key for student account
    // "ventsafe-counsellor-public-key"  — public key for counsellor account
    // These contain no secret; they are needed after logout so the switch-account
    // modal can call POST /auth/check-account and show "Log in" instead of "Sign up".

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },
}));
