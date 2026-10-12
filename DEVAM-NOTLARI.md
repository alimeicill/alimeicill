# ApartmanYönet — Devam Notları

Son güncelleme: 12.10.2026. Yeni bir sohbette bu dosyayı okuyarak kaldığımız yerden devam edin.

## Hedef

Kullanıcının kendi projesi **ApartmanYönet**'i satılabilir, “premium” bir site/apartman yönetim SaaS'ına dönüştürmek.
(SiteYönet'e geçiş planı — “A planı” — iptal edildi; o çalışma `C:\Users\Alime\Desktop\allime` klasöründe
`apartmanyonet-entegrasyon` dalında duruyor, ana dala ve canlıya dokunulmadı.)

Çalışma sırası (kullanıcıyla kararlaştırıldı):
1. ✅ Gerçek giriş sistemi ve firma (tenant) ayrımı
2. ✅ Daireler ve sakinler veritabanında, daire sahipliği, şifremi unuttum, sakin daveti
3. ✅ Aidat modülü (tahakkuk, tahsilat, gecikme tazminatı, sakin borç sayfası)
4. ⏭️ **Sıradaki: Kasa & Banka + pano** — tahsilatlar kasaya işlensin, sitenin IBAN'ı sakin sayfasında görünsün,
   panodaki rakamlar (doluluk, tahsilat, borç) gerçek veriden gelsin
5. Sonra kalan modüller (aşağıdaki liste), ardından online ödeme (iyzico/PayTR) ve canlıya alma

## Canlıya alma durumu (önemli)

- Canlı adres: https://allime-apartmanynetimapp-jhluxh-bfc571-135-181-88-198.sslip.io/ (Dokploy, GitHub `main` dalından otomatik)
- GitHub `origin/main` = `850e3c7`. **Şu commit'ler yalnızca yerelde, gönderilmedi:**
  `a47a6d3` genel kurul DB · `c89e2ad` giriş sistemi · `d5d9240` daireler/sakinler · `e89b10c` davet · `8eeca88` aidat (+ bu notların commit'i)
- Gönderilmeden önce kullanıcının Dokploy'da yapması gerekenler (henüz “hazır” demedi):
  - PostgreSQL servisi oluşturup uygulamaya `DATABASE_URL` eklemek
  - `SESSION_SECRET` (en az 32 karakter rastgele): `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - İsteğe bağlı: `SMTP_USER`, `SMTP_PASS` (şifre sıfırlama/davet e-postaları), `APP_URL` (site adresi), `FEEDBACK_TO`
- Uygulama açılışta `scripts/migrate.mjs` ile `prisma migrate deploy` çalıştırır (DATABASE_URL yoksa atlar).
- Canlıda demo seed çalışmaz (`ALLOW_DEMO_SEED=1` olmadan). İlk hesap canlıdaki `/kayit` sayfasından açılır.
- Push öncesi kullanıcıdan onay alınmalı (her push canlıya çıkar). `CANLIYA-GONDER.bat` = `git push origin main`.
- ⚠️ Kullanıcıya hatırlatılacak: Eski kodda gömülü Gmail uygulama şifresi GitHub geçmişinde duruyor; Google hesabından iptal etmesi istendi (yapıldı mı teyit edilmedi).

## Yerel geliştirme

```bash
npm run db          # yerel PostgreSQL (localhost:54329, veriler ./.pgdata) — açık kalmalı
npx prisma migrate deploy
npm run db:seed     # demo site, 20 daire, kişiler, son 3 ayın aidatları
npm run dev         # http://localhost:3000
npm run test:e2e    # 100 uçtan uca test (dev sunucusu açıkken); sonunda temizlik + seed
```

- `.env` (git'e girmez): `DATABASE_URL="postgresql://postgres:devpass@localhost:54329/siteyonet?schema=public"`
- Demo hesapların e-posta ve şifreleri `prisma/seed.mjs` içinde (yönetici, muhasebe, personel, sakin=A-201 maliki, admin).
- Yeni şema değişikliğinde `prisma migrate dev` etkileşimli olduğu için şu yol kullanıldı:
  `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<tarih>_<ad>/migration.sql` sonra `npx prisma migrate deploy`.
  `prisma format` çalıştırmayın (tüm şemayı yeniden hizalayıp gereksiz büyük fark üretiyor).
- Windows'ta Prisma istemcisi yenilenirken dev sunucusu DLL'i kilitler → önce sunucuyu durdurun.
- Next.js 16: `middleware` yerine `src/proxy.ts`; route handler `params` bir Promise; `route.ts` yalnızca HTTP işleyicileri dışa aktarabilir.

## Mimari (yapılanlar)

- **Kimlik doğrulama:** `src/lib/auth/` — bcrypt şifre, `jose` ile imzalı HttpOnly `session` çerezi (7 gün),
  `sessionVersion` (şifre değişince eski oturumlar düşer), bellek içi deneme sınırı (5 hata/15 dk).
  `requireUser()` / `requireManager()` route handler'larda; firma her zaman oturumdan (`auth.tenantId`), istemciden asla.
  `src/proxy.ts`: panel ve API koruması, rol → panel yönlendirmesi (`roles.ts`). next-auth kullanılmadı (beta).
- **API'ler:** `/api/auth/*` (login, logout, register, me, forgot-password, reset-password), `/api/units`,
  `/api/yonetici/daireler`, `/api/yonetici/sakinler` (+ `[id]` PATCH/DELETE, `[id]/davet`),
  `/api/yonetici/aidat` (+ `[id]` iptal, `[id]/odeme`), `/api/sakin/aidat`, `/api/genel-kurul/*`, cari/banka/finans.
- **Sunucu katmanı:** `src/lib/server/` — `units.ts`, `residents.ts`, `dues.ts`, `money.ts` (Decimal, kuruş dağıtımı,
  KMK md.20 gecikme tazminatı), `mailer.ts`, `password-tokens.ts`.
- **Para:** Due/Payment tutarları `Decimal(12,2)`. Float kullanılmaz. Ortak `applyToDue` / `revertFromDue`.
- **Daire kimlikleri** örnek veriyle aynı (`unit-A101` …); `prisma/demo-data.json` örnek veriden üretildi.
- **Genel kurul:** KMK md. 30/31/42/19/28/24 kuralları; sahiplik veritabanından; sakin yalnızca kendi dairesi adına oy.
- **Kaldırılanlar (bilinçli):** sakin aidat sayfasındaki sahte kart ödeme formu (ödeme altyapısı yok), giriş
  ekranındaki sahte rol tespiti, gömülü SMTP şifresi, tanıtımdaki gerçek olmayan iddialar yok (SiteYönet tarafında).

## Hâlâ tarayıcı depolaması / örnek veri kullananlar (sıradaki işler)

Tarayıcı (localStorage): yönetici → kasa-banka, gelir-gider, raporlar, banka-sync, cari, cari/faturalar,
satinalma/alis-faturalari, duyurular, anketler, arizalar, sayaclar, sms, ayarlar · sakin → dashboard, ariza,
duyurular, ziyaretci · personel → dashboard, gorevler, ziyaretci · super-admin → finans, tenantlar ·
`lib/services/advanced-finance-service.ts`, `site-hesabim-service.ts`.

Örnek veri (`@/lib/mock-data`): yönetici dashboard, daireler (yalnızca finans özeti/iletişim), gider, sayaclar, sms,
duyurular, arizalar; pano bileşenleri (Announcements, FinancialSummary, Occupancy, RecentInvoices, TaskList);
`Header.tsx` (arama); personel/gorevler, sakin/duyurular.

Diğer eksikler: sitenin IBAN/banka hesabı tabloda yok; online ödeme yok; eski `/api/yonetici/dues/bulk` kullanılmıyor
(yetkili ama gereksiz); `.claude/launch.json` git'e eklenmedi (yerel önizleme ayarı).

## Kullanıcı tercihleri

- Türkçe konuşur; teknik olmayan, net Türkçe açıklama ister.
- “Premium” ve rakiplerden farklı bir ürün istiyor (genel kurul, şeffaflık, WhatsApp/yapay zekâ, deprem modülü fikirleri konuşuldu).
- Canlıya gönderme (push) her seferinde onayla yapılır.
