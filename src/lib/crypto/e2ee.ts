import { ethers } from "ethers";

/**
 * End-to-End Encryption Service for Chat
 *
 * Uses ECDH (secp256k1) to derive a shared secret between sender and recipient,
 * then wraps a per-message AES-256-GCM key with that shared secret.
 *
 * Security properties:
 * - Each message gets a unique random AES key (forward secrecy per message)
 * - ECDH shared secret is symmetric: both parties derive the same key
 * - Server only sees ciphertext — cannot decrypt without either party's private key
 */

interface EncryptedPayload {
  encryptedBlob: string;            // Base64 of IV(12) + AES-GCM ciphertext
  wrappedAesKeySender: string;      // Base64 of wrapIV(12) + wrapped AES key (same as recipient)
  wrappedAesKeyRecipient: string;   // Base64 of wrapIV(12) + wrapped AES key (same as sender)
}

/**
 * Derives a symmetric AES-256 key from ECDH shared secret.
 * Both parties compute the same key: ECDH(myPriv, theirPub) = ECDH(theirPriv, myPub)
 */
async function deriveWrappingKey(
  myPrivateKeyHex: string,
  theirPublicKeyHex: string
): Promise<CryptoKey> {
  const signingKey = new ethers.SigningKey(myPrivateKeyHex);
  const sharedSecret = signingKey.computeSharedSecret(theirPublicKeyHex);
  const sharedBytes = ethers.getBytes(sharedSecret);

  // Hash the raw ECDH shared secret to get 256-bit AES key material
  const keyMaterial = await window.crypto.subtle.digest("SHA-256", sharedBytes.buffer as ArrayBuffer);

  return window.crypto.subtle.importKey(
    "raw",
    keyMaterial,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext message for a specific recipient.
 *
 * @param plaintext - The message text
 * @param senderPrivateKeyHex - Sender's secp256k1 private key (0x-prefixed hex)
 * @param recipientPublicKeyHex - Recipient's secp256k1 public key (0x-prefixed hex)
 */
export async function encryptMessage(
  plaintext: string,
  senderPrivateKeyHex: string,
  recipientPublicKeyHex: string
): Promise<EncryptedPayload> {
  // 1. Generate a random AES-256 key for this message
  const aesKey = window.crypto.getRandomValues(new Uint8Array(32));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 2. Encrypt the plaintext with AES-GCM
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", aesKey, "AES-GCM", true, ["encrypt"]
  );
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(plaintext)
  );

  // 3. Combine IV + ciphertext into a single blob
  const combinedBlob = new Uint8Array(12 + ciphertextBuffer.byteLength);
  combinedBlob.set(iv, 0);
  combinedBlob.set(new Uint8Array(ciphertextBuffer), 12);
  const encryptedBlob = btoa(String.fromCharCode(...combinedBlob));

  // 4. Wrap the AES key using ECDH shared secret
  const wrappingKey = await deriveWrappingKey(senderPrivateKeyHex, recipientPublicKeyHex);
  const wrapIv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrappedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: wrapIv },
    wrappingKey,
    aesKey
  );

  // 5. Combine wrapIV + wrapped AES key
  const wrappedCombined = new Uint8Array(12 + wrappedKeyBuffer.byteLength);
  wrappedCombined.set(wrapIv, 0);
  wrappedCombined.set(new Uint8Array(wrappedKeyBuffer), 12);
  const wrappedAesKey = btoa(String.fromCharCode(...wrappedCombined));

  // Both sender and recipient can derive the same ECDH shared secret,
  // so the wrapped key is the same for both
  return {
    encryptedBlob,
    wrappedAesKeySender: wrappedAesKey,
    wrappedAesKeyRecipient: wrappedAesKey,
  };
}

/**
 * Decrypts an encrypted message.
 *
 * @param wrappedAesKey - The wrapped AES key (either sender or recipient copy — they're identical)
 * @param encryptedBlob - The encrypted message blob
 * @param myPrivateKeyHex - Your secp256k1 private key
 * @param otherPublicKeyHex - The other party's secp256k1 public key
 */
export async function decryptMessage(
  wrappedAesKey: string,
  encryptedBlob: string,
  myPrivateKeyHex: string,
  otherPublicKeyHex: string
): Promise<string> {
  // 1. Derive the same wrapping key via ECDH
  const wrappingKey = await deriveWrappingKey(myPrivateKeyHex, otherPublicKeyHex);

  // 2. Unwrap the AES key
  const wrappedCombined = Uint8Array.from(atob(wrappedAesKey), (c) => c.charCodeAt(0));
  const wrapIv = wrappedCombined.slice(0, 12);
  const wrappedKeyData = wrappedCombined.slice(12);

  const aesKeyBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: wrapIv },
    wrappingKey,
    wrappedKeyData
  );

  // 3. Import the unwrapped AES key
  const aesKey = await window.crypto.subtle.importKey(
    "raw", aesKeyBuffer, "AES-GCM", false, ["decrypt"]
  );

  // 4. Decrypt the message
  const combined = Uint8Array.from(atob(encryptedBlob), (c) => c.charCodeAt(0));
  const msgIv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: msgIv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}
