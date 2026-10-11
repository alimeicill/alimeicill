import { NextResponse, type NextRequest } from 'next/server';
import { areaOf, areaOfPath, homePath, MANAGER_ROLES } from '@/lib/auth/roles';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/token';

// Oturum gerektirmeyen API uçları. Cron kendi gizli anahtarıyla korunur.
const PUBLIC_API = ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/cron/'];
const AUTH_PAGES = ['/giris', '/kayit', '/sifremi-unuttum'];

/**
 * İyimser kontrol: yalnızca imzalı çerezi okur. Asıl yetki kontrolü
 * route handler'larda (requireUser / requireManager) veritabanıyla yapılır.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();
    if (!session) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen giriş yapın.' }, { status: 401 });
    if (pathname.startsWith('/api/yonetici/') && !MANAGER_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return session ? NextResponse.redirect(new URL(homePath(session.role), req.url)) : NextResponse.next();
  }

  const area = areaOfPath(pathname);
  const needsLogin = area || pathname.startsWith('/dashboard') || pathname.startsWith('/kurulum');
  if (!needsLogin) return NextResponse.next();

  if (!session) {
    const login = new URL('/giris', req.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  // Rol seçme ekranı yerine doğrudan kullanıcının paneline.
  if (pathname.startsWith('/dashboard')) return NextResponse.redirect(new URL(homePath(session.role), req.url));
  if (pathname.startsWith('/kurulum') && !MANAGER_ROLES.includes(session.role)) {
    return NextResponse.redirect(new URL(homePath(session.role), req.url));
  }
  if (area && areaOf(session.role) !== area) return NextResponse.redirect(new URL(homePath(session.role), req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
