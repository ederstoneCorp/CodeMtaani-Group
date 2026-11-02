import { query } from "./db";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type MediaAsset = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string | null;
  created_at: string;
  created_by: string | null;
};

export function validateMediaUpload(mimeType: string, sizeBytes: number): string | null {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP, GIF, SVG.`;
  }
  if (sizeBytes > MAX_SIZE_BYTES) {
    return `File too large (${(sizeBytes / 1024 / 1024).toFixed(1)} MB). Maximum: 5 MB.`;
  }
  if (sizeBytes === 0) {
    return "File is empty.";
  }
  return null;
}

export async function saveMediaAsset(
  filename: string,
  mimeType: string,
  buffer: Buffer,
  adminId: string | null,
  altText?: string
): Promise<MediaAsset> {
  const r = await query<MediaAsset>(
    `INSERT INTO media_assets (filename, mime_type, size_bytes, data, alt_text, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, filename, mime_type, size_bytes, alt_text, created_at, created_by`,
    [filename, mimeType, buffer.length, buffer, altText || null, adminId]
  );
  return r.rows[0];
}

export async function getMediaAsset(id: string): Promise<{ data: Buffer; mime_type: string; size_bytes: number; filename: string } | null> {
  const r = await query<{ data: Buffer; mime_type: string; size_bytes: number; filename: string }>(
    "SELECT data, mime_type, size_bytes, filename FROM media_assets WHERE id = $1 LIMIT 1",
    [id]
  );
  return r.rows[0] || null;
}

export async function getMediaMeta(id: string): Promise<MediaAsset | null> {
  const r = await query<MediaAsset>(
    "SELECT id, filename, mime_type, size_bytes, alt_text, created_at, created_by FROM media_assets WHERE id = $1 LIMIT 1",
    [id]
  );
  return r.rows[0] || null;
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  const r = await query("DELETE FROM media_assets WHERE id = $1 RETURNING id", [id]);
  return (r.rowCount ?? 0) > 0;
}

export async function listMediaAssets(limit = 50, offset = 0): Promise<MediaAsset[]> {
  const r = await query<MediaAsset>(
    "SELECT id, filename, mime_type, size_bytes, alt_text, created_at, created_by FROM media_assets ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return r.rows;
}
