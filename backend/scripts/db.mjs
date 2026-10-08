// Docker olmadan geliştirme veritabanı: gömülü PostgreSQL'i 5433 portunda başlatır.
// Veriler backend/.pgdata klasöründe kalıcıdır. Durdurmak için Ctrl+C.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.pgdata');
const fresh = !existsSync(path.join(dataDir, 'PG_VERSION'));

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'siteyonet',
  password: 'siteyonet',
  port: 5433,
  persistent: true,
  // Türkçe Windows locale adı (Türkiye) ASCII olmadığı için initdb'yi bozar.
  initdbFlags: ['--locale=C', '--encoding=UTF8'],
});

if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase('siteyonet');
console.log('PostgreSQL hazır: localhost:5433 (veritabanı: siteyonet)');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
