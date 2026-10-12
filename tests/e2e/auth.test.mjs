// ApartmanYönet giriş sistemi uçtan uca testi (yerel demo veritabanı).
const B = 'http://localhost:3000';
let pass = 0, failN = 0;
const ok = (c, m) => { c ? pass++ : failN++; console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); };

// Basit çerez kavanozu
function client() {
  let cookie = '';
  return async (method, path, body, { redirect = 'manual' } = {}) => {
    const res = await fetch(B + path, {
      method, redirect,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    let data = null;
    if (res.headers.get('content-type')?.includes('json')) data = await res.json();
    return { status: res.status, data, location: res.headers.get('location'), set };
  };
}
const PW = 'Demo2026!';

// --- Oturumsuz ---
const anon = client();
let r = await anon('GET', '/yonetici/dashboard');
ok(r.status === 307 && r.location?.includes('/giris?next=%2Fyonetici%2Fdashboard'), `oturumsuz panel → giriş (${r.status} ${r.location})`);
r = await anon('GET', '/api/genel-kurul');
ok(r.status === 401, `oturumsuz API 401 (${r.status})`);
r = await anon('GET', '/api/yonetici/cari');
ok(r.status === 401, 'oturumsuz cari API 401');
r = await anon('GET', '/');
ok(r.status === 200, 'tanıtım sayfası herkese açık');

// --- Hatalı giriş ---
r = await anon('POST', '/api/auth/login', { email: 'yonetici@demo.apartmanyonet.com', password: 'yanlis' });
ok(r.status === 401 && r.data.error === 'E-posta veya şifre hatalı.', 'yanlış şifre reddedildi');
r = await anon('POST', '/api/auth/login', { email: 'yok@example.com', password: 'x' });
ok(r.status === 401 && r.data.error === 'E-posta veya şifre hatalı.', 'olmayan kullanıcı aynı mesajla reddedildi');
r = await anon('POST', '/api/auth/login', { email: 'ahmet.yilmaz@example.com', password: PW });
ok(r.status === 401, 'şifresi olmayan kullanıcı giriş yapamaz');

// --- Yönetici ---
const mgr = client();
r = await mgr('POST', '/api/auth/login', { email: 'yonetici@demo.apartmanyonet.com', password: PW });
ok(r.status === 200 && r.data.home === '/yonetici/dashboard', `yönetici girişi → ${r.data?.home}`);
ok(/HttpOnly/i.test(r.set) && /SameSite=lax/i.test(r.set), 'oturum çerezi HttpOnly + SameSite');
r = await mgr('GET', '/api/auth/me');
ok(r.data?.name === 'Hasan Korkmaz' && r.data.tenantName === 'Yıldız Konakları Sitesi', 'me: yönetici bilgileri');
r = await mgr('GET', '/yonetici/dashboard');
ok(r.status === 200, 'yönetici paneli açılıyor');
r = await mgr('GET', '/sakin/dashboard');
ok(r.status === 307 && r.location?.endsWith('/yonetici/dashboard'), 'yönetici sakin paneline giremez → kendi paneli');
r = await mgr('GET', '/giris');
ok(r.status === 307 && r.location?.endsWith('/yonetici/dashboard'), 'giriş yapmışken /giris → panel');
r = await mgr('GET', '/api/yonetici/cari');
ok(r.status === 200, `yönetici cari listesini alır (${r.status})`);
r = await mgr('GET', '/api/genel-kurul');
const before = r.data;
ok(r.status === 200, 'yönetici genel kurul listesi');
if (!before.length) await mgr('POST', '/api/genel-kurul', { demo: true });
r = await mgr('GET', '/api/genel-kurul');
const live = r.data.find((m) => m.status === 'devam');
ok(!!live, 'örnek canlı toplantı mevcut');

// --- Sakin (A-201 maliki) ---
const res = client();
r = await res('POST', '/api/auth/login', { email: 'sakin@demo.apartmanyonet.com', password: PW });
ok(r.data?.home === '/sakin/dashboard', 'sakin girişi → sakin paneli');
r = await res('GET', '/api/auth/me');
ok(JSON.stringify(r.data?.ownedUnitIds) === '["unit-A201"]', `sakinin dairesi: ${JSON.stringify(r.data?.ownedUnitIds)}`);
r = await res('GET', '/yonetici/dashboard');
ok(r.status === 307 && r.location?.endsWith('/sakin/dashboard'), 'sakin yönetici paneline giremez');
r = await res('GET', '/api/yonetici/cari');
ok(r.status === 403, `sakin yönetici API'sine erişemez (${r.status})`);
const item = live.agenda[3].id;
r = await res('PUT', `/api/genel-kurul/${live.id}/votes`, { agendaItemId: item, unitId: 'unit-A101', choice: 'kabul' });
ok(r.status === 403, 'sakin başkasının dairesi adına oy veremez');
r = await res('PUT', `/api/genel-kurul/${live.id}/votes`, { agendaItemId: item, unitId: 'unit-A201', choice: 'kabul' });
ok(r.status === 200 && r.data.votes[item]['unit-A201'] === 'kabul', 'sakin kendi dairesi adına oy verdi');
r = await res('PATCH', `/api/genel-kurul/${live.id}`, { action: 'finish' });
ok(r.status === 403, 'sakin toplantıyı kapatamaz');
r = await res('POST', '/api/genel-kurul', { demo: true });
ok(r.status === 403, 'sakin genel kurul oluşturamaz');

// --- Firma ayrımı: yeni kayıt ---
const other = client();
const email = `test-${Date.now()}@example.com`;
r = await other('POST', '/api/auth/register', { siteName: 'Test Apartmanı', name: 'Test Yönetici', email, password: 'kisa' });
ok(r.status === 400, `zayıf şifre reddedildi: ${r.data?.error}`);
r = await other('POST', '/api/auth/register', { siteName: 'Test Apartmanı', name: 'Test Yönetici', email, password: 'Guclu2026x' });
ok(r.status === 201 && r.data.home === '/kurulum', 'kayıt → kurulum sihirbazı');
r = await other('POST', '/api/auth/register', { siteName: 'Başka Site', name: 'Y Z', email, password: 'Guclu2026x' });
ok(r.status === 409, 'aynı e-posta ile ikinci kayıt reddedildi');
r = await other('GET', '/api/genel-kurul');
ok(r.status === 200 && r.data.length === 0, `yeni firma başka firmanın genel kurullarını görmez (${r.data?.length})`);
r = await other('PATCH', `/api/genel-kurul/${live.id}`, { action: 'finish' });
ok(r.status === 404, 'yeni firma diğer firmanın toplantısını değiştiremez (404)');
r = await other('GET', '/api/yonetici/cari?tenantId=tenant-001');
ok(r.status === 200 && Array.isArray(r.data) ? r.data.length === 0 : true, 'tenantId parametresiyle başka firmanın carisi okunamaz');

// --- Çıkış ---
r = await mgr('POST', '/api/auth/logout');
r = await mgr('GET', '/api/auth/me');
ok(r.status === 401, 'çıkıştan sonra oturum kapalı');

// --- Deneme sınırı ---
const brute = client();
let last;
for (let i = 0; i < 6; i++) last = await brute('POST', '/api/auth/login', { email: 'personel@demo.apartmanyonet.com', password: 'yanlis' + i });
ok(last.status === 429, `5 hatalı denemeden sonra kilit (${last.status})`);

console.log(`\n${pass} geçti, ${failN} başarısız`);
