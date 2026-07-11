import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encodeSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";
import { writeAudit } from "@/lib/audit";

// Email + password sign-in. The same safe message covers a wrong password and
// an unknown email so the endpoint never confirms whether an account exists.
const SAFE_MESSAGE = "Email or password not recognized. Create an account if you do not have one.";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: SAFE_MESSAGE }, { status: 401 });
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

  const res = NextResponse.json({ ok: true, name: user.name, isPlatformAdmin: user.isPlatformAdmin });
  res.cookies.set(SESSION_COOKIE, encodeSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
