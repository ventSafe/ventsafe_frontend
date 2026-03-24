/**
 * Admin Auth Store — Zustand
 *
 * Security model:
 * - Admin JWT is stored ONLY in an httpOnly cookie (set by backend)
 * - JavaScript CANNOT read httpOnly cookies — XSS proof
 * - Zustand stores ONLY the admin profile (non-sensitive data)
 * - On every app load, we call /api/admin/me to verify the cookie
 * - If the cookie is invalid/expired → clear store → redirect to login
 *
 * What is NOT stored here:
 * - The JWT token (lives in httpOnly cookie only)
 * - Password or any credentials
 *
 * What IS stored here:
 * - Admin profile (id, name, email, isSuperAdmin)
 * - Auth state (isAuthenticated, isLoading, isInitialized)
 */

import { create } from "zustand";
import { AdminUser, ADMIN_API } from "./utils";

interface AdminAuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAdmin: (admin: AdminUser | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearStore: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setAdmin: (admin) =>
    set({
      admin,
      isAuthenticated: !!admin,
      isLoading: false,
      isInitialized: true,
    }),

  // ── Check if admin is authenticated ────────────────────────────────────────
  // Calls /api/admin/me — the backend reads the httpOnly cookie automatically
  // If cookie is valid → returns admin profile
  // If cookie is expired/missing → returns 401 → we clear the store

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const res = await fetch(`${ADMIN_API}/me`, {
        credentials: "include", // sends httpOnly cookie automatically
      });

      if (!res.ok) {
        // Cookie invalid/expired — clear everything
        get().clearStore();
        return;
      }

      const data = await res.json();
      if (data.success && data.data) {
        set({
          admin: data.data,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        get().clearStore();
      }
    } catch {
      // Network error — don't clear auth, user might be offline
      set({ isLoading: false, isInitialized: true });
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  // Calls /api/admin/logout which clears the httpOnly cookie on the backend
  // Then clears the Zustand store

  logout: async () => {
    try {
      await fetch(`${ADMIN_API}/logout`, {
        method: "POST",
        credentials: "include", // sends cookie so backend knows which session to clear
      });
    } catch {
      // Even if the request fails, clear the local store
    } finally {
      get().clearStore();
    }
  },

  // ── Clear store ─────────────────────────────────────────────────────────────
  clearStore: () =>
    set({
      admin: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    }),
}));
