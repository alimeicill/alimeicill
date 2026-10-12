// Aidat modülü uçtan uca testleri (yerel demo veritabanı).
const B = 'http://localhost:3000';
let pass = 0, failN = 0;
const ok = (c, m) => { c ? pass++ : failN++; console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); };
function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(B + path, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const set = res.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
    return { status: res.status, data: res.headers.get('content-type')?.includes('json') ? await res.json() : null };
  };
}
const cents = (xs) => xs.reduce((a, x) => a + Math.round(x * 100), 0);
const PERIOD = '2030-01'; // testler için ayrı, gelecekteki bir dönem
const mgr = client(); await mgr('POST', '/api/auth/login', { email: 'yonetici@demo.apartmanyonet.com', password: 'Demo2026!' });
const res = client(); await res('POST', '/api/auth/login', { email: 'sakin@demo.apartmanyonet.com', password: 'Demo2026!' });

let r = await mgr('GET', '/api/yonetici/aidat');
const seeded = r.data;
ok(r.status === 200 && seeded.length >= 60, `borç listesi veritabanından (${seeded.length})`);
ok(seeded.some((i) => i.status === 'overdue' && i.lateFee > 0), 'vadesi geçmiş borçta gecikme tazminatı hesaplanıyor');
ok(seeded.filter((i) => i.status === 'paid').every((i) => i.lateFee === 0 && i.remainingAmount === 0), 'ödenmiş borçta tazminat ve kalan 0');

// Eşit dağıtım: 1000,03 ₺ / 20 daire → toplam tam tutar
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'all', period: PERIOD, amount: 1000.03, dueDate: '2030-01-15', description: 'Test Eşit', method: 'equal' });
ok(r.status === 201 && r.data.created === 20 && r.data.total === 1000.03, `eşit dağıtım toplamı tam tutar (${r.data?.total})`);
let list = (await mgr('GET', '/api/yonetici/aidat')).data.filter((i) => i.description === 'Test Eşit');
const amts = list.map((i) => i.totalAmount);
ok(cents(amts) === 100003 && Math.max(...amts) - Math.min(...amts) <= 0.011, `daireler arası fark en fazla 1 kuruş (${Math.min(...amts)}–${Math.max(...amts)})`);
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'all', period: PERIOD, amount: 1000.03, dueDate: '2030-01-15', description: 'Test Eşit', method: 'equal' });
ok(r.status === 201 && r.data.created === 0 && r.data.skipped === 20, 'aynı dönem + açıklama ikinci kez yazılmadı');

// Arsa payı dağıtımı
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'all', period: PERIOD, amount: 7777.77, dueDate: '2030-01-15', description: 'Test Arsa', method: 'share' });
list = (await mgr('GET', '/api/yonetici/aidat')).data.filter((i) => i.description === 'Test Arsa');
ok(cents(list.map((i) => i.totalAmount)) === 777777, 'arsa payı dağıtım toplamı tam tutar');
const big = list.find((i) => i.unitNumber === 'A-201'), small = list.find((i) => i.unitNumber === 'A-102');
ok(big.totalAmount > small.totalAmount, `büyük arsa paylı daire daha çok öder (A-201 ${big.totalAmount} > A-102 ${small.totalAmount})`);

// m² bazlı: birim fiyat × m²
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'all', period: PERIOD, amount: 12.5, dueDate: '2030-01-15', description: 'Test m2', method: 'area' });
list = (await mgr('GET', '/api/yonetici/aidat')).data.filter((i) => i.description === 'Test m2');
ok(list.find((i) => i.unitNumber === 'A-101').totalAmount === 1500, 'm² bazlı: 120 m² × 12,50 ₺ = 1.500 ₺');

// Tek daire, sabit
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'unit-A201', period: PERIOD, amount: 450.5, dueDate: '2030-01-15', description: 'Test Tek', method: 'equal' });
ok(r.status === 201 && r.data.created === 1 && r.data.total === 450.5, 'tek daireye sabit tutar (yöntem yok sayılır)');
const single = (await mgr('GET', '/api/yonetici/aidat')).data.find((i) => i.description === 'Test Tek');

// Doğrulama
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'all', period: '2030-13', amount: 10, dueDate: '2030-01-15', description: 'X1', method: 'fixed' });
ok(r.status === 400, `geçersiz dönem reddedildi: ${r.data?.error}`);
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'all', period: PERIOD, amount: -5, dueDate: '2030-01-15', description: 'X1', method: 'fixed' });
ok(r.status === 400, 'negatif tutar reddedildi');

// Tahsilat
const pay = (id, amount, extra = {}) => mgr('POST', `/api/yonetici/aidat/${id}/odeme`, { amount, method: 'BANK_TRANSFER', paidAt: new Date().toISOString().slice(0, 10), ...extra });
r = await pay(single.id, 450.51);
ok(r.status === 400, `kalan borçtan fazla tahsilat reddedildi: ${r.data?.error}`);
r = await pay(single.id, 0.1); r = await pay(single.id, 0.2);
ok(r.status === 201 && r.data.invoice.paidAmount === 0.3 && r.data.invoice.status === 'partial', `0,10 + 0,20 = 0,30 (kayan nokta hatası yok) → kısmi`);
r = await pay(single.id, 450.2);
ok(r.status === 201 && r.data.invoice.status === 'paid' && r.data.invoice.remainingAmount === 0, 'kalan ödendi → ödendi');
ok(r.data.invoice.payments.length === 3 && new Set(r.data.invoice.payments.map((p) => p.receiptNo)).size === 3, 'her tahsilata ayrı makbuz numarası');
r = await pay(single.id, 1);
ok(r.status === 400, 'ödenmiş borca tahsilat yapılamaz');
r = await pay(single.id, 1, { paidAt: '2099-01-01' });
ok(r.status === 400, 'ileri tarihli tahsilat reddedildi');
r = await mgr('DELETE', `/api/yonetici/aidat/${single.id}`);
ok(r.status === 409, 'tahsilatı olan borç iptal edilemez');

// İptal
const toCancel = (await mgr('GET', '/api/yonetici/aidat')).data.find((i) => i.description === 'Test m2' && i.unitNumber === 'B-101');
r = await mgr('DELETE', `/api/yonetici/aidat/${toCancel.id}`);
ok(r.status === 200, 'tahsilatsız borç iptal edildi');
r = await pay(toCancel.id, 10);
ok(r.status === 400, 'iptal edilen borca tahsilat yapılamaz');
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'unit-B101', period: PERIOD, amount: 99, dueDate: '2030-01-15', description: 'Test m2', method: 'fixed' });
ok(r.data.created === 1, 'iptal edilen borcun yerine yenisi yazılabilir');

// Sakin
r = await res('GET', '/api/sakin/aidat');
ok(r.status === 200 && r.data.units.length === 1 && r.data.invoices.every((i) => i.unitId === 'unit-A201'), `sakin yalnızca kendi dairesinin borçlarını görür (${r.data?.invoices.length})`);
ok(r.data.invoices.some((i) => i.description === 'Test Tek' && i.payments.length === 3), 'sakin tahsilatları ve makbuzları görür');
ok((await res('GET', '/api/yonetici/aidat')).status === 403, 'sakin yönetici aidat listesine erişemez');
ok((await res('POST', `/api/yonetici/aidat/${single.id}/odeme`, { amount: 1, method: 'CASH', paidAt: '2026-01-01' })).status === 403, 'sakin tahsilat kaydedemez');

// Firma ayrımı
const other = client();
await other('POST', '/api/auth/register', { siteName: 'Diğer Site', name: 'Diğer Yönetici', email: `test-${Date.now()}@example.com`, password: 'Guclu2026x' });
r = await other('GET', '/api/yonetici/aidat');
ok(r.status === 200 && r.data.length === 0, 'başka firma bu sitenin borçlarını görmez');
const openOne = (await mgr('GET', '/api/yonetici/aidat')).data.find((i) => i.status === 'overdue');
r = await other('POST', `/api/yonetici/aidat/${openOne.id}/odeme`, { amount: 1, method: 'CASH', paidAt: '2026-01-01' });
ok(r.status === 400 && /bulunamadı/.test(r.data.error), 'başka firma bu sitenin borcuna tahsilat yazamaz');
r = await other('DELETE', `/api/yonetici/aidat/${openOne.id}`);
ok(r.status === 404, 'başka firma bu sitenin borcunu iptal edemez');

console.log(`\n${pass} geçti, ${failN} başarısız`);
