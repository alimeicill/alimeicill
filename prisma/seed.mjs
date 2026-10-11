// Demo site ve kullanıcıları oluşturur: npm run db:seed
// Kullanıcı kimlikleri src/lib/mock-data.ts ile aynıdır; böylece örnek dairelerin
// sahipleri (ownerId) gerçek hesaplarla eşleşir. Tekrar çalıştırmak güvenlidir.
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== '1') {
  console.error('Canlı ortamda demo hesapları oluşturulmaz. Gerçekten istiyorsanız ALLOW_DEMO_SEED=1 ile çalıştırın.');
  process.exit(1);
}

// Yalnızca yerel geliştirme / demo içindir.
const DEMO_PASSWORD = 'Demo2026!';

const TENANT = { id: 'tenant-001', name: 'Yıldız Konakları Sitesi', slug: 'yildiz-konaklari', type: 'SITE', city: 'İstanbul' };

// [id, ad, e-posta, rol, giriş yapabilir mi]
const USERS = [
  ['user-admin', 'Platform Yöneticisi', 'admin@demo.apartmanyonet.com', 'SUPER_ADMIN', true],
  ['user-001', 'Hasan Korkmaz', 'yonetici@demo.apartmanyonet.com', 'SITE_MANAGER', true],
  ['user-002', 'Zeynep Arslan', 'muhasebe@demo.apartmanyonet.com', 'ACCOUNTANT', true],
  ['user-staff', 'Murat Usta', 'personel@demo.apartmanyonet.com', 'TECHNICAL_STAFF', true],
  // A-201 dairesinin maliki: sakin paneli ve genel kurulda oy kullanma demosu.
  ['user-005', 'Mehmet Demir', 'sakin@demo.apartmanyonet.com', 'OWNER', true],
  // Diğer malik ve kiracılar (şifresiz; giriş yapamaz).
  ['user-003', 'Ahmet Yılmaz', 'ahmet.yilmaz@example.com', 'OWNER', false],
  ['user-004', 'Fatma Kaya', 'fatma.kaya@example.com', 'OWNER', false],
  ['user-006', 'Ayşe Çelik', 'ayse.celik@example.com', 'TENANT_RESIDENT', false],
  ['user-007', 'Mustafa Öztürk', 'mustafa.ozturk@example.com', 'OWNER', false],
  ['user-008', 'Elif Şahin', 'elif.sahin@example.com', 'OWNER', false],
];

const prisma = new PrismaClient();
try {
  await prisma.tenant.upsert({ where: { id: TENANT.id }, create: TENANT, update: { name: TENANT.name } });
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const [id, name, email, role, canLogin] of USERS) {
    const data = { name, email, role, tenantId: role === 'SUPER_ADMIN' ? null : TENANT.id, passwordHash: canLogin ? hash : null };
    await prisma.user.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  console.log(`Demo hazır: ${USERS.filter((u) => u[4]).length} giriş yapılabilir hesap (şifre bu dosyada).`);
} finally {
  await prisma.$disconnect();
}
