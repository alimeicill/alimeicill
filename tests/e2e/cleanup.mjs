// Uçtan uca testlerin bıraktığı kayıtları siler; ardından `npm run db:seed` demo verisini sıfırlar.
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
try {
  const dues = await p.due.findMany({ where: { period: '2030-01' }, select: { id: true } });
  await p.payment.deleteMany({ where: { dueId: { in: dues.map((d) => d.id) } } });
  await p.due.deleteMany({ where: { id: { in: dues.map((d) => d.id) } } });
  const users = await p.user.findMany({ where: { email: { startsWith: 'test-', endsWith: '@example.com' } } });
  for (const u of users) {
    await p.user.delete({ where: { id: u.id } });
    if (u.tenantId) await p.tenant.delete({ where: { id: u.tenantId } });
  }
  await p.passwordResetToken.deleteMany({});
  console.log(`Temizlendi: ${dues.length} test borcu, ${users.length} test hesabı.`);
} finally {
  await p.$disconnect();
}
