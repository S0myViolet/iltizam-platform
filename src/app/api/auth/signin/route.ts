import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encodeSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

// Demo-grade sign-in: select a seeded user by email. There is no self-signup
// and no password ceremony — this authenticates *who you are demonstrating
// as*; every permission is still enforced server-side per membership role.

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const email = typeof (body as Record<string, unknown>).email === "string"
    ? ((body as Record<string, unknown>).email as string).trim().toLowerCase()
    : "";
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "No such demonstration user." }, { status: 401 });
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { userId: user.id, status: "active" },
    select: { organizationId: true },
  });
  await writeAudit({
    organizationId: membership?.organizationId ?? null,
    actorUserId: user.id,
    actorName: user.name,
    action: "user_signed_in",
    entityType: "User",
    entityId: user.id,
    summary: `${user.name} signed in.`,
  });

  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(SESSION_COOKIE, encodeSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
