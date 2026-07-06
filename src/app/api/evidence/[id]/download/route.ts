import { NextRequest, NextResponse } from "next/server";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import { evidenceFilePath, evidenceFileStream, isRemoteStorageKey } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const evidence = await prisma.evidence.findUnique({ where: { id } });
  if (!evidence || evidence.kind !== "file" || !evidence.storageKey) {
    return NextResponse.json({ error: "Evidence file not found." }, { status: 404 });
  }
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
}
