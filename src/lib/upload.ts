import { randomUUID } from "crypto";

const MAGIC_BYTES: Record<string, number[][]> = {
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  webp: [
    // RIFF....WEBP
    [0x52, 0x49, 0x46, 0x46],
  ],
  pdf: [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function matchesMagic(buffer: Uint8Array, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, i) => buffer[i] === byte);
}

export interface ValidatedUpload {
  ext: string;
  safeName: string;
}

/**
 * Validates a file's content by checking magic bytes and MIME type.
 * Returns a safe filename with UUID, or null if invalid.
 */
export function validateUpload(
  file: File,
  buffer: Uint8Array,
  allowedMimes: string[] = Object.keys(MIME_TO_EXT)
): ValidatedUpload | null {
  const ext = MIME_TO_EXT[file.type];
  if (!ext || !allowedMimes.includes(file.type)) return null;

  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return null;

  const matched = signatures.some((sig) => matchesMagic(buffer, sig));
  if (!matched) return null;

  // For webp, also check the WEBP marker at offset 8
  if (ext === "webp") {
    if (
      buffer.length < 12 ||
      buffer[8] !== 0x57 || // W
      buffer[9] !== 0x45 || // E
      buffer[10] !== 0x42 || // B
      buffer[11] !== 0x50 // P
    ) {
      return null;
    }
  }

  const safeName = `${randomUUID()}.${ext}`;
  return { ext, safeName };
}
