// Uçtan uca testlerin bıraktığı kayıtları siler; ardından `npm run db:seed` demo verisini sıfırlar.
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
try {
  const dues = await p.due.findMany({ where: { period: '2030-01' }, select: { id: true } });
  await p.payment.deleteMany({ where: { dueId: { in: dues.map((d) => d.id) } } });
  await p.due.deleteMany({ where: { id: { in: dues.map((d) => d.id) } } });
  // Kasa testlerinin hesap ve hareketleri ("TEST" ile başlar); test borçlarının hareketleri tahsilatla birlikte silinir.
  const testAccounts = await p.cashAccount.findMany({ where: { name: { startsWith: 'TEST' } }, select: { id: true } });
  const txs = await p.cashTransaction.deleteMany({
    where: { OR: [{ accountId: { in: testAccounts.map((a) => a.id) } }, { description: { startsWith: 'TEST' } }] },
  });
  await p.cashAccount.deleteMany({ where: { id: { in: testAccounts.map((a) => a.id) } } });
  const users = await p.user.findMany({ where: { email: { startsWith: 'test-', endsWith: '@example.com' } } });
  for (const u of users) {
    await p.user.delete({ where: { id: u.id } });
    if (u.tenantId) {
      await p.cashTransaction.deleteMany({ where: { tenantId: u.tenantId } });
      await p.cashAccount.deleteMany({ where: { tenantId: u.tenantId } });
      await p.tenant.delete({ where: { id: u.tenantId } });
    }
  }
  await p.passwordResetToken.deleteMany({});
  console.log(`Temizlendi: ${dues.length} test borcu, ${users.length} test hesabı, ${testAccounts.length} test kasası, ${txs.count} kasa hareketi.`);
} finally {
  await p.$disconnect();
}
