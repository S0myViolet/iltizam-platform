import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteEvidenceFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const evidence = await prisma.evidence.findUnique({ where: { id } });
  if (!evidence) {
    return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  }
  if (evidence.kind === "file" && evidence.storageKey) {
    await deleteEvidenceFile(evidence.storageKey);
  }
  await prisma.evidence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
