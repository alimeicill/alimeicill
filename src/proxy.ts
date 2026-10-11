import { NextResponse, type NextRequest } from 'next/server';
import { areaOf, areaOfPath, homePath, MANAGER_ROLES } from '@/lib/auth/roles';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/token';

// Oturum gerektirmeyen API uçları (giriş, kayıt, şifre sıfırlama). Cron kendi gizli anahtarıyla korunur.
const PUBLIC_API = ['/api/auth/', '/api/cron/'];
// Giriş yapmış kullanıcı bu sayfalardan paneline yönlendirilir. /sifre-sifirla (davet ve sıfırlama
// bağlantısı) bilerek dışarıda: başka bir hesap açıkken de bağlantı çalışmalı.
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
  // _next/ altındaki derleme dosyaları ve geliştirme bağlantıları (HMR) proxy'den geçmez.
  matcher: ['/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
