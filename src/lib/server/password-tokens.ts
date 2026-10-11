import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Şifre belirleme / sıfırlama bağlantısı için tek kullanımlık kod üretir.
 * Kullanıcının önceki kullanılmamış kodları geçersiz olur; veritabanında yalnızca özet saklanır.
 */
export async function createPasswordToken(userId: string, minutes: number) {
  const token = randomBytes(32).toString('base64url');
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + minutes * 60 * 1000) },
    }),
  ]);
  return token;
}
