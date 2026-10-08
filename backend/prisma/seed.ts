// Demo verisi: 1 firma, 1 site (A/B blok × 8 daire), kişiler, aidatlar, tahsilatlar, giderler.
// Giriş: yonetici@demo.com / Demo12345 — sakin: 5321112233 / sakin123
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const D = (v: number) => new Prisma.Decimal(v);

const FIRST = ['Ahmet', 'Ayşe', 'Mehmet', 'Fatma', 'Mustafa', 'Zeynep', 'Ali', 'Elif', 'Hasan', 'Emine', 'Hüseyin', 'Hatice', 'İbrahim', 'Merve'];
const LAST = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kurt'];

async function main() {
  const exists = await prisma.user.findUnique({ where: { email: 'yonetici@demo.com' } });
  if (exists) {
    console.log('Demo verisi zaten var, atlanıyor.');
    return;
  }

  const tenant = await prisma.tenant.create({ data: { name: 'Demo Yönetim Ltd.' } });
  const t = tenant.id;
  await prisma.user.create({
    data: { tenantId: t, name: 'Demo Yönetici', email: 'yonetici@demo.com', passwordHash: await bcrypt.hash('Demo12345', 10), role: 'ADMIN' },
  });

  const [aidat, , tahsilat, elektrik, temizlik, asansor] = await Promise.all([
    prisma.financeItem.create({ data: { tenantId: t, name: 'Aidat', kind: 'CHARGE', isDefault: true } }),
    prisma.financeItem.create({ data: { tenantId: t, name: 'Ortak gider payı', kind: 'CHARGE' } }),
    prisma.financeItem.create({ data: { tenantId: t, name: 'Aidat tahsilatı', kind: 'INCOME', isDefault: true } }),
    prisma.financeItem.create({ data: { tenantId: t, name: 'Ortak alan elektriği', kind: 'EXPENSE' } }),
    prisma.financeItem.create({ data: { tenantId: t, name: 'Temizlik hizmeti', kind: 'EXPENSE', isDefault: true } }),
    prisma.financeItem.create({ data: { tenantId: t, name: 'Asansör bakımı', kind: 'EXPENSE' } }),
  ]);

  const [t21, t31] = await Promise.all([
    prisma.unitType.create({ data: { tenantId: t, name: '2+1', code: '2+1', coefficient: 1 } }),
    prisma.unitType.create({ data: { tenantId: t, name: '3+1', code: '3+1', coefficient: 1.25 } }),
  ]);

  const site = await prisma.site.create({
    data: { tenantId: t, name: 'Hazar Siteleri', code: 'HZR', city: 'İstanbul', district: 'Kadıköy', address: 'Hazar Sk. No:42' },
  });
  const kasa = await prisma.paymentAccount.create({ data: { tenantId: t, siteId: site.id, kind: 'CASH', name: 'Hazar Siteleri Kasası' } });
  const banka = await prisma.paymentAccount.create({
    data: { tenantId: t, siteId: site.id, kind: 'BANK', name: 'Ziraat Bankası', iban: 'TR00 0000 0000 0000 0000 0000 00', openingBalance: D(25000) },
  });
  const tedarikci = await prisma.currentAccount.create({
    data: { tenantId: t, kind: 'SUPPLIER', title: 'Pırıl Temizlik Hizmetleri', taxOffice: 'Kadıköy', taxNo: '1234567890', phone: '2161234567', city: 'İstanbul' },
  });

  let n = 0;
  for (const blockName of ['A Blok', 'B Blok']) {
    const block = await prisma.block.create({ data: { siteId: site.id, name: blockName } });
    for (let door = 1; door <= 8; door++) {
      const big = door % 4 === 0;
      const unit = await prisma.unit.create({
        data: {
          tenantId: t,
          siteId: site.id,
          blockId: block.id,
          doorNo: String(door),
          floor: Math.ceil(door / 2),
          areaSqm: D(big ? 140 : 105),
          landShare: D(big ? 80 : 60),
          unitTypeId: big ? t31.id : t21.id,
        },
      });
      if (door === 8 && blockName === 'B Blok') continue; // boş daire
      const owner = await prisma.person.create({
        data: {
          tenantId: t,
          firstName: FIRST[n % FIRST.length],
          lastName: LAST[(n * 3) % LAST.length],
          phone: n === 0 ? '5321112233' : `53${String(10000000 + n * 7919).slice(0, 8)}`,
          kvkkConsentAt: n % 3 === 0 ? null : new Date(),
        },
      });
      n++;
      await prisma.unitOccupant.create({ data: { unitId: unit.id, personId: owner.id, role: 'OWNER', isDebtor: true } });
      if (n === 1) {
        await prisma.user.create({
          data: {
            tenantId: t,
            name: `${owner.firstName} ${owner.lastName}`,
            phone: owner.phone,
            passwordHash: await bcrypt.hash('sakin123', 10),
            role: 'RESIDENT',
            personId: owner.id,
          },
        });
      }
    }
  }


  // Son 4 ay için aidat — doğrudan tablolara (FIFO dağıtımı BillingService ile aynı kurala göre)
  const now = new Date();
  const units = await prisma.unit.findMany({ where: { siteId: site.id }, include: { unitType: true, occupants: true } });
  for (let k = 3; k >= 0; k--) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - k;
    const date = new Date(Date.UTC(y, m, 1));
    const period = date.toISOString().slice(0, 7);
    const batch = await prisma.chargeBatch.create({
      data: { tenantId: t, siteId: site.id, kind: 'AIDAT', financeItemId: aidat.id, description: `Aidat — ${period}`, totalAmount: D(0) },
    });
    let total = D(0);
    for (const u of units) {
      const amount = D(1500).mul(u.unitType?.coefficient ?? 1).toDecimalPlaces(2);
      total = total.add(amount);
      await prisma.charge.create({
        data: {
          tenantId: t,
          siteId: site.id,
          unitId: u.id,
          personId: u.occupants[0]?.personId,
          batchId: batch.id,
          financeItemId: aidat.id,
          period,
          description: 'Aidat',
          amount,
          date,
          dueDate: new Date(Date.UTC(y, m, 10, 23, 59)),
        },
      });
    }
    await prisma.chargeBatch.update({ where: { id: batch.id }, data: { totalAmount: total } });
  }

  // Tahsilatlar: dairelerin çoğu ödemiş, bazıları gecikmede
  for (const [i, u] of units.entries()) {
    const charges = await prisma.charge.findMany({ where: { unitId: u.id }, orderBy: { dueDate: 'asc' } });
    const payCount = i % 5 === 0 ? 1 : i % 4 === 0 ? 2 : charges.length - 1;
    for (const c of charges.slice(0, payCount)) {
      const date = new Date(c.dueDate.getTime() - 3 * 86_400_000);
      const account = i % 2 ? banka : kasa;
      const payment = await prisma.payment.create({
        data: {
          tenantId: t,
          siteId: site.id,
          unitId: u.id,
          personId: c.personId,
          paymentAccountId: account.id,
          amount: c.amount,
          allocated: c.amount,
          date,
          description: 'Aidat ödemesi',
        },
      });
      await prisma.paymentAllocation.create({ data: { paymentId: payment.id, chargeId: c.id, amount: c.amount } });
      await prisma.charge.update({ where: { id: c.id }, data: { paid: c.amount } });
      await prisma.cashTransaction.create({
        data: {
          tenantId: t,
          paymentAccountId: account.id,
          direction: 'IN',
          source: 'COLLECTION',
          amount: c.amount,
          date,
          description: 'Aidat ödemesi',
          siteId: site.id,
          financeItemId: tahsilat.id,
          paymentId: payment.id,
        },
      });
    }
  }

  // Giderler
  for (let k = 3; k >= 0; k--) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 15));
    await prisma.cashTransaction.createMany({
      data: [
        { tenantId: t, paymentAccountId: banka.id, direction: 'OUT', source: 'EXPENSE', amount: D(3200 + k * 150), date, description: 'Ortak alan elektrik faturası', siteId: site.id, financeItemId: elektrik.id },
        { tenantId: t, paymentAccountId: kasa.id, direction: 'OUT', source: 'EXPENSE', amount: D(1800), date, description: 'Asansör aylık bakım', siteId: site.id, financeItemId: asansor.id },
      ],
    });
  }
  await prisma.supplierInvoice.create({
    data: {
      tenantId: t,
      currentAccountId: tedarikci.id,
      siteId: site.id,
      financeItemId: temizlik.id,
      invoiceNo: 'PRL2026-0412',
      date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      dueDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 20)),
      amount: D(9500),
      description: 'Aylık temizlik hizmeti',
    },
  });

  await prisma.announcement.createMany({
    data: [
      { tenantId: t, siteId: site.id, title: 'Su kesintisi', body: 'Cumartesi 09:00–13:00 arası depo temizliği nedeniyle su kesintisi yapılacaktır.' },
      { tenantId: t, siteId: null, title: 'Olağan genel kurul', body: 'Yıllık olağan genel kurul toplantısı ayın son pazar günü saat 14:00’te sosyal tesiste yapılacaktır.' },
    ],
  });
  const firstUnit = units[0];
  await prisma.ticket.create({
    data: {
      tenantId: t,
      siteId: site.id,
      unitId: firstUnit.id,
      personId: firstUnit.occupants[0]?.personId,
      title: 'Koridor lambası yanmıyor',
      description: '3. kat koridor lambası iki gündür yanmıyor.',
    },
  });

  console.log('Demo verisi hazır.\n  Yönetici: yonetici@demo.com / Demo12345\n  Sakin:    5321112233 / sakin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
