import { NextRequest, NextResponse } from "next/server";
import { createAssessment, listAssessments } from "@/lib/assessments";
import { prisma } from "@/lib/db";

export async function GET() {
  const assessments = await listAssessments();
  return NextResponse.json({ assessments });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const companyName = typeof b.companyName === "string" ? b.companyName.trim() : "";
  if (!companyName) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  const selectedRegimes = Array.isArray(b.selectedRegimes)
    ? b.selectedRegimes.filter((r): r is string => typeof r === "string")
    : [];
  if (selectedRegimes.length === 0) {
    return NextResponse.json({ error: "Select at least one regulation." }, { status: 400 });
  }
  const known = await prisma.regulation.findMany({
    where: { code: { in: selectedRegimes } },
    select: { code: true },
  });
  if (known.length !== selectedRegimes.length) {
    return NextResponse.json({ error: "Unknown regulation code." }, { status: 400 });
  }

  const optional = (key: string) =>
    typeof b[key] === "string" && (b[key] as string).trim() ? (b[key] as string).trim() : null;

  try {
    const assessment = await createAssessment({
      companyName,
      companySize: optional("companySize"),
      industry: optional("industry"),
      country: optional("country"),
      selectedRegimes,
    });
    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    // e.g. a selected regulation whose control library is not seeded yet
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create the assessment." },
      { status: 400 }
    );
  }
}
