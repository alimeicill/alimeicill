import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { appUrl, mailConfigured, sendMail } from '@/lib/server/mailer';
import { recordFailure, tooManyAttempts } from '@/lib/auth/throttle';

const Schema = z.object({ email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin.') });
const TOKEN_MINUTES = 60;

// E-postanın kayıtlı olup olmadığı belli olmasın diye her durumda aynı yanıt verilir.
const GENERIC = { ok: true, message: 'Bu adres sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.' };

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { email } = parsed.data;

  // Aynı adrese kısa sürede çok sayıda e-posta gönderilmesini engelle.
  const key = `reset|${email}`;
  if (tooManyAttempts(key)) return NextResponse.json(GENERIC);
  recordFailure(key);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, isActive: true, passwordHash: true } });
  if (!user || !user.isActive || !user.passwordHash) return NextResponse.json(GENERIC);

  const token = randomBytes(32).toString('base64url');
  await prisma.$transaction([
    // Önceki kullanılmamış bağlantılar geçersiz olur.
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60 * 1000),
      },
    }),
  ]);

  const link = `${appUrl(request)}/sifre-sifirla?token=${token}`;
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[şifre sıfırlama] SMTP tanımlı değil. ${email} için bağlantı: ${link}`);
    } else {
      console.error('[şifre sıfırlama] SMTP_USER / SMTP_PASS tanımlı değil; e-posta gönderilemedi.');
    }
    return NextResponse.json(GENERIC);
  }

  try {
    await sendMail({
      to: email,
      subject: 'ApartmanYönet şifre sıfırlama',
      text: `Merhaba ${user.name},\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıyı ${TOKEN_MINUTES} dakika içinde açın:\n${link}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`,
      html: `<p>Merhaba ${user.name.replace(/[<>&]/g, '')},</p>
<p>Şifrenizi sıfırlamak için aşağıdaki butona <strong>${TOKEN_MINUTES} dakika</strong> içinde tıklayın.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Şifremi sıfırla</a></p>
<p style="color:#64748b;font-size:12px">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.</p>`,
    });
  } catch (e) {
    console.error('[şifre sıfırlama] e-posta gönderilemedi', e);
  }
  return NextResponse.json(GENERIC);
}
