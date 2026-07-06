// Evidence file storage — local disk under <project>/uploads for the MVP.
// Kept behind this small module so a move to S3/GCS later only touches here.

import { mkdir, writeFile, unlink } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "file";
}

/** Persist an uploaded file; returns the storage key (relative path). */
export async function saveEvidenceFile(answerId: string, file: File): Promise<{ storageKey: string; fileName: string }> {
  const fileName = sanitizeFileName(file.name);
  const storageKey = path.posix.join(answerId, `${randomUUID()}-${fileName}`);
  const absolute = path.join(UPLOAD_ROOT, storageKey);
  await mkdir(path.dirname(absolute), { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, bytes);
  return { storageKey, fileName };
}

export function evidenceFilePath(storageKey: string): string | null {
  const absolute = path.resolve(UPLOAD_ROOT, storageKey);
  // Guard against path traversal via a tampered storage key.
  if (!absolute.startsWith(UPLOAD_ROOT + path.sep)) return null;
  if (!existsSync(absolute)) return null;
  return absolute;
}

export function evidenceFileStream(absolutePath: string) {
  return createReadStream(absolutePath);
}

export async function deleteEvidenceFile(storageKey: string): Promise<void> {
  const absolute = evidenceFilePath(storageKey);
  if (!absolute) return;
  try {
    await unlink(absolute);
  } catch {
    // Removing the DB row matters more than the orphaned file.
  }
}
