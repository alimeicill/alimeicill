// Yerel geliştirme veritabanı (Docker gerekmez): npm run db
// Veriler proje içindeki .pgdata klasöründe kalır. Açık kaldığı sürece localhost:54329'da çalışır.
// İlk kurulumdan sonra: npx prisma migrate deploy && npm run db:seed
import { existsSync } from 'node:fs';
import EmbeddedPostgres from 'embedded-postgres';

const pg = new EmbeddedPostgres({
  databaseDir: './.pgdata',
  user: 'postgres',
  password: 'devpass',
  port: 54329,
  persistent: true,
  // Türkçe Windows yerel ayarında initdb hata veriyor; C yerel ayarı + UTF-8 kullanılır.
  initdbFlags: ['--locale=C', '--encoding=UTF8'],
});

if (!existsSync('./.pgdata/PG_VERSION')) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase('siteyonet');
} catch {
  // Veritabanı zaten var.
}
console.log('Veritabanı hazır: postgresql://postgres:devpass@localhost:54329/siteyonet (kapatmak için Ctrl+C)');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
