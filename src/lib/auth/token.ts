// Oturum belirtecinin imzalanması ve doğrulanması (proxy ve sunucu kodu ortak kullanır).
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@prisma/client';

export const SESSION_COOKIE = 'session';
export const SESSION_DAYS = 7;

export interface SessionPayload {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

let warned = false;
function key() {
  let secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET tanımlı değil.');
    // Yalnızca yerel geliştirmede: sabit anahtar, oturumlar sunucu yeniden başlasa da geçerli kalır.
    secret = 'dev-only-session-secret-change-me';
    if (!warned) {
      console.warn('[auth] SESSION_SECRET tanımlı değil; geliştirme anahtarı kullanılıyor.');
      warned = true;
    }
  }
  return new TextEncoder().encode(secret);
}

export function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    if (typeof payload.userId !== 'string' || typeof payload.role !== 'string') return null;
    return { userId: payload.userId, tenantId: (payload.tenantId as string | null) ?? null, role: payload.role as UserRole };
  } catch {
    return null;
  }
}
