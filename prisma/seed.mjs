// Demo site, kullanıcılar ve daireleri oluşturur: npm run db:seed
// Daire ve kişi kimlikleri prisma/demo-data.json'dan (src/lib/mock-data.ts kaynaklı) gelir.
// Tekrar çalıştırmak güvenlidir.
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== '1') {
  console.error('Canlı ortamda demo hesapları oluşturulmaz. Gerçekten istiyorsanız ALLOW_DEMO_SEED=1 ile çalıştırın.');
  process.exit(1);
}

// Yalnızca yerel geliştirme / demo içindir.
const DEMO_PASSWORD = 'Demo2026!';

const TENANT = { id: 'tenant-001', name: 'Yıldız Konakları Sitesi', slug: 'yildiz-konaklari', type: 'SITE', city: 'İstanbul' };

// Giriş yapabilen demo hesapları: [id, ad, e-posta, rol]
const LOGIN_USERS = [
  ['user-admin', 'Platform Yöneticisi', 'admin@demo.apartmanyonet.com', 'SUPER_ADMIN'],
  ['user-001', 'Hasan Korkmaz', 'yonetici@demo.apartmanyonet.com', 'SITE_MANAGER'],
  ['user-002', 'Zeynep Arslan', 'muhasebe@demo.apartmanyonet.com', 'ACCOUNTANT'],
  ['user-staff', 'Murat Usta', 'personel@demo.apartmanyonet.com', 'TECHNICAL_STAFF'],
  // A-201 dairesinin maliki: sakin paneli ve genel kurulda oy kullanma demosu.
  ['user-005', 'Mehmet Demir', 'sakin@demo.apartmanyonet.com', 'OWNER'],
];

const MOCK_ROLE = { site_manager: 'SITE_MANAGER', accountant: 'ACCOUNTANT', block_rep: 'OWNER', owner: 'OWNER', tenant: 'TENANT_RESIDENT' };
const STATUS = { occupied: 'OCCUPIED', vacant: 'EMPTY', maintenance: 'RENOVATION' };
const TYPE = { residential: 'RESIDENTIAL', commercial: 'COMMERCIAL', parking: 'PARKING' };

const demo = JSON.parse(readFileSync(new URL('./demo-data.json', import.meta.url), 'utf8'));
const prisma = new PrismaClient();

try {
  const t = TENANT.id;
  await prisma.tenant.upsert({ where: { id: t }, create: TENANT, update: { name: TENANT.name } });

  // Kişiler: örnek veri (e-postasız, girişsiz) + giriş yapabilen demo hesapları.
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const loginIds = new Set(LOGIN_USERS.map((u) => u[0]));
  for (const u of demo.users.filter((u) => !loginIds.has(u.id))) {
    // Örnek verideki e-postalar gerçek kişilere ait olabilir; aktarılmaz.
    // Örnek kişiler girişsiz başlar (davet akışını denemek için).
    const data = { name: u.name, email: null, passwordHash: null, role: MOCK_ROLE[u.role] ?? 'OWNER', tenantId: t };
    await prisma.user.upsert({ where: { id: u.id }, create: { id: u.id, ...data }, update: data });
  }
  for (const [id, name, email, role] of LOGIN_USERS) {
    const data = { name, email, role, tenantId: role === 'SUPER_ADMIN' ? null : t, passwordHash: hash };
    await prisma.user.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  // Bina ve bloklar
  const building = await prisma.building.upsert({
    where: { id: 'building-001' },
    create: { id: 'building-001', tenantId: t, name: 'Yıldız Konakları' },
    update: {},
  });
  const blockIds = {};
  for (const name of [...new Set(demo.units.map((u) => u.blockName))]) {
    const floors = Math.max(...demo.units.filter((u) => u.blockName === name).map((u) => u.floor));
    const id = `block-${name.split(' ')[0].toLowerCase()}`;
    await prisma.block.upsert({ where: { id }, create: { id, tenantId: t, buildingId: building.id, name, floorCount: floors }, update: { floorCount: floors } });
    blockIds[name] = id;
  }

  // Daireler, malik / kiracı bağları, araç ve evcil hayvanlar
  for (const u of demo.units) {
    const data = {
      tenantId: t,
      blockId: blockIds[u.blockName],
      number: u.number,
      floor: u.floor,
      type: TYPE[u.type] ?? 'RESIDENTIAL',
      size: u.areaSqm,
      shareRatio: u.ownershipShare,
      rooms: u.rooms ?? null,
      status: STATUS[u.status] ?? 'EMPTY',
      emergencyName: u.emergencyName ?? null,
      emergencyPhone: u.emergencyPhone ?? null,
    };
    await prisma.apartment.upsert({ where: { id: u.id }, create: { id: u.id, ...data }, update: data });

    const links = [];
    if (u.ownerId) links.push([u.ownerId, true]);
    else if (u.ownerName) {
      // Örnek veride kimliği olmayan malikler için kişi kaydı açılır.
      const id = `own-${u.id}`;
      await prisma.user.upsert({ where: { id }, create: { id, tenantId: t, name: u.ownerName, role: 'OWNER' }, update: { name: u.ownerName } });
      links.push([id, true]);
    }
    if (u.tenantName) {
      // Kiracı örnek kişi listesinde varsa o kayıt kullanılır, yoksa yeni kişi açılır.
      const known = demo.users.find((x) => x.name === u.tenantName);
      const id = known?.id ?? `res-${u.id}`;
      if (!known) {
        await prisma.user.upsert({ where: { id }, create: { id, tenantId: t, name: u.tenantName, role: 'TENANT_RESIDENT' }, update: { name: u.tenantName } });
      }
      links.push([id, false]);
    }
    for (const [userId, isOwner] of links) {
      await prisma.apartmentUser.upsert({
        where: { apartmentId_userId: { apartmentId: u.id, userId } },
        create: { apartmentId: u.id, userId, isOwner },
        update: { isOwner },
      });
    }

    await prisma.vehicle.deleteMany({ where: { apartmentId: u.id } });
    for (const plate of u.vehicles ?? []) await prisma.vehicle.create({ data: { apartmentId: u.id, plate, type: 'car' } });
    await prisma.pet.deleteMany({ where: { apartmentId: u.id } });
    for (const pet of u.pets ?? []) {
      const m = /^(.*?)\s*\((.*)\)$/.exec(pet);
      await prisma.pet.create({ data: { apartmentId: u.id, name: m ? m[1] : pet, type: m ? m[2] : 'other' } });
    }
  }

  // Örnek aidatlar: son üç ay (sitede hiç borç kaydı yoksa). En eski ay ödenmiş, ortadaki kısmen, son ay açık.
  if ((await prisma.due.count({ where: { tenantId: t } })) === 0) {
    const now = new Date();
    const periods = [2, 1, 0].map((back) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
      return { key: d.toISOString().slice(0, 7), due: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 15)) };
    });
    for (const [pi, p] of periods.entries()) {
      for (const [ui, u] of demo.units.entries()) {
        const amount = Math.round(u.ownershipShare * 400 * 100) / 100; // arsa payı × 400 ₺
        const paidAll = pi === 0 || (pi === 1 && ui % 3 !== 0);
        const due = await prisma.due.create({
          data: {
            tenantId: t,
            apartmentId: u.id,
            type: 'MANAGEMENT',
            period: p.key,
            description: 'Aidat',
            amount,
            dueDate: p.due,
            status: paidAll ? 'PAID' : 'PENDING',
            paidAmount: paidAll ? amount : 0,
            paidAt: paidAll ? new Date(p.due.getTime() - 3 * 86400000) : null,
          },
        });
        if (paidAll) {
          await prisma.payment.create({
            data: {
              tenantId: t,
              dueId: due.id,
              apartmentId: u.id,
              amount,
              method: ui % 2 ? 'BANK_TRANSFER' : 'CASH',
              status: 'COMPLETED',
              receiptNo: `DEMO-${p.key}-${u.id}`,
              paidAt: new Date(p.due.getTime() - 3 * 86400000),
            },
          });
        }
      }
    }
  }

  // Kasa & banka: bir nakit kasa, sakinlere gösterilen bir banka hesabı (IBAN örnek, kontrol hanesi geçerli).
  const ACCOUNTS = [
    { id: 'acc-kasa', name: 'Yönetim Kasası', type: 'CASH', bankName: null, iban: null, holderName: 'Hasan Korkmaz', showToResidents: false },
    { id: 'acc-banka', name: 'Aidat Hesabı', type: 'BANK', bankName: 'Garanti BBVA', iban: 'TR820006200000012345678901', holderName: 'Yıldız Konakları Site Yönetimi', showToResidents: true },
  ];
  for (const { id, ...a } of ACCOUNTS) {
    await prisma.cashAccount.upsert({ where: { id }, create: { id, tenantId: t, ...a }, update: { ...a, isActive: true } });
  }
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 3, 1));
  const demoTx = [
    { id: 'demo-open-kasa', accountId: 'acc-kasa', type: 'OPENING', amount: 2500, date: start, description: 'Açılış bakiyesi' },
    { id: 'demo-open-banka', accountId: 'acc-banka', type: 'OPENING', amount: 40000, date: start, description: 'Açılış bakiyesi' },
  ];
  // Örnek giderler: son üç ay, ayın 20'si.
  for (const back of [2, 1, 0]) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3 - back, 20));
    if (d > new Date()) continue;
    const key = d.toISOString().slice(0, 7);
    demoTx.push(
      { id: `demo-exp-asansor-${key}`, accountId: 'acc-banka', type: 'VENDOR_PAYMENT', amount: -2400, date: d, description: 'Asansör periyodik bakım' },
      { id: `demo-exp-elektrik-${key}`, accountId: 'acc-banka', type: 'EXPENSE', amount: -3150, date: d, description: 'Ortak alan elektriği' },
      { id: `demo-exp-temizlik-${key}`, accountId: 'acc-banka', type: 'VENDOR_PAYMENT', amount: -6000, date: d, description: 'Temizlik firması' },
      { id: `demo-exp-kirtasiye-${key}`, accountId: 'acc-kasa', type: 'EXPENSE', amount: -350, date: d, description: 'Kırtasiye ve sarf malzemesi' },
    );
  }
  for (const { id, ...x } of demoTx) {
    await prisma.cashTransaction.upsert({ where: { id }, create: { id, tenantId: t, ...x }, update: x });
  }
  // Kasaya işlenmemiş tahsilatlar: nakit → kasa, diğerleri → banka.
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const periodText = (k) => `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;
  const unposted = await prisma.payment.findMany({
    where: { tenantId: t, cashTransaction: null },
    include: { apartment: { select: { number: true } }, due: { select: { period: true, description: true } } },
  });
  for (const p of unposted) {
    await prisma.cashTransaction.create({
      data: {
        tenantId: t,
        accountId: p.method === 'CASH' ? 'acc-kasa' : 'acc-banka',
        type: 'DUES_COLLECTION',
        amount: p.amount,
        date: p.paidAt,
        description: `Daire ${p.apartment.number} · ${p.due ? `${periodText(p.due.period)} ${p.due.description ?? 'Aidat'}` : 'Avans'}`,
        paymentId: p.id,
      },
    });
  }

  console.log(`Demo hazır: ${demo.units.length} daire, ${LOGIN_USERS.length} giriş yapılabilir hesap (şifre bu dosyada).`);
} finally {
  await prisma.$disconnect();
}
