import { NextResponse } from 'next/server';
import { requireManager } from '@/lib/auth/session';
import { appUrl, mailConfigured, sendMail } from '@/lib/server/mailer';
import { createPasswordToken } from '@/lib/server/password-tokens';
import { findResident } from '@/lib/server/residents';

type Ctx = { params: Promise<{ id: string }> };

const INVITE_DAYS = 7;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Sakine "şifreni belirle" bağlantısı üretir ve (SMTP tanımlıysa) e-postayla gönderir.
 * Bağlantı yöneticiye de döner; WhatsApp vb. ile iletilebilir.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireManager();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const user = await findResident(id, auth.tenantId);
  if (!user) return NextResponse.json({ error: 'Sakin bulunamadı.' }, { status: 404 });
  if (!user.email) return NextResponse.json({ error: 'Davet için önce sakinin e-posta adresini girin.' }, { status: 400 });
  // Şifresi olan hesabın bağlantısı yöneticiye verilirse hesap ele geçirilebilir.
  if (user.passwordHash) {
    return NextResponse.json(
      { error: 'Bu sakin zaten giriş yapabiliyor. Şifresini unuttuysa giriş ekranındaki "Şifremi unuttum" bağlantısını kullanmalı.' },
      { status: 409 },
    );
  }

  const token = await createPasswordToken(user.id, INVITE_DAYS * 24 * 60);
  const link = `${appUrl(request)}/sifre-sifirla?token=${token}&davet=1`;
  const siteName = auth.tenant?.name ?? 'siteniz';

  let emailed = false;
  if (mailConfigured()) {
    try {
      await sendMail({
        to: user.email,
        subject: `${siteName} — ApartmanYönet sakin paneline davet`,
        text: `Merhaba ${user.name},\n\n${auth.name}, sizi ${siteName} sakin paneline davet etti. Borçlarınızı görmek, duyuruları takip etmek ve genel kurulda oy kullanmak için ${INVITE_DAYS} gün içinde şifrenizi belirleyin:\n${link}\n`,
        html: `<p>Merhaba ${esc(user.name)},</p>
<p><strong>${esc(auth.name)}</strong>, sizi <strong>${esc(siteName)}</strong> sakin paneline davet etti. Borçlarınızı görmek, duyuruları takip etmek ve genel kurulda oy kullanmak için şifrenizi belirleyin.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Hesabımı etkinleştir</a></p>
<p style="color:#64748b;font-size:12px">Bağlantı ${INVITE_DAYS} gün geçerlidir.</p>`,
      });
      emailed = true;
    } catch (e) {
      console.error('[davet] e-posta gönderilemedi', e);
    }
  }

  return NextResponse.json({ ok: true, emailed, email: user.email, link, expiresInDays: INVITE_DAYS });
}
