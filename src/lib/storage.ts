// Evidence file storage.
//
// Two drivers behind one interface:
//   - Vercel Blob when BLOB_READ_WRITE_TOKEN is present (production — Vercel
//     functions have no persistent disk). Files are stored under an
//     unguessable random-suffixed public URL.
//   - Local disk under <project>/uploads otherwise (development).
//
// The storageKey column records where the bytes live: an absolute https URL
// for blob objects, a relative path for local files.

import { mkdir, writeFile, unlink } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put, del } from "@vercel/blob";
import { MAX_UPLOAD_BYTES } from "./types";

export { MAX_UPLOAD_BYTES };

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.slice(0, 120) || "file";
}

export interface StoredEvidenceFile {
  /** Where the bytes live: https URL (blob) or relative path (local disk). */
  storageKey: string;
  fileName: string;
  /** Public URL for blob objects; null for local files (served via the API). */
  publicUrl: string | null;
}

export async function saveEvidenceFile(answerId: string, file: File): Promise<StoredEvidenceFile> {
  const fileName = sanitizeFileName(file.name);

  if (blobEnabled()) {
    const blob = await put(`evidence/${answerId}/${randomUUID()}-${fileName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { storageKey: blob.url, fileName, publicUrl: blob.url };
  }

  const storageKey = path.posix.join(answerId, `${randomUUID()}-${fileName}`);
  const absolute = path.join(UPLOAD_ROOT, storageKey);
  await mkdir(path.dirname(absolute), { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, bytes);
  return { storageKey, fileName, publicUrl: null };
}

export function isRemoteStorageKey(storageKey: string): boolean {
  return /^https:\/\//i.test(storageKey);
}

export function evidenceFilePath(storageKey: string): string | null {
  if (isRemoteStorageKey(storageKey)) return null;
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
  try {
    if (isRemoteStorageKey(storageKey)) {
      await del(storageKey);
      return;
    }
    const absolute = evidenceFilePath(storageKey);
    if (absolute) await unlink(absolute);
  } catch {
    // Removing the DB row matters more than the orphaned file.
  }
}
