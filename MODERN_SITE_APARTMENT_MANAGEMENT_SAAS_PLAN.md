# Modern Site ve Apartman Yönetim SaaS Platformu - Teknik Mimari Planı

## 1. Teknoloji Yığını (Tech Stack) Önerisi

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI Bileşen Kitaplığı:** Shadcn/ui
- **Zengin Metin/Blok Editörü:** @tiptap/react (Tiptap Editor)
- **State Yönetimi:** Zustand
- **Form Yönetimi:** React Hook Form
- **Veri Çekme ve Sunucu Durumu:** TanStack Query (React Query)
- **Grafik ve Görselleştirme:** Recharts veya Victory
- **İkonlar:** Lucide React
- **Tip Kontrolü:** TypeScript

### Backend
- **Framework:** NestJS (v10+)
- **ORM:** Prisma
- **Kimlik Doğrulama ve Yetkilendirme:** Passport.js (NestJS uyumlu paketleri) + özel RBAC modülü (Casbin/ACL)
- **Validasyon:** class-validator ve class-transformer
- **Loglama:** Winston veya Pino entegrasyonlu NestJS logger
- **API Belgelenmesi:** Swagger/OpenAPI (NestJS Swagger modülü)

### Veritabanı ve Altyapı
- **Veritabanı:** PostgreSQL (v15+)
- **Önbellekleme:** Redis
- **Mesaj Brokeri:** RabbitMQ
- **Dosya Depolama:** AWS S3
- **Arama:** PostgreSQL full-text search (başlangıç), Elasticsearch (gelecek)
- **CI/CD ve Dağıtım:** Docker ve Kubernetes (EKS/GKE/AKS)
- **Monitoring ve Logging:** Prometheus + Grafana, ELK Stack veya Loki, Sentry

### Diğer Araçlar
- **Ödeme Entegrasyonu:** Stripe ve İyzico SDK'ları
- **E-posta ve SMS:** SendGrid/Mailgun/Postmark (e-posta), Twilio/Vonage (SMS)
- **WebSocket:** NestJS WebSocket gateway'i (Socket.io entegrasyonu)
- **Test:** Jest (birim/entegrasyon), Playwright/Cypress (e2e)

## 2. Yüksek Seviyeli Mimari Şema (High-Level Architecture)

Sistem, mikro servis mimarisi ve olay tabanlı iletişim kullanılarak kurulmuştur:

```
+------------------+       +------------------+       +------------------+
|   Frontend       |       |   API Gateway    |       |   Servis Ağı     |
| (Next.js App)    |<----->| (NestJS Gateway) |<----->|                  |
| - UI/UX          |       | - Rate Limiting  |       | +----------------+ |
| - Optimistic UI  |       | - Auth (JWT)     |       | | Auth Service   | |
| - WebSocket      |       | - Request Routing|       | +----------------+ |
| - TanStack Query |       | - SSL Termination|       | | (JWT, Roles)   | |
+------------------+       +------------------+       | +----------------+ |
                                                      | | Financial Svc  | |
+------------------+       +------------------+       | +----------------+ |
|   3rd Party      |       |   Worker Servisleri|       | | (Double-entry, |
| (Stripe, İyzico) |<----->|   (NestJS Workers) |<----->| |  Invoices)     |
| - Webhooks       |       | - Borçlandırma Job |       | +----------------+ |
| - Ödeme Gateways |       | - Bildirim Gönderici|       | +----------------+ |
+------------------+       | - Ödeme İşleyici  |       | | Notification   | |
                           | - Dosya İşleyici  |       | | Service        | |
                           +------------------+       | +----------------+ |
                                                      | | Task Svc       | |
+------------------+       +------------------+       | | (Kanban Board) | |
|   Veritabanı     |       |   Önbellek &     |       | +----------------+ |
| (PostgreSQL)     |<----->|   Arama          |<----->| +----------------+ |
| - Tenant Verileri|       | (Redis)          |       | | File Svc       | |
| - JSONB Bloklar  |       | - Oturum         |       | | (S3 Entegrasyon)|
| - Finansal Tablolar|     | - Önbellek       |       | +----------------+ |
+------------------+       | - Pub/Sub        |       | +----------------+ |
                           | - Geçici Veri    |       | | Gateway Svc    | |
                           +------------------+       | (WebSocket)      |
                                                      +------------------+
                                                      | +----------------+ |
                                                      | | Search Svc     | |
                                                      | | (Optional ES)  | |
                                                      +------------------+
                                                      | +----------------+ |
                                                      | | Cron Svc       | |
                                                      | | (Job Scheduler)| |
                                                      +------------------+
```

### Servis Açıklamaları ve İletişim
- **API Gateway (NestJS):** Tek giriş noktası, kimlik doğrulama, rate limiting, yönlendirme.
- **Kimlik Doğrulama Servisi:** Kullanıcı kaydı, giriş, rol ve izin yönetimi (RBAC).
- **Finansal Servis:** Aidat borçlandırma, fatura oluşturma, ödeme işlemleri, muhasebe kayıtları (double-entry).
- **Bildirim Servisi:** Gerçek zamanlı (WebSocket) ve e-posta/SMS bildirimleri.
- **Görev (Task) Servisi:** Arıza, temizlik, güvenlik takibi (Kanban board).
- **Dosya Servisi:** AWS S3 entegrasyonu ile belge ve medya yönetimi.
- **Gateway Servisi (WebSocket):** NestJS WebSocket modülü, tenant/workspace bazlı odalar.
- **Worker Servisleri:** Uzun süren arka plan işleri (borçlandırma, ödeme işleme, bildirim gönderimi, dosya işleme).
- **Veritabanı (PostgreSQL):** Merkezi veri deposu, multi-tenancy ile tenant_id izolasyonu.
- **Önbellek (Redis):** Oturum yönetimi, sık erişilen veriler, Pub/Sub.
- **Arama Servisi (Opsiyonel):** Gelişmiş arama için Elasticsearch entegrasyonu.

### İletişim Protokolleri
- **Senkron İstek-Yanıt:** REST over HTTPS (JSON formatında).
- **Asenkron Olay Tabanlı:** RabbitMQ (olay yayınlama ve tüketimi).
- **Gerçek Zamanlı:** WebSocket (Socket.io veya raw ws) ile frontend ve backend arasında.

## 3. Veritabanı Modelleme Stratejisi

### Multi-Tenancy Yaklaşımı
Tek bir veritabanı şeması içinde **Tenant ID** ile izolasyon. Nedenleri:
- Operasyonel basitlik (yedekleme, şema güncellemeleri, monitoring)
- Maliyet etkinliği (tek veritabanı örneği)
- Performans (PostgreSQL'de iyi dizinlenmiş tenant_id, gerektiğinde partitioning)
- Güvenlik (Row Level Security - RLS politikaları)

### Temel Tablolar ve İlişkileri
Her tabloya `tenant_id` eklenerek multi-tenancy sağlanmıştır.

#### Temel Tablolar
- **tenants:** site/apartman bilgileri
- **users:** kullanıcı bilgileri (rol: super_admin, site_manager, block_rep, owner, tenant, accountant)
- **units:** daireler/bağımsız bölümler (numara, blok, kat, metrekare, arsa payı)
- **financial_accounts:** muhasebe hesapları (varlık, borç, sermaye, gelir, gider)
- **transactions:** muhasebe işlemleri (double-entry: debit_account_id, credit_account_id, amount)
- **invoices:** faturalar/aidat borçları (dönem, tutar, durum, ödenen tutar)
- **invoice_items:** fatura kalemleri (açıklama, tutar, tip: charge/credit/adjustment)
- **meter_readings:** sayaç okumaları (su, sıcak su, ısı, elektrik)
- **payments:** ödeme kayıtları (yöntem, transaction_id, tutar, durum)
- **notifications:** bildirim geçmişi (tip, başlık, içerik, okundu durumu)
- **workspace_widgets:** kullanıcı paneli widget konfigürasyonları (tip, konum, yapılandırma)
- **documents:** zengin metin/blok tabanlı içerik (site kuralları, duyurular - Tiptap JSON)
- **tasks:** iş takibi/ticket sistemi (başlık, açıklama, durum, öncelik, sorumlu)

#### Finansal Tablolar İçin Önemli Notlar
- **Double-Entry Muhasebe:** Her finansal hareket iki farklı hesap arasında debit ve credit kaydı oluşturur.
- **İmmütabilite:** Muhasebe kayıtları değiştirilmemelidir; hata düzeltmesi için yeni düzeltme kaydı girilir.
- **Para Birimi ve Hassasiyet:** DECIMAL(15, 2) kullanılır, floating point kullanılmaz.
- **Tarih ve Saat Zoneları:** UTC olarak saklanır, gösterilirken tenant zaman dilinine göre dönüştürülür.

## 4. Notion Esnekliğini Sağlayacak Frontend Mimarisi

### Blok Tabanlı Editör (Tiptap)
- **Tiptap Core:** `@tiptap/core` ve özel uzantılar kullanılarak özel bloklar (node'lar) oluşturulur.
- **Özel Bloklar (Custom Nodes):**
  - `financialSummary`: Güncel aidat durumu, ödenen/ödenecek tutar, gider özeti.
  - `taskBoard`: Kanban board (sürükle-bırak) gösterir (react-beautiful-dnd veya @dnd-kit/core ile).
  - `pollWidget`: Basit anket oluşturma ve oy verme.
  - `embedWidget`: Harici videolar (YouTube, Vimeo) veya iframe embedi.
  - `chartWidget`: Recharts/Victory ile aidat tahsilatı trendi, gider dağılımı grafikleri.
  - `fileList`: Belge yükleme ve görüntüleme alanı.
- **Tiptap İçeriği Saklama:** Editör içeriği ProseMirror JSON formatında (`editor.getJSON()`) PostgreSQL'deki JSONB sütunlarında saklanır.
- **Kolaboratif Düzenleme (Gelecek):** Yjs veya ShareDB gibi CRDT kütüphaneleri ile gerçek zamanlı çoklu kullanıcı düzenleme.

### Sürükle-Bırak Paneller ve Widget Sistemi (Zustand + React DnD)
- **Widget State Management (Zustand):** Kullanıcının çalışma alanı durumu (widget tipi, konumu, boyutu, yapılandırması).
  ```javascript
  import { create } from 'zustand';
  
  interface Widget {
    id: string;
    type: 'financial_summary' | 'task_list' | 'announcements' | 'meter_chart';
    config: Record<string, any>;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }
  
  interface DashboardState {
    widgets: Widget[];
    addWidget: (widget: Omit<Widget, 'id'>) => void;
    updateWidget: (id: string, updates: Partial<Widget>) => void;
    removeWidget: (id: string) => void;
    setWidgets: (widgets: Widget[]) => void;
  }
  
  export const useDashboardStore = create<DashboardState>((set) => ({
    widgets: [],
    addWidget: (widget) => set((state) => ({
      widgets: [...state.widgets, { ...widget, id: crypto.randomUUID() }]
    })),
    updateWidget: (id, updates) => set((state) => ({
      widgets: state.widgets.map(w => (w.id === id ? { ...w, ...updates } : w))
    })),
    removeWidget: (id) => set((state) => ({
      widgets: state.widgets.filter(w => w.id !== id)
    })),
    setWidgets: (widgets) => set({ widgets })
  }));
  ```
- **Sürükle-Bırak:** `@dnd-kit/core` ve `@dnd-kit/sortable` ile widget kartlarının paneli içinde sürüklenip bırakılması.
- **Widget Renderleme:** Dashboard bileşeni, Zustand store'dan widget listesini alır ve her widget tipi için dinamik olarak ilgili React bileşenini render eder.
- **Sayfa Geçişleri ve Optimistic Updates:** TanStack Query (React Query) ile `useQuery` (önceden getirme ve önbellekleme) ve `useMutation` (optimistic updates) kullanılır.
  - UI anında güncellenir (Zustand store üzerinden), arka planda API çağrısı yapılır.
  - API çağrısı başarısız olursa, UI önceki duruma geri döndürülür (rollback).

### State Yönetimi Seçimi: Zustand Neden?
- Hafif ve basit (Redux Toolkit'e göre az boilerplate).
- Performans (sadece abone olan bileşenlerin yeniden render edilmesi).
- Kolay öğrenilebilirlik.
- Redux Toolkit alternativi: Durum yönetimi çok karmaşıklaşırsa veya zaman seyahati hata ayıklama gerekiyorsa geçiş yapılabilir.

### Diğer Frontend Mimarisi Kararları
- Modüler bileşenler (UI ve iş mantığı bileşenleri ayrı klasörler).
- Tip güvenliği (TypeScript ile tüm props, state ve API yanıtları tiplendirilir).
- Hata sınırları (React Error Boundaries).
- Yükleme durumları ve placeholderlar (react-query ve skeleton UI).
- Erişilebilirlik (a11y) (Shadcn/ui'nin Radix UI temeli).
- Performans optimizasyonu (React.memo, useCallback, useMemo, windowing teknikleri için büyük listeler).

## 5. Otomatik Borçlandırma için Cron-Job / Worker Tasarımı

Binlerce daireye aidat borçlandırma işlemi için güvenilir ve ölçeklenebilir bir mimari önerilir.

### Önerilen Mimari: Mesaj Tabanlı İş Akışı + Worker Pool

#### 1. Tetikleyici (Trigger)
- Bir **Cron Servisi** (NestJS `@nestjs/schedule` veya harici cron job) ayın ilk günü saat 00:00'da çalıştırılır.
- Borçlandırma işlemi başlatmak için RabbitMQ'daki `billing.init` exchange'ına mesaj yayınlar:
  ```json
  {
    "tenantId": "uuid-tenant-1",
    "billingPeriod": "2026-06",
    "triggeredBy": "cron",
    "timestamp": "2026-06-01T00:00:00Z"
  }
  ```

#### 2. Mesaj Brokeri (RabbitMQ)
- `billing.init` exchange'ından gelen mesaj, `billing.process` kuyruğuna yönlendirilir.
- Bu kuyruk, birden fazla worker örneği tarafından tüketilecek şekilde yapılandırılır (concurrent consumers).

#### 3. İşçi (Worker) - Borçlandırma İşçisi
- Birden fazla NestJS Worker örneği `billing.process` kuyruğunu dinler.
- Bir worker bir mesaj aldığında:
  a. **Tenant Kilitleme:** Aynı tenant için çakışan işlemleri önlemek için `billing_locks` tablosu veya `SELECT FOR UPDATE` kullanılır.
  b. **Veri Toplama:** Tenant'ın tüm aktif dairelerini ve ilgili bilgilerini çeker.
  c. **Borç Hesaplama:** Her daire için `baseAmount = (unit.area_sqm * areaRate) + (unit.ownership_share * shareRate) + fixedFee`.
  d. **Fatura Oluşturma:** `invoices` tablosuna draft durumuyle kayıt oluşturur.
  e. **Kalem Oluşturma:** `invoice_items` tablosuna aidat kalemi eklenir.
  f. **Gecikme Faizi Hesaplaması (Opsiyonel):** Günlük worker ile gecikmiş faturalara faizi uygulanır (ana işlemi basitleştirir).
  g. **İşaretleme ve Onay:** Oluşturulan fatura durumu `draft` olarak kalır ve onay bekler (alternatif: doğrudan `sent` durumuna geçebilir).
  h. **Kilit Serbest bırakma:** Tenant kilidi serbest bırakılır.
  i. **Tamamlama Bildirimi:** `billing.completed` eventi RabbitMQ'ya yayınlanır (bildirim servisi tarafından dinlenir).

#### 4. Güvenilirliği ve Hata Toleransını Sağlama
- **İşlem İçi Sıfırlama (Idempotency):** Aynı mesajın iki kez işlenmesi durumunda aynı sonutu üretmek için:
  - `invoices` tablosunda `(tenant_id, billing_period, unit_id)` için benzersiz kısıtlama.
  - İşlem öncesi bu kombinasyonun var olup olmadığının kontrolü.
- **Zaman Aşımı ve Yeniden Deneme:** Worker işlemi çok uzun sürerse RabbitMQ zaman aşımı veya worker içi zamanlayıcı kullanılır.
- **Dead Letter Queue (DLQ):** 3 kez başarısız olan mesajlar ayrı bir kuyruğa taşınır (manuel inceleme için).
- **Gözlem ve Uyarı:** Worker metrikleri (işlem süreci, başarı/başarısızlık oranları, daire sayısı) Prometheus'a çıkarılır. Grafik panolar ve uyarı kuralları kurulur.

#### 5. Ödeme Entegrasyonu ve Makbuz Oluşturma
- Bir fatura ödendiğinde (Stripe/İyzico webhook'u), `payments` tablosu güncellenir ve ilgili fatura'nın `paid_amount` ve `status` güncellenir.
- Başarılı ödeme sonucunda `payment.completed` eventi yayınlanır.
- Bu eventi dinleyen **Makbuz Oluşturma Worker'ı** çalışır:
  - Ödeme ve ilgili fatura bilgilerini toplar.
  - Şablon tabanlı PDF makbuzu oluşturur (`pdfkit` veya `handlebars` + `wkhtmltopdf`).
  - Oluşturulan PDF'yi AWS S3'e yükler.
  - Makbuz URL'sini fatura veya ödeme kaydına ekler (veya ayrı `receipts` tablosunda saklar).
  - Makbuz hazırlandı eventi yayınlanır ve bildirim servisi üzerinden kullanıcıya e-posta/SMS ile gönderilir.

### Alternatif ve Ek Notlar
- **Veri Bölümleme (Sharding):** Tenant sayısı çok yüksek binlerceye çıkarsa, tenant ID'ye göre horizontal sharding uygulanabilir.
- **İş Akışı Motoru (Workflow Engine):** Karmaşık borçlandırma kuralları için Camunda veya Temporal kullanılabilir.
- **Gecikme Faizi Yönetimi:** Gecikme faizinin fatura oluşturma aşamasında hesaplanması yerine, günlük worker tarafından gecikmiş faturalara faizi uygulanması daha modüler bir yaklaşımdır.

## Sonuç ve Öneriler

Bu teknik plan, Notion benzeri bir frontend deneyimi ve kurumsal finansal gücünü birleştiren bir SaaS platformu için sağlam bir temel sağlar. Önerilen teknoloji yığını (Next.js, Tiptap, Zustand, NestJS, PostgreSQL, RabbitMQ) modern, ölçeklenebilir ve geliştirici dostudur. Mimari, mikro servisler ve olay tabanlı iletişim kullanarak esnekliği, fault tolerance'ı ve bakım kolaylığını maksümum seviyeye çıkarır.

### İleri Aşamalar İçin Öneriler:
1. **Proof of Concept (PoC):** Tek bir tenant için temel fatura görüntüleme, widget dashboardu ve ödeme entegrasyonu içeren minimum çalışabilir ürün (MVP) geliştirin.
2. **Güvenlik Denetimi:** Kimlik doğrulama, yetkilendirme (RBAC) ve veri koruması (GDPR/KVKK) konularında ayrıntılı bir analiz yapın.
3. **Performans Testi:** Yük testleri (Locust, k6) ile sistemin binlerce tenant ve eşzamanlı işlem altında nasıl davrandığını ölçün.
4. **CI/CD Pipeline'ı:** GitHub Actions veya GitLab CI kullanarak otomatik test, derleme ve dağıtım pipeline'ını kurun.
5. **İzleme ve Günlükleme:** Production ortamında Prometheus/Grafana ve ELK stack'i entegre edin.

Bu plan, kullanıcı taleplerinizi karşılayacak şekilde detaylandırılmıştır. Belirli bir bölüm üzerinde daha derinlemesine teknik bir tartışma yapmak isterseniz veya alternatif teknoloji seçeneklerini değerlendirmek isterseniz, lütfen belirtin.