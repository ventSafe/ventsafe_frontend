import {
  User,
  LoginFormData,
  SignupFormData,
  ApiResponse,
  SignupResponseData,
  LoginResponseData,
} from "@/types";
import { API_BASE_URL, STORAGE_KEYS } from "@/config/constants";
import {
  saveBlockchainIdentity,
  clearBlockchainIdentity,
} from "@/lib/blockchain/keys";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  return data as ApiResponse<T>;
}

function getAuthHeader(): Record<string, string> {
  let token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  
  // Fallback to cookie if localStorage is empty
  if (!token) {
    const match = document.cookie.match(/ventsafe-token=([^;]+)/);
    if (match) token = match[1];
  }
  
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signup(
  formData: SignupFormData,
): Promise<ApiResponse<SignupResponseData>> {
  try {
    const response = await apiFetch<{
      user: User;
      token: string;
    }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        gender: formData.gender,
        agreeToTerms: formData.agreeToTerms,
        publicKey: formData.publicKey,
        ...(formData.role ? { role: formData.role } : {}),
      }),
    });

    if (response.success && response.data) {
      const { user, token } = response.data;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      // Set cookie on frontend domain so Next.js middleware can read it
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `ventsafe-token=${token}; path=/; max-age=${maxAge}; samesite=lax`;
      saveBlockchainIdentity({
        publicKey: formData.publicKey,
        anonymousId: user.anonymousId,
        encryptedPrivateKey: "",
        network: "ventsafe",
        isAuthenticated: true,
      });
      localStorage.setItem(STORAGE_KEYS.GENDER, user.gender);
      return {
        success: true,
        data: {
          ...user,
          privateKey: "", // It will be set in the page.tsx where generated
          publicKey: formData.publicKey,
        },
        message: response.message,
      };
    }
    return {
      success: false,
      error: response.error || "Failed to create account",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function login(
  formData: LoginFormData,
): Promise<ApiResponse<LoginResponseData>> {
  try {
    const response = await apiFetch<{
      user: User;
      token: string;
      isNewUser: boolean;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        publicKey: formData.publicKey.trim(),
        privateKey: formData.privateKey.trim(),
      }),
    });

    if (response.success && response.data) {
      const { user, token, isNewUser } = response.data;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      // Set cookie on frontend domain (localhost:3000) so Next.js middleware can read it
      // The backend sets it on port 5000 which middleware cannot see
      const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
      document.cookie = `ventsafe-token=${token}; path=/; max-age=${maxAge}; samesite=lax`;
      saveBlockchainIdentity({
        publicKey: formData.publicKey,
        anonymousId: user.anonymousId,
        encryptedPrivateKey: "",
        network: "ventsafe",
        isAuthenticated: true,
      });
      return {
        success: true,
        data: { ...user, isNewUser },
        message: response.message,
      };
    }
    return { success: false, error: response.error || "Login failed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      headers: getAuthHeader(),
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear the frontend cookie
    document.cookie = "ventsafe-token=; path=/; max-age=0; samesite=lax";
    clearBlockchainIdentity();
  }
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return !!(token && userData);
}

export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!userData) return null;
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

export function updateUser(updates: Partial<User>): void {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    localStorage.setItem(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify({
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("Error updating user:", error);
  }
}

export async function fetchCurrentUser(): Promise<ApiResponse<User>> {
  try {
    return await apiFetch<User>("/auth/me", { headers: getAuthHeader() });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user",
    };
  }
}

/**
 * Checks if a public key stored in localStorage actually exists in the database.
 * Returns { exists: boolean, role: string | null } or null on network error.
 */
export async function checkAccountExists(
  publicKey: string,
): Promise<{ exists: boolean; role: string | null } | null> {
  try {
    const res = await apiFetch<{ exists: boolean; role: string | null }>(
      "/auth/check-account",
      {
        method: "POST",
        body: JSON.stringify({ publicKey }),
      },
    );
    if (res.success && res.data) return res.data;
    return { exists: false, role: null };
  } catch {
    return null; // network error — fall back gracefully
  }
}

/**
 * Checks for existence of an account with a specific name and role.
 * Used for "Account Switching" UI to detect other roles via the DB.
 */
export async function checkAssociatedAccount(
  anonymousName: string,
  targetRole: string,
): Promise<{ exists: boolean }> {
  try {
    const res = await apiFetch<{ exists: boolean }>("/auth/check-associated", {
      method: "POST",
      body: JSON.stringify({ anonymousName, targetRole }),
      headers: getAuthHeader(),
    });
    if (res.success && res.data) return res.data;
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

export async function updateAnonymousNameOnServer(
  anonymousName: string,
): Promise<ApiResponse<{ user: User }>> {
  try {
    const response = await apiFetch<{ user: User }>("/auth/anonymous-name", {
      method: "PUT",
      body: JSON.stringify({ anonymousName }),
      headers: getAuthHeader(),
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}


