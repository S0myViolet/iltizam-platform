import { NextRequest, NextResponse } from "next/server";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import { requireOrgAccess, requireSession, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { evidenceFilePath, evidenceFileStream, isRemoteStorageKey } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
  const { id } = await params;
  const session = await requireSession();
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: { answer: { include: { assessment: { select: { organizationId: true } } } } },
  });
  if (!evidence || evidence.kind !== "file" || !evidence.storageKey) {
    throw new AuthError(404, "Not found.");
  }
  requireOrgAccess(session, evidence.answer.assessment.organizationId);
  if (isRemoteStorageKey(evidence.storageKey)) {
    return NextResponse.redirect(evidence.storageKey);
  }
  const absolute = evidenceFilePath(evidence.storageKey);
  if (!absolute) {
    return NextResponse.json({ error: "Stored file is missing." }, { status: 404 });
  }
  const { size } = await stat(absolute);
  const stream = Readable.toWeb(evidenceFileStream(absolute)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Length": String(size),
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${evidence.fileName.replace(/"/g, "")}"`,
    },
  });
  } catch (err) {
    return handleApiError(err);
  }
}
