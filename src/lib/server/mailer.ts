import 'server-only';
import nodemailer from 'nodemailer';

/** SMTP ayarları ortam değişkenlerinden: SMTP_USER, SMTP_PASS (ve isteğe bağlı SMTP_HOST, SMTP_PORT, MAIL_FROM). */
export function mailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"ApartmanYönet" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

/** Uygulamanın dış adresi (e-postadaki bağlantılar için). APP_URL tanımlıysa o kullanılır. */
export function appUrl(request: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
  return `${proto}://${host}`;
}
