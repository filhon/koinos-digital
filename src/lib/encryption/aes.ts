import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recomendado para GCM

function getKey(key?: string): Buffer {
  const raw = key ?? process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY não definida");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32)
    throw new Error("ENCRYPTION_KEY deve ter 32 bytes (64 hex chars)");
  return buf;
}

/**
 * Encripta um texto com AES-256-GCM.
 * Retorna: iv (24 hex) + tag (32 hex) + ciphertext (hex), separados por ":"
 */
export function encrypt(plainText: string, key?: string): string {
  const keyBuf = getKey(key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuf, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decripta um cipherText produzido por encrypt().
 */
export function decrypt(cipherText: string, key?: string): string {
  const keyBuf = getKey(key);
  const [ivHex, tagHex, encryptedHex] = cipherText.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Formato de cipherText inválido");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, keyBuf, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}
