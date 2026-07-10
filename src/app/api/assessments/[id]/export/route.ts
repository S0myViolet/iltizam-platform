import { NextRequest, NextResponse } from "next/server";
import { getAssessmentBundle } from "@/lib/assessments";
import { requireAssessmentAccess, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { buildAssessmentCsv } from "@/lib/csv";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
  const { id } = await params;
  const session = await requireSession();
  await requireAssessmentAccess(session, id);
  const bundle = await getAssessmentBundle(id);
  if (!bundle) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }
  const csv = buildAssessmentCsv(bundle);
  const safeName = bundle.assessment.companyName.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 60);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iltizam-assessment-${safeName || "export"}.csv"`,
    },
  });
  } catch (err) {
    return handleApiError(err);
  }
}
