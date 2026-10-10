// Uygulama açılmadan önce veritabanı şemasını günceller (prisma migrate deploy).
// DATABASE_URL yoksa ya da migration başarısız olursa site yine açılır;
// sadece veritabanı kullanan özellikler hata verir.
import { execSync } from 'node:child_process';

if (!process.env.DATABASE_URL) {
  console.warn('[migrate] DATABASE_URL tanımlı değil, migration atlandı.');
  process.exit(0);
}

try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch {
  console.error('[migrate] prisma migrate deploy başarısız oldu, uygulama yine de başlatılıyor.');
}
