import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { MAX_UPLOAD_BYTES, saveEvidenceFile } from "@/lib/storage";
import { isEvidenceType } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

// POST /api/answers/:id/evidence
//   multipart/form-data with `file`  → uploaded file evidence
//   application/json {url, title}    → link evidence
// Both accept `evidenceType` and optional `uploadedBy`.
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const answer = await prisma.controlAnswer.findUnique({ where: { id }, select: { id: true } });
  if (!answer) {
    return NextResponse.json({ error: "Answer not found." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Attach a non-empty file." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File is too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB).` },
        { status: 400 }
      );
    }
    const evidenceTypeRaw = form.get("evidenceType");
    const evidenceType = isEvidenceType(evidenceTypeRaw) ? evidenceTypeRaw : "other";
    const uploadedBy = typeof form.get("uploadedBy") === "string" ? String(form.get("uploadedBy")).trim() || null : null;

    const { storageKey, fileName } = await saveEvidenceFile(id, file);
    const evidenceId = randomUUID();
    const evidence = await prisma.evidence.create({
      data: {
        id: evidenceId,
        answerId: id,
        kind: "file",
        fileName,
        fileUrl: `/api/evidence/${evidenceId}/download`,
        storageKey,
        evidenceType,
        uploadedBy,
      },
    });
    return NextResponse.json({ evidence }, { status: 201 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a file (multipart) or a link (JSON)." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const url = typeof b.url === "string" ? b.url.trim() : "";
  if (!/^https?:\/\/\S+$/i.test(url)) {
    return NextResponse.json({ error: "Provide a valid http(s) link." }, { status: 400 });
  }
  const title = typeof b.title === "string" && b.title.trim() ? b.title.trim() : url;
  const evidenceType = isEvidenceType(b.evidenceType) ? b.evidenceType : "other";
  const uploadedBy = typeof b.uploadedBy === "string" && b.uploadedBy.trim() ? b.uploadedBy.trim() : null;

  const evidence = await prisma.evidence.create({
    data: {
      answerId: id,
      kind: "link",
      fileName: title.slice(0, 200),
      fileUrl: url,
      evidenceType,
      uploadedBy,
    },
  });
  return NextResponse.json({ evidence }, { status: 201 });
}
