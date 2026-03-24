/**
 * Frontend Blockchain Key Utilities
 * Handles client-side AES-256 encryption of the private key using a user PIN.
 * The private key is NEVER sent to any server — it stays in memory briefly during login.
 */

import { BlockchainIdentity } from "@/types";
import { STORAGE_KEYS } from "@/config/constants";

// ─── AES-256 Encryption via Web Crypto API ────────────────────────────────────

/**
 * Derives a 256-bit AES key from a PIN using PBKDF2.
 * Uses a salt stored alongside the encrypted key.
 */
async function deriveKeyFromPIN(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts the private key with the user's PIN using AES-256-GCM.
 * Returns a base64 string: salt(16) + iv(12) + ciphertext
 */
export async function encryptPrivateKey(privateKey: string, pin: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPIN(pin, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(privateKey)
  );

  // Pack: salt(16) + iv(12) + ciphertext into one Uint8Array
  const combined = new Uint8Array(16 + 12 + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(ciphertext), 28);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts the stored private key using the user's PIN.
 * Returns the private key string, or throws if the PIN is wrong.
 */
export async function decryptPrivateKey(encryptedB64: string, pin: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKeyFromPIN(pin, salt);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Wrong PIN — could not decrypt private key.");
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export function saveBlockchainIdentity(identity: BlockchainIdentity): void {
  localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, identity.publicKey);
  localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, identity.anonymousId);
  if (identity.encryptedPrivateKey) {
    localStorage.setItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY, identity.encryptedPrivateKey);
  }
}

export function clearBlockchainIdentity(): void {
  localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
  localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_ID);
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY);
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem("ventsafe-anon-name");
  localStorage.removeItem("ventsafe-signup-public-key");
  localStorage.removeItem("ventsafe-signup-private-key");
  localStorage.removeItem("ventsafe-signup-anon-name");
  localStorage.removeItem("ventsafe-signup-gender");
}

export function getStoredPublicKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
}

export function getStoredEncryptedPrivateKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ENCRYPTED_PRIVATE_KEY);
}

export function getStoredAnonymousId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
}

// ─── Key Helpers ──────────────────────────────────────────────────────────────

export function formatKeyPreview(key: string, chars = 6): string {
  const clean = key
    .replace(/-----BEGIN.*?-----/g, "")
    .replace(/-----END.*?-----/g, "")
    .replace(/\s/g, "");
  if (clean.length <= chars * 2) return clean;
  return `${clean.slice(0, chars)}...${clean.slice(-chars)}`;
}

export function isValidPEMFormat(pem: string, type: "public" | "private"): boolean {
  const label = type === "public" ? "PUBLIC KEY" : "PRIVATE KEY";
  return (
    pem.includes(`-----BEGIN ${label}-----`) &&
    pem.includes(`-----END ${label}-----`)
  );
}

export function downloadKey(keyContent: string, filename = "ventsafe-private-key.txt"): void {
  const blob = new Blob([keyContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}