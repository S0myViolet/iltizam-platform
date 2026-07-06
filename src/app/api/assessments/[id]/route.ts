import { NextRequest, NextResponse } from "next/server";
import { getAssessmentBundle } from "@/lib/assessments";
import { prisma } from "@/lib/db";
import { isAssessmentStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const bundle = await getAssessmentBundle(id);
  if (!bundle) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }
  return NextResponse.json(bundle);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.assessment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if ("status" in b) {
    if (!isAssessmentStatus(b.status)) {
      return NextResponse.json({ error: "Invalid assessment status." }, { status: 400 });
    }
    data.status = b.status;
    data.completedAt = b.status === "completed" ? (existing.completedAt ?? new Date()) : null;
  }
  for (const key of ["companyName", "companySize", "industry", "country"] as const) {
    if (key in b) {
      if (typeof b[key] !== "string" && b[key] !== null) {
        return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
      }
      const value = typeof b[key] === "string" ? (b[key] as string).trim() : null;
      if (key === "companyName" && !value) {
        return NextResponse.json({ error: "Company name cannot be empty." }, { status: 400 });
      }
      data[key] = value;
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  await prisma.assessment.update({ where: { id }, data });
  const bundle = await getAssessmentBundle(id);
  return NextResponse.json(bundle);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.assessment.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }
  await prisma.assessment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
