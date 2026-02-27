import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING = "base64" as const;

/**
 * Get the master key from environment variable
 * @throws Error if MASTER_KEY is not set or invalid
 */
function getMasterKey(): Buffer {
  const key = process.env.MASTER_KEY;

  if (!key) {
    throw new Error("MASTER_KEY environment variable is not set");
  }

  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error("MASTER_KEY must be 64 hex characters (32 bytes)");
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (base64)
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param encrypted - Encrypted string in format: iv:authTag:ciphertext (base64)
 * @returns Decrypted plaintext
 * @throws Error if decryption fails or data is tampered
 */
export function decrypt(encrypted: string): string {
  const key = getMasterKey();

  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;

  if (!ivBase64 || !authTagBase64 || !ciphertext) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivBase64, ENCODING);
  const authTag = Buffer.from(authTagBase64, ENCODING);

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid auth tag length");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, ENCODING, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a string appears to be encrypted (basic format check)
 * @param value - The string to check
 * @returns true if the string matches the encrypted format
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) {
    return false;
  }

  // Check if all parts are valid base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return parts.every((part) => base64Regex.test(part ?? ""));
}

/**
 * Safely encrypt a value, returning null if plaintext is empty
 */
export function encryptIfNotEmpty(plaintext: string | null | undefined): string | null {
  if (!plaintext || plaintext.trim() === "") {
    return null;
  }
  return encrypt(plaintext);
}

/**
 * Safely decrypt a value, returning null if encrypted is empty
 */
export function decryptIfNotEmpty(encrypted: string | null | undefined): string | null {
  if (!encrypted || encrypted.trim() === "") {
    return null;
  }
  return decrypt(encrypted);
}
