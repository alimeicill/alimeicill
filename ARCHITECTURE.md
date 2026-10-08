# Modern Site ve Apartman Yönetim SaaS Platformu - Teknik Mimari ve Teknoloji Yığını

## 1. Teknoloji Yığını (Tech Stack) Önerisi

### Frontend
- **Framework:** Next.js 14+ (App Router) - SSR, SSG, route grupları ve sunucu bileşenleri ile SEO ve dinamik içerik için idealdir.
- **UI Bileşen Kitaplığı:** Shadcn/ui - Radix UI üzerine kurulu, erişilebilir ve özelleştirilebilir bileşenler, Tailwind CSS entegrasyonu.
- **Zengin Metin/Blok Editörü:** @tiptap/react - ProseMirror tabanlı, genişletilebilir ve Notion benzeri blok tabanlı deneyim.
- **State Yönetimi:** Zustand - Hafif, merkezi olmayan ve performanslı state yönetimi (widget konumları, kullanıcı ayarları).
- **Veri Çekme ve Sunucu Durumu:** TanStack Query (React Query) - Önbellekleme, arka plan güncellemesi ve optimistic updates için kritik.
- **Form Yönetimi:** React Hook Form - Performanslı ve esnek form doğrulama.
- **Grafik ve Görselleştirme:** Recharts veya Victory - Finansal özetler ve raporlar.
- **İkonlar:** Lucide React - Minimal ve tutarlı ikon seti.
- **Tip Kontrolü:** TypeScript - Proje genelinde zorunlu.

### Backend
- **Framework:** NestJS (v10+) - TypeScript'te yazılmış, modüler mimari, Dependency Injection (DI) ve güçlü CLI. Mikroservis desteği, WebSocket gateway'i ve gRPC desteği.
- **ORM:** Prisma - TypeScript'te tip güvenli veri erişimi, otomatik veri taşıma ve PostgreSQL entegrasyonu.
- **Kimlik Doğrulama ve Yetkilendirme:** Passport.js (NestJS uyumlu paketleri) ve özel RBAC modülü (Casbin veya ACL).
- **Validasyon:** class-validator ve class-transformer - DTO'lar üzerinde deklaratif validasyon.
- **Loglama:** Winston veya Pino ile entegrasyon.
- **API Belgelenmesi:** Swagger/OpenAPI (NestJS Swagger modülü ile otomatik üretilir).

### Veritabanı ve Altyapı
- **Veritabanı:** PostgreSQL (v15+) - ACID uyumu, JSONB desteği (dinamik blok verileri), güçlü indeksleme ve partitioned tablo desteği.
- **Önbellekleme:** Redis - Oturum yönetimi, hızlı veri önbelleği ve mesaj brokeri (Pub/Sub).
- **Mesaj Brokeri:** RabbitMQ - Asenkron işlemler (borçlandırma, bildirim gönderimi, ödeme webhook'ları) için güvenilir kuyruk sistemi.
- **Dosya Depolama:** AWS S3 - Belgeler, makbuzlar, profil fotoğrafları gibi statik varlıklar.
- **Arama:** PostgreSQL'in full-text search (başlangıç için), gerektiğinde Elasticsearch.
- **CI/CD ve Dağıtım:** Docker ve Kubernetes (EKS/GKE/AKS) veya Vercel (Frontend) / Render.com veya Fly.io (Backend) için basit başlangıç.
- **Monitoring ve Logging:** Prometheus + Grafana (metrikler), ELK Stack veya Loki (loglar), Sentry (hata takibi).

### Diğer Araçlar
- **Ödeme Entegrasyonu:** Stripe ve İyzico için resmi SDK'lar, webhook'lar üzerinden olay dinleme.
- **E-posta ve SMS:** SendGrid/Mailgun/Postmark (e-posta), Twilio/Vonage (SMS).
- **WebSocket:** NestJS'in yerleşik WebSocket gateway'i (Socket.io entegrasyonu ile) veya özel WebSocket sunucusu.
- **Test:** Jest (birim ve entegrasyon testleri), Playwright veya Cypress (e2e testleri).

## 2. Yüksek Seviyeli Mimari Şema (High-Level Architecture)

Sistem, ayrı sorumluluklara sahip bağımsız servislerden oluşacak ve olay tabanlı iletişim kullanarak esnekliğini ve fault tolerance'ını artıracaktır.

### Servisler ve İletişim
- **API Gateway (NestJS):** Tek giriş noktası, kimlik doğrulama (JWT), rate limiting, yönlendirme ve SSL sonlandırması.
- **Kimlik Doğrulama Servisi:** Kullanıcı kaydı, giriş, rol ve izin yönetimi (RBAC), JWT token yönetimi.
- **Finansal Servis:** Aidat borçlandırma, fatura oluşturma, ödeme işlemleri, gider dağıtımı, double-entry muhasebe.
- **Bildirim Servisi:** Gerçek zamanlı (WebSocket) ve e-posta/SMS bildirimleri, RabbitMQ üzerinden olay dinleme.
- **Görev (Task) Servisi:** Arıza, temizlik, güvenlik iş takibi, Kanban board mantığı.
- **Dosya Servisi:** AWS S3 entegrasyonu, veritabanında sadece dosya referansları.
- **Gateway Servisi (WebSocket):** NestJS WebSocket modülü, tenant/workspace bazlı odalar, gerçek zamanlı işbirliği.
- **Worker Servisleri:** Uzun süren arka plan işleri (borçlandırma, ödeme işleme, bildirim gönderimi, dosya işleme).
- **Veritabanı (PostgreSQL):** Merkezi veri deposu, multi-tenancy için tenant_id ile izolasyon, JSONB sütunları.
- **Önbellek (Redis):** Oturum depolama, sık erişilen veriler, mesaj brokeri (Pub/Sub).
- **Arama Servisi (Opsiyonel):** Elasticsearch için gelişmiş arama ve filtreleme.

### İletişim Protokolleri
- **Senkron İstek-Yanıt:** REST over HTTPS (JSON formatı).
- **Asenkron Olay Tabanlı:** RabbitMQ (olay yayınlama ve dinleme).
- **Gerçek Zamanlı:** WebSocket (Socket.io veya raw ws), tenant/workspace bazlı odalar.

## 3. Veritabanı Modelleme Stratejisi

### Multi-Tenancy Yaklaşımı
Tek bir veritabanı şeması içinde **Tenant ID** ile izolasyon tercih edilecektir. Nedenleri:
- Operasyonel basitlik (yedekleme, şema güncellemeleri, monitoring).
- Maliyet optimizasyonu (tek veritabanı örneği).
- Performans (iyi dizinlenmiş tenant_id sütunu, gerektiğinde tablo bölümü).
- Güvenlik (Row Level Security - RLS politikalarıyla tenant_id bazında veri erişimi zorunlu kılınabilir).

### Temel Tablolar ve İlişkileri
Her tabloya `tenant_id` eklenerek multi-tenancy sağlanacak ve bu sütun üzerinde indeks oluşturulacaktır.

- **tenants:** site/apartman bilgileri, ayarlar (JSONB).
- **users:** kullanıcı bilgileri, rol (super_admin, site_manager, block_rep, owner, tenant, accountant).
- **units:** daire bilgileri (numara, blok, kat, metrekare, arsa payı, sahip/kiracı).
- **financial_accounts:** muhasebe hesapları (varlık, borç, sermaye, gelir, gider).
- **transactions:** double-entry muhasebe işlemleri (borç/alacak hesapları ve tutar).
- **invoices:** faturalar / aidat borçları (dönem, tutar, durum, ödenen tutar).
- **invoice_items:** fatura kalemleri (aidat, su tüketimi, gecikme faizi vb.).
- **meter_readings:** sayaç okumaları (su, sıcak su, ısı, elektrik).
- **payments:** ödeme kayıtları (yöntem, transaction ID, tutar, durum).
- **notifications:** bildirim geçmişi (tip, başlık, içerik, okundu durumu).
- **workspace_widgets:** kullanıcı paneli widget konfigürasyonları (tip, konum, yapılandırma).
- **documents:** zengin metin/blok tabanlı içerik (site kuralları, duyurular - Tiptap JSON).
- **tasks:** iş takibi / ticket sistemi (başlık, açıklama, durum, öncelik, sorumlu, tarih).

### Finansal Tablolar İçin Önemli Notlar
- **Double-Entry Muhasebe:** Her finansal hareket iki farklı hesap arasında debit ve credit kaydı oluşturularak denge denklemi korunur.
- **İmmütabilite:** Muhasebe kayıtları değiştirilmemelidir; hata düzeltmesi için yeni düzeltme kaydı girilir.
- **Para Birimi ve Hassasiyet:** DECIMAL(15, 2) kullanılır, floating point kullanılmaz.
- **Tarih ve Saat Zoneları:** Tüm tarih/saat zamanları UTC olarak saklanır, kullanıcıya gösterilirken tenant zaman dilimine göre dönüştürülür.

## 4. Notion Esnekliğini Sağlayacak Frontend Mimarisi

Frontend, kullanıcıya Notion gibi bir "çalışma alanı" deneyimi sunmak için modüler ve bileşen odaklı bir yapı adot edecektir.

### Blok Tabanlı Editör (Tiptap)
- **Tiptap Core:** `@tiptap/core` ve uzantılar kullanılarak özel bloklar (node'lar) ve işaretler (marks) oluşturulur.
- **Özel Bloklar (Custom Nodes):**
  - `financialSummary`: Güncel aidat durumu, ödenen/ödenecek tutar, gider özeti.
  - `taskBoard`: Kanban board (sürükle-bırak) gösterimi (react-beautiful-dnd veya @dnd-kit/core).
  - `pollWidget`: Basit anket oluşturma ve oy verme.
  - `embedWidget`: Harici videolar (YouTube, Vimeo) veya harici sayfalar için iframe.
  - `chartWidget`: Recharts veya Victory ile aidat tahsilatı trendi, gider dağılımı grafikleri.
  - `fileList`: Belge yükleme ve görüntüleme alanı.
- **Tiptap İçeriği Saklama:** Editör içeriği ProseMirror JSON formatında (`editor.getJSON()`) PostgreSQL'deki JSONB sütunlarında saklanır.
- **Kolaboratif Düzenleme (Gelecek):** Yjs veya ShareDB gibi CRDT kütüphaneleri ile gerçek zamanlı çoklu kullanıcı düzenleme eklenebilir.

### Sürükle-Bırak Paneller ve Widget Sistemi (Zustand + React DnD)
- **Widget State Management (Zustand):** Kullanıcının çalışma alanı durumu (widget tipi, konumu, boyutu, yapılandırması).
  - Örnek Zustand Store:
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
- **Sürükle-Bırak:** `@dnd-kit/core` ve `@dnd-kit/sortable` (veya `react-beautiful-dnd`) ile widget kartlarının paneli içinde sürüklenip bırakılması.
- **Widget Renderleme:** Dashboard bileşeni, Zustand store'dan widget listesini alır ve her widget tipi için ilgili React bileşenini render eder.
- **Sayfa Geçişleri ve Optimistic Updates:** TanStack Query (React Query) ile `useQuery` (önceden getirme ve önbellekleme) ve `useMutation` (optimistic updates) kullanılır. UI anında güncellenir, arka planda API çağrısı yapılır, başarısız olursa geri döndürülür (rollback).

### State Yönetimi Seçimi: Zustand Neden?
- **Hafif ve Basit:** Redux Toolkit'e göre daha az boilerplate kod.
- **Performans:** Sadece abone olan bileşenlerin yeniden render edilmesi.
- **Kolay Öğrenilebilirlik:** Ekip üyeleri hızlıca adapte olabilir.
- **Redux Toolkit Alternativi:** Durum yönetimi çok karmaşıklaşırsa veya zaman seyahati hata ayıklama gerekiyorsa geçiş yapılabilir.

### Diğer Frontend Mimarisi Kararları
- **Modüler Bileşenler:** UI bileşenleri (Shadcn/ui üzerinden) ve iş mantığı bileşenleri (widgetlar, veri çekme hooks) ayrı klasörlerde.
- **Tip Güvenliği:** TypeScript kullanılarak tüm props, state ve API yanıtları tiplendirilir.
- **Hata Sınırları:** React Error Boundaries ile bir widget'ın hatasının tüm sayfayı kırmaması.
- **Yükleme Durumları ve Placeholderlar:** `react-query` ve özel skeleton UI bileşenleriyle bekleme durumları.
- **Erişilebilirlik (a11y):** Shadcn/ui'nin Radix UI temeli, önerilen renk kontrastları ve klavye navigasyonu.
- **Performans Optimizasyonu:** `React.memo`, `useCallback`, `useMemo` gerektiğinde kullanılır; büyük listeler için pencereleme (windowing) teknikleri.

## 5. Otomatik Borçlandırma için Cron-Job / Worker Tasarımı

Binlerce daireye aidat borçlandırma işlemi, zaman aşımı, veri tutarsızlığı veya kilitlenme gibi sorunlara yol açmamalıdır. Bu işlem, arka planda güvenilir ve ölçeklenebilir bir şekilde çalıştırılmalıdır.

### Önerilen Mimari: Mesaj Tabanlı İş Akışı + Worker Pool

#### 1. Tetikleyici (Trigger)
- Bir **Cron Servisi** (NestJS `@nestjs/schedule` modülü ile veya harici cron job) ayın ilk günü saat 00:00'da çalıştırılır.
- Bu servis, **borçlandırma işlemi başlatmak** için bir mesaj oluşturur ve RabbitMQ'daki `billing.init` exchange'ına yayınlar:
  ```json
  {
    "tenantId": "uuid-tenant-1",
    "billingPeriod": "2026-06",
    "triggeredBy": "cron",
    "timestamp": "2026-06-01T00:00:00Z"
  }
  ```

#### 2. Mesaj Brokeri (RabbitMQ)
- `billing.init` exchange'ından gelen mesaj, `billing.process` adlı bir kuyruğa yönlendirilir (binding).
- Bu kuyruk, **birden fazla worker örneği** tarafından tüketilecek şekilde yapılandırılır (concurrent consumers) → paralel işleme.

#### 3. İşçi (Worker) - Borçlandırma İşçisi
- Birden fazla **NestJS Worker örneği** (örnek: 3-5 adet, yüküne göre ölçeklenebilir) `billing.process` kuyruğunu dinler.
- Bir worker bir mesaj aldığında:
  a. **Tenant Kilitleme:** Aynı tenant için çakışan borçlandırma işlemlerini önlemek için `SELECT FOR UPDATE` veya `billing_locks` tablosu kullanılarak tenant seviyesinde kilit edinilir.
  b. **Veri Toplama:** Tenant'ın tüm aktif dairelerini (`units` tablosu) ve ilgili bilgilerini (metrekare, arsa payı, sabit aidat oranı vb.) çeker.
  c. **Borç Hesaplama:** Her daire için:
     - `baseAmount = (unit.area_sqm * areaRate) + (unit.ownership_share * shareRate) + fixedFee`
     - `dueDate = billingPeriodEnd + gracePeriodDays`
  d. **Fatura Oluşturma:** Bir `invoices` kaydı oluşturur (status: `draft`).
  e. **Kalem Oluşturma:** `invoice_items` tablosuna aidat kalemi eklenir.
  f. **Gecikme Faizi Hesaplaması (Opsiyonel - İşlem Sonrası):** Gecikme faizi, ödeme tarihi geçtiğinde ayrı bir işlem (günlük worker) ile hesaplanıp uygulanır. Bu, ana borçlandırma işlemini basitleştirir.
  g. **İşaretleme ve Onay:** Oluşturulan fatura durumu `draft` olarak kalır ve bir onay işlemi bekler (muhasebeci/site yöneticisi onayı). Alternatif olarak, iş güvenilir kabul ediliyorsa fatura doğrudan `sent` durumuna geçebilir.
  h. **Kilit Serbest bırakma:** Tenant kilidi serbest bırakılır.
  i. **Tamamlama Bildirimi:** İş tamamlandığında, bir `billing.completed` eventi RabbitMQ'ya yayınlanabilir (bildirim servisi tarafından dinlenerek yöneticiye bildirim gönderilir).

#### 4. Güvenilirliği ve Hata Toleransını Sağlama
- **İşlem İçi Sıfırlama (Idempotency):** Worker, aynı mesajı iki kez işlerse aynı sonucu üretmelidir. `invoices` tablosunda `(tenant_id, billing_period, unit_id)` için benzersiz kısıtlama ve işlem öncesi kontrol ile sağlanır.
- **Zaman Aşımı ve Yeniden Deneme:** Worker işlemi çok uzun sürerse RabbitMQ'nun mesaj zaman aşımı özellikleri veya worker içindeki zamanlayıcı kullanılarak işlem iptal edilebilir ve mesaj tekrar kuyruğa alınabilir (requeue). Idempotency sağlandığı sürece güvenli yeniden deneme.
- **Dead Letter Queue (DLQ):** Bir mesaj belirli sayıda kez (örnek: 3 kez) başarısız olursa, RabbitMQ'nun Dead Letter Queue özelliği ile ayrı bir kuyruğa taşınır → sürekli hatalı mesajların sistemini tıkmaması ve manuel inceleme mümkün kılınur.
- **Gözlem ve Uyarı:** Worker'ın işlem süreci, başarı/başarısızlık oranları ve işlemdeki daire sayısı gibi metrikleri Prometheus'a çıkarılır. Grafiksel panolar ve uyarı kuralları (örnek: bir tenant için borçlandırma işlemi 10 dakikadan uzun sürerse uyarı) kurulur.

#### 5. Ödeme Entegrasyonu ve Makbuz Oluşturma
- Bir fatura ödendiğinde (Stripe/İyzico webhook'u üzerinden), `payments` tablosu güncellenir ve ilgili fatura'nın `paid_amount` ve `status` güncellenir.
- Bir ödeme başarılı olduğunda, bir `payment.completed` eventi yayınlanır.
- Bu eventi dinleyen bir **Makbuz Oluşturma Worker'ı** çalışır:
  * Ödeme ve ilgili fatura bilgilerini toplar.
  * Şablon tabanlı bir PDF makbuzu oluşturur (`pdfkit` veya `handlebars` + `wkhtmltopdf`).
  * Oluşturulan PDF'yi AWS S3'e yükler.
  * Makbuz URL'sini fatura veya ödeme kaydına ekler (veya ayrı bir `receipts` tablosunda saklar).
  * Makbuz hazırlandı eventi yayınlanır ve bildirim servisi üzerinden kullanıcıya e-posta/SMS ile gönderilir.

### Alternatif ve Ek Notlar
- **Veri Bölümleme (Sharding):** Tenant sayısı çok yüksek binlerceye çıkarsa ve tek bir veritabanı yetersiz kalırsa, tenant ID'ye göre horizontal sharding uygulanabilir. Ancak, başlangıç için tek veritabanı + tenant_id önerilir.
- **İş Akışı Motoru (Workflow Engine):** Karmaşık borçlandırma kuralları için özel bir iş akışı motoru (Camunda, Temporal) kullanılabilir. Başlangıç için doğrudan kod içinde kurallar uygulmak daha basittir.
- **Gecikme Faizi Yönetimi:** Gecikme faizinin fatura oluşturma aşamasında hesaplanması yerine, bir günlük worker tarafından gecikmiş faturaların faizi hesaplanıp `invoice_items` tablosuna yeni bir kalem (Gecikme Faizi) eklenmesi daha modüler ve yönetilebilir bir yaklaşımdır.

## Sonuç ve Öneriler

Bu teknik plan, Notion benzeri bir frontend deneyimi ve kurumsal finansal gücünü birleştiren bir SaaS platformu için sağlam bir temel sağlar. Önerilen teknoloji yığını (Next.js, Tiptap, Zustand, NestJS, PostgreSQL, RabbitMQ) modern, ölçeklenebilir ve geliştirici dostudur. Mimari, mikro servisler ve olay tabanlı iletişim kullanarak esnekliği, fault tolerance'ı ve bakım kolaylığını maksümum seviyeye çıkarır.

### İleri Aşamalar İçin Öneriler
1.  **Proof of Concept (PoC):** Tek bir tenant için temel fatura görüntüleme, widget dashboardu ve ödeme entegrasyonu içeren minimum çalışabilir ürün (MVP) geliştirin.
2.  **Güvenlik Denetimi:** Kimlik doğrulama, yetkilendirme (RBAC) ve veri koruması (GDPR/KVKK) konularında ayrıntılı bir analiz yapın.
3.  **Performans Testi:** Yük testleri (Locust, k6) ile sistemin binlerce tenant ve eşzamanlı işlem altında nasıl davrandığını ölçün.
4.  **CI/CD Pipeline'ı:** GitHub Actions veya GitLab CI kullanarak otomatik test, derleme ve dağıtım pipeline'ını kurun.
5.  **İzleme ve Günlükleme:** Production ortamında Prometheus/Grafana ve ELK stack'i entegre edin.

Bu plan, kullanıcı taleplerinizi karşılayacak şekilde detaylandırılmıştır. Belirli bir bölüm üzerinde daha derinlemesine teknik bir tartışma yapmak isterseniz veya alternatif teknoloji seçeneklerini değerlendirmek isterseniz, lütfen belirtin.