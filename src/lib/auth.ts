import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'zeroto1_session';
export const ACTIVE_KID_COOKIE_NAME = 'zeroto1_kid_id';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'zeroto1-secret-key-32-bytes-minimum-security-2026'
);

export interface SessionPayload {
  userId: string;
  householdId: string;
  email: string;
  name: string;
  role: string;
  region: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const getSession = getCurrentSession;

export async function getActiveKidId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_KID_COOKIE_NAME)?.value || null;
}

