import { NextRequest, NextResponse } from "next/server";
import { refreshAssessmentAfterAnswerChange } from "@/lib/assessments";
import { prisma } from "@/lib/db";
import { isAnswerValue, isRemediationStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.controlAnswer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Answer not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const data: Record<string, unknown> = {};

  if ("answer" in b) {
    if (!isAnswerValue(b.answer)) {
      return NextResponse.json({ error: "Invalid answer value." }, { status: 400 });
    }
    data.answer = b.answer;
    data.lastReviewedAt = new Date();
  }
  if ("remediationStatus" in b) {
    if (!isRemediationStatus(b.remediationStatus)) {
      return NextResponse.json({ error: "Invalid remediation status." }, { status: 400 });
    }
    data.remediationStatus = b.remediationStatus;
  }
  for (const key of ["ownerName", "ownerEmail", "notes"] as const) {
    if (key in b) {
      if (typeof b[key] !== "string" && b[key] !== null) {
        return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
      }
      const value = typeof b[key] === "string" ? (b[key] as string).trim() : null;
      data[key] = value || null;
    }
  }
  if ("dueDate" in b) {
    if (b.dueDate === null || b.dueDate === "") {
      data.dueDate = null;
    } else if (typeof b.dueDate === "string" && !Number.isNaN(Date.parse(b.dueDate))) {
      data.dueDate = new Date(b.dueDate);
    } else {
      return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const updated = await prisma.controlAnswer.update({ where: { id }, data });
  await refreshAssessmentAfterAnswerChange(existing.assessmentId);

  const assessment = await prisma.assessment.findUnique({
    where: { id: existing.assessmentId },
    select: { status: true, readinessScore: true, mandatoryScore: true, importantScore: true },
  });
  return NextResponse.json({ answer: updated, assessment });
}
