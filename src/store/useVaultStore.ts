/**
 * Vault Store — Zustand (in-memory only, no persistence)
 *
 * Stores the unlocked private key so it survives client-side navigation
 * between pages (e.g. chat → vent-space → chat) without requiring
 * the user to re-enter their PIN every time.
 *
 * Security: This is never persisted to localStorage or cookies.
 * A full page reload will wipe the key — the user must re-enter their PIN.
 */

import { create } from "zustand";

interface VaultStore {
  /** The decrypted private key (hex), or null if vault is locked */
  unlockedPrivKey: string | null;
  /** Unlock the vault with a decrypted private key */
  unlock: (key: string) => void;
  /** Lock the vault — wipe the key from memory */
  lock: () => void;
}

export const useVaultStore = create<VaultStore>((set) => ({
  unlockedPrivKey: null,
  unlock: (key) => set({ unlockedPrivKey: key }),
  lock: () => set({ unlockedPrivKey: null }),
}));
