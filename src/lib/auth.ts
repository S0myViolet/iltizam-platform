// Authentication & authorization.
//
// Demo-grade authentication: a signed HTTP-only session cookie carries the
// user id; users are seeded (no self-signup). ALL authorization is enforced
// server-side against OrganizationMembership roles — the cookie only
// identifies the user. Swapping in a production IdP later replaces only
// createSession/getSession; every permission check stays as-is.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";
import { roleHasPermission, type MembershipRole, type Permission } from "./types";

const COOKIE_NAME = "iltizam_session";

function secret(): string {
  return process.env.SESSION_SECRET ?? "iltizam-dev-secret-change-in-production";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function encodeSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function decodeSessionToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(userId);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export interface SessionMembership {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  demoOrganization: boolean;
  role: MembershipRole;
}

export interface Session {
  userId: string;
  name: string;
  email: string;
  isPlatformAdmin: boolean;
  memberships: SessionMembership[];
  /** The organization this session is acting in (first active membership). */
  activeOrg: SessionMembership | null;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = decodeSessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: { status: "active" },
        include: { organization: { select: { id: true, name: true, demoOrganization: true } } },
      },
    },
  });
  if (!user) return null;

  const memberships: SessionMembership[] = user.memberships.map((m) => ({
    membershipId: m.id,
    organizationId: m.organization.id,
    organizationName: m.organization.name,
    demoOrganization: m.organization.demoOrganization,
    role: m.role as MembershipRole,
  }));

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    isPlatformAdmin: user.isPlatformAdmin,
    memberships,
    activeOrg: memberships[0] ?? null,
  };
}

export const SESSION_COOKIE = COOKIE_NAME;

// ─── Guards (throw AuthError; API routes map to 401/403) ────────────────────

export class AuthError extends Error {
  constructor(
    public status: 401 | 403 | 404,
    message: string
  ) {
    super(message);
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError(401, "Sign in required.");
  return session;
}

/**
 * Tenant gate: the session must have an active membership in `organizationId`
 * (platform admins pass for read/demo operations). Returns the membership
 * role used for permission checks.
 */
export function requireOrgAccess(session: Session, organizationId: string): SessionMembership {
  const membership = session.memberships.find((m) => m.organizationId === organizationId);
  if (membership) return membership;
  if (session.isPlatformAdmin) {
    return {
      membershipId: "platform-admin",
      organizationId,
      organizationName: "",
      demoOrganization: false,
      role: "client_admin",
    };
  }
  // 404, not 403 — do not confirm the resource exists to another tenant.
  throw new AuthError(404, "Not found.");
}

export function requirePermission(
  session: Session,
  organizationId: string,
  permission: Permission
): SessionMembership {
  const membership = requireOrgAccess(session, organizationId);
  if (session.isPlatformAdmin) return membership;
  if (!roleHasPermission(membership.role, permission)) {
    throw new AuthError(403, "You do not have permission for this action.");
  }
  return membership;
}

export function requirePlatformAdmin(session: Session): void {
  if (!session.isPlatformAdmin) throw new AuthError(404, "Not found.");
}

export function demoToolsEnabled(): boolean {
  return process.env.ENABLE_DEMO_TOOLS === "true" || process.env.NODE_ENV !== "production";
}

/** Resolve an assessment's organization and gate on it. */
export async function requireAssessmentAccess(session: Session, assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, organizationId: true },
  });
  if (!assessment) throw new AuthError(404, "Not found.");
  const membership = requireOrgAccess(session, assessment.organizationId);
  return { assessment, membership };
}
