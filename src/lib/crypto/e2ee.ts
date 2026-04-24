import forge from "node-forge";

/**
 * End-to-End Encryption Service for Chat
 */

interface EncryptedPayload {
  encryptedBlob: string; // Base64 of IV + Ciphertext
  wrappedAesKeySender: string; // Base64
  wrappedAesKeyRecipient: string; // Base64
}

export async function encryptMessage(
  plaintext: string,
  senderPublicKeyPem: string,
  recipientPublicKeyPem: string
): Promise<EncryptedPayload> {
  const aesKey = window.crypto.getRandomValues(new Uint8Array(32));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    aesKey,
    "AES-GCM",
    true,
    ["encrypt"]
  );

  const enc = new TextEncoder();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    enc.encode(plaintext)
  );

  const combinedBlob = new Uint8Array(12 + ciphertextBuffer.byteLength);
  combinedBlob.set(iv, 0);
  combinedBlob.set(new Uint8Array(ciphertextBuffer), 12);
  const encryptedBlob = btoa(String.fromCharCode(...combinedBlob));

  // Convert Uint8Array to binary string for node-forge
  const aesKeyStr = String.fromCharCode(...aesKey);

  const senderPubKey = forge.pki.publicKeyFromPem(senderPublicKeyPem);
  const wrappedSenderAes = senderPubKey.encrypt(aesKeyStr, 'RSA-OAEP');
  const wrappedAesKeySender = forge.util.encode64(wrappedSenderAes);

  const recipientPubKey = forge.pki.publicKeyFromPem(recipientPublicKeyPem);
  const wrappedRecipientAes = recipientPubKey.encrypt(aesKeyStr, 'RSA-OAEP');
  const wrappedAesKeyRecipient = forge.util.encode64(wrappedRecipientAes);

  return {
    encryptedBlob,
    wrappedAesKeySender,
    wrappedAesKeyRecipient,
  };
}

export async function decryptMessage(
  wrappedAesKey: string,
  encryptedBlob: string,
  privateKeyPem: string
): Promise<string> {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const rawWrapped = forge.util.decode64(wrappedAesKey);
  const rawAesKeyString = privateKey.decrypt(rawWrapped, 'RSA-OAEP');
  
  // Convert binary string to Uint8Array
  const aesKey = new Uint8Array(rawAesKeyString.length);
  for (let i = 0; i < rawAesKeyString.length; i++) {
    aesKey[i] = rawAesKeyString.charCodeAt(i);
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    aesKey,
    "AES-GCM",
    true,
    ["decrypt"]
  );

  const combined = Uint8Array.from(atob(encryptedBlob), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    cryptoKey,
    ciphertext as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);
}
