/**
 * useAuth hook
 * Convenient shortcut for accessing auth state from any component.
 *
 * Usage:
 *   const { user, isAuthenticated, logout } = useAuth();
 */

import { useAuthStore } from "@/store/useAuthStore";
import { logout as logoutApi } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { ROUTES } from "@/config/constants";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isInitialized, clearAuth } =
    useAuthStore();

  const logout = async () => {
    // Save current page so we can redirect back after login
    const skipSave = ["/login", "/signup", "/onboarding", "/welcome"];
    const shouldSave = !skipSave.some((p) => pathname.startsWith(p));
    if (shouldSave && pathname !== "/") {
      localStorage.setItem("ventsafe-redirect-after-login", pathname);
    }
    await logoutApi(); // Calls backend — blacklists token AND clears cookies
    clearAuth(); // Clears store + localStorage
    // Use window.location for a full page reload so AuthProvider
    // starts completely fresh — prevents stale auth state loops
    window.location.href = "/login";
  };

  // Read gender from user or localStorage
  const gender = (user?.gender ||
    localStorage.getItem("ventsafe-signup-gender") ||
    localStorage.getItem("ventsafe-counsellor-gender") ||
    "male") as "male" | "female";

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    logout,
    gender,
    // Shortcuts
    anonymousName:
      user?.anonymousName ?? localStorage.getItem("ventsafe-anon-name") ?? "",
    role: user?.role ?? null,
    isStudent: user?.role === "student",
    isCounselor: user?.role === "counselor",
    isAdmin: user?.role === "admin",
  };
}
