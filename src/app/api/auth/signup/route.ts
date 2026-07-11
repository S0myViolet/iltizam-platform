import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encodeSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword } from "@/lib/passwords";
import { writeAudit } from "@/lib/audit";
import { createAssessmentWithControls } from "@/lib/seeding";

// Create-account: email + password + organization name. Each new account gets
// its own tenant workspace (client_admin of a fresh organization) and a
// starter PDPL+GDPR assessment — the same services every tenant uses.

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const organizationName =
    typeof b.organizationName === "string" && b.organizationName.trim()
      ? b.organizationName.trim()
      : name
        ? `${name}'s organization`
        : "";

  if (!name) return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in instead." },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password) },
  });
  const org = await prisma.organization.create({
    data: { name: organizationName, demoOrganization: false },
  });
  await prisma.organizationMembership.create({
    data: { organizationId: org.id, userId: user.id, role: "client_admin", status: "active", joinedAt: new Date() },
  });
  try {
    await createAssessmentWithControls(prisma, {
      organizationId: org.id,
      title: "PDPL & GDPR readiness review",
      regulationCodes: ["EG-PDPL", "EU-GDPR"],
      startedByUserId: user.id,
    });
  } catch {
    // Regulations not seeded yet — the workspace still works; an assessment
    // can be created from the app once the libraries are loaded.
  }
  await writeAudit({
    organizationId: org.id,
    actorUserId: user.id,
    actorName: user.name,
    action: "account_created",
    entityType: "User",
    entityId: user.id,
    summary: `${user.name} created an account and the workspace "${org.name}".`,
  });

  const res = NextResponse.json({ ok: true, name: user.name }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, encodeSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
