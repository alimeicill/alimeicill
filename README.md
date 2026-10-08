# Modern Site ve Apartman Yönetim SaaS Platformu

Bu proje, Notion benzeri esnek bir frontend ve kurumsal finansal gücü birleştiren bir SaaS platformu için mimari ve teknik spesifikasyonları içerir.

## Proje Özeti

Bu platform, site ve apartman yöneticilerinin:
- Finansal işlemleri (aidat borçlandırma, ödeme takibi, gider yönetimi)
- İş takibi (arızalar, temizlik, güvenlik talepleri)
- Dokümantasyon ve duyurular (Notion benzeri zengin metin editörü)
- Kullanıcı ve rol yönetimi
- Gerçek zamanlı bildirimler
- Multi-tenant mimarisi

gibi işlemleri tek bir platformdan yönetmesini sağlar.

## Hızlı başlangıç (MVP — çalışan sürüm)

Gereksinim: Node.js 20+. Docker gerekmez (gömülü PostgreSQL kullanılır).

Üç ayrı terminalde:

```bash
# 1) Veritabanı (localhost:5433) — açık kalmalı
cd backend
npm install
npm run db
```

```bash
# 2) API (localhost:4000) — ilk seferde tabloları ve demo veriyi kurar
cd backend
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

```bash
# 3) Arayüz (localhost:3100)
cd frontend
npm install
npm run dev
```

Tarayıcıda http://localhost:3100 adresini açın.

| Rol | Giriş | Şifre |
| --- | --- | --- |
| Yönetici | yonetici@demo.com | Demo12345 |
| Sakin | 0532 111 22 33 | sakin123 |

Docker kullanmak isterseniz `npm run db` yerine kök dizinde `docker compose up -d` çalıştırın (aynı port ve kullanıcı bilgileri).

### MVP'de neler var

- **Yönetici paneli:** kurulum sihirbazı (site → blok → daire), kişiler (malik/kiracı/borçlu), daire tipleri (aidat katsayısı), gelir/gider/borçlandırma kalemleri, cari hesaplar, kasa/banka hesapları ve ekstreleri, gelir–gider–virman kayıtları, tedarikçi faturaları ve ödemeleri, toplu aidat (önizlemeli, idempotent, 5 dağıtım yöntemi), tekil/blok/ortak borç ve taksitlendirme, tahsilat (FIFO mahsup, avans), borçlandırma iptali, borçlu takip (KMK md.20 gecikme tazminatı), raporlar, duyurular, talep/arıza, KVKK onayları, koyu tema, "Benim menüm" favorileri.
- **Sakin paneli:** toplam borç ve duyurular, yıl filtreli borç/ödenen ekstresi, talep/arıza açma, bildirim tercihleri ve şifre değiştirme.

### Plan ile farklar (bilinçli sadeleştirmeler)

Mimari dokümandaki mikroservis + RabbitMQ + Redis + Kubernetes yapısı yerine **modüler tek NestJS servisi** kullanıldı; borçlandırma veritabanı işlemi (transaction) içinde ve idempotent çalışır. Online ödeme (iyzico/PayTR), e-posta/SMS gönderimi, Tiptap blok editörü ve sürükle-bırak widget panosu sonraki aşamalara bırakıldı.

## Teknoloji Yığını

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI Kitaplığı:** Shadcn/ui (Tailwind CSS tabanlı)
- **Zengin Metin/Blok Editörü:** @tiptap/react
- **State Yönetimi:** Zustand
- **Veri Çekme:** TanStack Query (React Query)
- **Form Yönetimi:** React Hook Form
- **Tip Kontrolü:** TypeScript

### Backend
- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma
- **Veritabanı:** PostgreSQL
- **Kimlik Doğrulama:** JWT + Rol/İzin Yönetimi (RBAC)
- **Asenkron İşlemler:** RabbitMQ
- **Gerçek Zamanlı:** WebSocket (NestJS Gateway)
- **Önbellekleme:** Redis
- **Dosya Depolama:** AWS S3 (veya benzeri)
- **Ödeme Entegrasyonu:** Stripe ve İyzico

### Altyapı
- **Containerizasyon:** Docker
- **Orkestrasyon:** Kubernetes (EKS/GKE/AKS) veya Docker Compose (geliştirme)
- **CI/CD:** GitHub Actions / GitLab CI
- **İzleme:** Prometheus + Grafana, ELK Stack, Sentry
- **Arama:** PostgreSQL Full-text Search (Elasticsearch opsiyonel)

## Mimari Genel Bakış

Sistem, mikro servis mimarisi kullanılarak aşağıdaki bileşenlerden oluşur:

1. **Frontend** (Next.js App) - Kullanıcı arayüzü
2. **API Gateway** (NestJS) - Kimlik doğrulama, rate limiting, yönlendirme
3. **Servis Ağı:**
   - Auth Service - Kullanıcı kimlik doğrulama ve yetkilendirme
   - Financial Service - Aidat borçlandırma, fatura, ödeme, muhasebe
   - Notification Service - Gerçek zamanlı ve e-posta/SMS bildirimleri
   - Task Service - İş takibi ve Kanban board
   - File Service - Belge ve medya dosyaları yönetimi
   - Gateway Service - WebSocket bağlantıları
   - Cron Service - Zamanlanmış işler (borçlandırma vb.)
4. **Veritabanı** (PostgreSQL) - Merkezi veri deposu
5. **Önbellek** (Redis) - Oturum ve sık erişilen veriler
6. **Mesaj Brokeri** (RabbitMQ) - Asenkron iletişim
7. **3rd Party Entegrasyonları** - Stripe, İyzico, email/SMS sağlayıcıları

## Veritabanı Modellemesi

Multi-tenancy için tek veritabanı + tenant_id yaklaşımı kullanılmıştır. Her tablo tenant_id sütunu içerir ve bu sütun üzerinde indeks oluşturulmuştur.

### Temel Tablolar
- `tenants` - Site/apartman bilgileri
- `users` - Kullanıcılar ve roller
- `units` - Daireler/bağımsız bölümler
- `financial_accounts` - Muhasebe hesapları (double-entry)
- `transactions` - Muhasebe işlemleri
- `invoices` - Faturalar/aidat borçları
- `invoice_items` - Fatura kalemleri
- `meter_readings` - Sayaç okumaları
- `payments` - Ödeme kayıtları
- `notifications` - Bildirim geçmişi
- `workspace_widgets` - Kullanıcı paneli widget konfigürasyonları
- `documents` - Zengin metin/blok tabanlı içerik
- `tasks` - İş takibi/ticket sistemi

## Frontend Mimarisi

### Blok Tabanlı Editör (Tiptap)
- Özel bloklar: financialSummary, taskBoard, pollWidget, embedWidget, chartWidget, fileList
- İçerik ProseMirror JSON formatında JSONB sütunlarında saklanır

### Sürükle-Bırak Paneller
- Widget durumu Zustand ile yönetilir
- @dnd-kit kullanılarak widget'lar sürüklenip bırakılabilir
- Dashboard, widget listesini alarak dinamik bileşenler render eder

### State Yönetimi ve Optimistic Updates
- Zustand: Widget konumları, kullanıcı ayarları için
- TanStack Query: Veri çekme, önbellekleme, optimistic updates için
- UI anında güncellenir, arka planda API çağrısı yapılır, hata durumunda geri alınır

## Otomatik Borçlandırma Tasarımı

### İş Akışı
1. **Cron Servisi** ayın ilk gününde `billing.init` eventi yayınlar
2. **RabbitMQ** bu eventi `billing.process` kuyruğuna yönlendirir
3. **Birden fazla Worker** kuyruğu tüketir, paralel işleme sağlar
4. Her worker:
   - Tenant kilitlemesi yapar (çakışmayı önler)
   - Aktif daireleri toplar
   - Aidat tutarını hesaplar (metrekare, arsa payı, sabit ücret)
   - Fatura kalemi oluşturur
   - İşaretler ve kilidi serbest bırakır
5. **Idempotency** ve **Dead Letter Queue** ile güvenilirliği sağlanır

### Ödeme ve Makbuz
- Stripe/İyzico webhook'ları ödeme durumunu günceller
- Ödeme tamamlandığında makbuz oluşturulur
- Makbuz PDF olarak S3'e yüklenir ve kullanıcıya gönderilir

## Kurulum ve Geliştirme Kılavuzu

### Gereksinimler
- Node.js 18+
- PostgreSQL 15+
- Redis
- RabbitMQ
- Docker ve Docker Compose (opsiyonel)
- AWS hesabı (S3 için) veya yerel dosya sistemi (geliştirme için)

### Geliştirme Ortamı Kurulumu

1. **Depoyu klonlayın**
```bash
git clone <repo-url>
cd modern-apartment-management
```

2. **Backend kurulumu (NestJS)**
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin (veritabanı, Redis, RabbitMQ bilgileri)
npx prisma migrate dev
npm run start:dev
```

3. **Frontend kurulumu (Next.js)**
```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenleyin (API endpoint bilgileri)
npm run dev
```

4. **Altyapı servisleri (Docker Compose ile)**
```bash
docker-compose up -d
```

### Üretim Ortamı Dağıtımı

1. **Container görüntüleri oluşturun**
```bash
# Backend
cd backend
docker build -t apartment-management-backend .

# Frontend
cd frontend
docker build -t apartment-management-frontend .
```

2. **Kubernetes manifestlerini uygulayın**
```bash
kubectl apply -f k8s/
```

3. **Environment değişkenlerini ConfigMap ve Secret olarak yapılandırın**

## API Dokümantasyonu

API dokümantasyonu Swagger/OpenAPI kullanılarak otomatik olarak oluşturulur:
- Backend çalıştırıldığında: `http://localhost:3000/api`
- Frontend proxy üzerinden: `http://localhost:3000/api`

## Test Stratejisi

- **Birim Testleri:** Jest (backend ve frontend)
- **Entegrasyon Testleri:** Supertest (backend), React Testing Library (frontend)
- **E2E Testleri:** Playwright veya Cypress
- **Yük Testleri:** k6 veya Locust

## Güvenlik Önlemleri

- JWT tabanlı kimlik doğrulama
- Rol ve izin tabanlı erişim kontrolü (RBAC)
- Hassas verilerin şifrelenmesi (veritabanında ve iletim sırasında)
- CORS politikaları
- Rate limiting ve DDoS koruması
- SQL injection ve XSS önleme
- Günlük denetimi ve izleme

## Gelecek Geliştirme Planları

1. **Gerçek Zamanlı İşbirliği:** Yjs veya ShareDB ile çoklu kullanıcı düzenleme
2. **Gelişmiş Raporlama:** Grafik ve özel raporlar
3. **AI Entegrasyonu:** Tahmini bakım, anomali tespiti
4. **Mobil Uygulamalar:** React Native ile iOS ve Android
5. **IoT Entegrasyonu:** NFC kapı kontrolü, sensör verileri
6. **Marketplace:** Üçüncü taraf hizmet entegrasyonları

## Lisans

Bu proje özel lisanslıdır.

## İletişim

Soru ve önerileriniz için: [iletisim@ornek.com]