import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, demoToolsEnabled, requireOrgAccess, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";
import { parseVaultFile, readManifest } from "@/lib/vault";

// Sample-row preview from a vault dataset — proves the scan reads real rows.
// Masked by default; ?reveal=true requires a platform admin (demo data only).
// Never available outside the demo organization.

const PREVIEW_ROWS = 8;
const PERSONAL_FIELDS =
  /name|email|phone|national_id|iban|contact|handled_by|subject|appointee|customer/i;

function mask(value: unknown): string {
  const s = String(value ?? "");
  if (s.length <= 2) return "••";
  return `${s[0]}${"•".repeat(Math.min(8, Math.max(2, s.length - 2)))}${s[s.length - 1]}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!demoToolsEnabled()) throw new AuthError(404, "Not found.");
    const org = await prisma.organization.findFirst({ where: { demoOrganization: true } });
    if (!org) throw new AuthError(404, "Not found.");
    // Members of the demo org (and platform admins) may preview.
    requireOrgAccess(session, org.id);

    const fileName = request.nextUrl.searchParams.get("file") ?? "";
    const reveal = request.nextUrl.searchParams.get("reveal") === "true";
    if (reveal && !session.isPlatformAdmin) {
      throw new AuthError(403, "Only a platform administrator may reveal synthetic demo rows.");
    }

    const manifest = readManifest();
    const entry = manifest.entries.find((e) => e.fileName === fileName);
    if (!entry) throw new AuthError(404, "Not found.");

    const parsed = await parseVaultFile(entry.fileName, 500);
    const sample = parsed.rows.slice(0, PREVIEW_ROWS).map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        out[k] = !reveal && PERSONAL_FIELDS.test(k) ? mask(v) : v;
      }
      return out;
    });

    await writeAudit({
      organizationId: org.id,
      actorUserId: session.userId,
      actorName: session.name,
      action: reveal ? "demo_rows_revealed" : "demo_rows_previewed",
      entityType: "ConnectorResource",
      summary: `${session.name} previewed ${sample.length} synthetic rows of ${entry.fileName}${reveal ? " (revealed)" : " (masked)"}.`,
    });

    return NextResponse.json({
      file: entry.fileName,
      fileType: parsed.fileType,
      rowCount: parsed.rowCount,
      columns: parsed.columns,
      rows: sample,
      textPreview: parsed.textPreview ?? null,
      masked: !reveal,
      note: "Entirely synthetic demonstration data. No real personal data.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
