// Kasa & banka ve pano uçtan uca testleri (yerel demo veritabanı).
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
const PERIOD = '2030-01'; // testler için ayrı dönem; temizlikte silinir
const today = new Date().toISOString().slice(0, 10);
const mgr = client(); await mgr('POST', '/api/auth/login', { email: 'yonetici@demo.apartmanyonet.com', password: 'Demo2026!' });
const res = client(); await res('POST', '/api/auth/login', { email: 'sakin@demo.apartmanyonet.com', password: 'Demo2026!' });
const accounts = async () => (await mgr('GET', '/api/yonetici/kasa')).data;
const bal = async (id) => (await accounts()).find((a) => a.id === id)?.balance;

// Hesaplar ve sakin görünümü
let r = await mgr('GET', '/api/yonetici/kasa');
ok(r.status === 200 && r.data.some((a) => a.type === 'CASH') && r.data.some((a) => a.type === 'BANK'), `kasa ve banka hesapları veritabanından (${r.data?.length})`);
const kasa = r.data.find((a) => a.id === 'acc-kasa'), banka = r.data.find((a) => a.id === 'acc-banka');
ok(kasa.balance > 0 && banka.balance > 0, `demo tahsilatları kasaya işlenmiş (kasa ${kasa.balance}, banka ${banka.balance})`);
r = await res('GET', '/api/sakin/aidat');
ok(r.data.paymentAccounts?.length === 1 && r.data.paymentAccounts[0].iban === 'TR82 0006 2000 0001 2345 6789 01', `sakin sitenin IBAN'ını görür (${r.data.paymentAccounts?.[0]?.iban})`);
ok(!('balance' in r.data.paymentAccounts[0]), 'sakine hesap bakiyesi gösterilmez');
r = await res('GET', '/api/yonetici/kasa');
ok(r.status === 403, 'sakin kasa hesaplarına erişemez');
r = await res('GET', '/api/yonetici/pano');
ok(r.status === 403, 'sakin yönetici panosuna erişemez');

// Tahsilat → kasa
const DESC = `Test Kasa ${Date.now()}`; // her çalıştırmada yeni borç
r = await mgr('POST', '/api/yonetici/aidat', { unitId: 'unit-A201', period: PERIOD, amount: 1000, dueDate: '2030-01-15', description: DESC, method: 'fixed' });
const due = (await mgr('GET', '/api/yonetici/aidat')).data.find((i) => i.description === DESC);
const pay = (amount, extra) => mgr('POST', `/api/yonetici/aidat/${due.id}/odeme`, { amount, paidAt: today, ...extra });
const k0 = await bal('acc-kasa'), b0 = await bal('acc-banka');
r = await pay(100, { method: 'CASH' });
ok(r.status === 201 && (await bal('acc-kasa')) === k0 + 100, 'nakit tahsilat kendiliğinden kasaya işlendi');
r = await pay(150.25, { method: 'BANK_TRANSFER' });
ok(r.status === 201 && (await bal('acc-banka')) === b0 + 150.25, 'havale tahsilatı kendiliğinden bankaya işlendi');
r = await pay(50, { method: 'BANK_TRANSFER', accountId: 'acc-kasa' });
ok(r.status === 201 && (await bal('acc-kasa')) === k0 + 150, 'seçilen hesaba işlendi (havale ama kasa seçildi)');
r = await pay(10, { method: 'CASH', accountId: 'yok-boyle-hesap' });
ok(r.status === 400, `bilinmeyen hesaba tahsilat reddedildi: ${r.data?.error}`);
const after = (await mgr('GET', '/api/yonetici/aidat')).data.find((i) => i.id === due.id);
ok(after.paidAmount === 300.25, `geçersiz hesapta borç da değişmedi (ödenen ${after.paidAmount})`);
r = await mgr('GET', '/api/yonetici/kasa/acc-kasa/ekstre');
const top = r.data.find((t) => t.type === 'DUES_COLLECTION' && t.description.endsWith(`Ocak 2030 ${DESC}`));
ok(top && top.receiptNo?.startsWith('TH-') && top.description.startsWith('Daire A-201'), `ekstrede daire, dönem ve makbuz no (${top?.description})`);
ok(r.data[0].balance === (await bal('acc-kasa')), 'ekstrenin son bakiyesi hesap bakiyesine eşit');
r = await mgr('DELETE', `/api/yonetici/kasa/hareketler/${top.id}`);
ok(r.status === 400, `aidat tahsilatı kasadan silinemez: ${r.data?.error}`);

// Hesap açma ve IBAN doğrulama
r = await mgr('POST', '/api/yonetici/kasa', { name: 'TEST Banka', type: 'BANK', bankName: 'Test Bank', iban: 'TR83 0006 2000 0001 2345 6789 01' });
ok(r.status === 400, `kontrol hanesi yanlış IBAN reddedildi: ${r.data?.error}`);
r = await mgr('POST', '/api/yonetici/kasa', { name: 'TEST Banka', type: 'BANK', bankName: 'Test Bank', showToResidents: true });
ok(r.status === 400, 'IBAN olmadan sakinlere gösterilemez');
r = await mgr('POST', '/api/yonetici/kasa', { name: 'TEST Banka', type: 'BANK', bankName: 'Test Bank', iban: 'tr82 0006 2000 0001 2345 6789 01', openingBalance: 1000 });
const testId = r.data?.id;
ok(r.status === 201 && (await bal(testId)) === 1000, 'banka hesabı açılış bakiyesiyle açıldı (küçük harf/boşluklu IBAN kabul)');
ok((await accounts()).find((a) => a.id === testId).iban === 'TR82 0006 2000 0001 2345 6789 01', 'IBAN düzgün biçimde saklandı');

// Virman, gider, silme
const k1 = await bal('acc-kasa');
r = await mgr('POST', '/api/yonetici/kasa/hareketler', { kind: 'TRANSFER', accountId: testId, targetAccountId: 'acc-kasa', amount: 5000, date: today });
ok(r.status === 400, `bakiyeden büyük virman reddedildi: ${r.data?.error}`);
r = await mgr('POST', '/api/yonetici/kasa/hareketler', { kind: 'TRANSFER', accountId: testId, targetAccountId: testId, amount: 1, date: today });
ok(r.status === 400, 'aynı hesaba virman reddedildi');
r = await mgr('POST', '/api/yonetici/kasa/hareketler', { kind: 'TRANSFER', accountId: testId, targetAccountId: 'acc-kasa', amount: 300, date: today, description: 'TEST virman' });
ok(r.status === 201 && (await bal(testId)) === 700 && (await bal('acc-kasa')) === k1 + 300, 'virman iki hesabı da güncelledi');
r = await mgr('POST', '/api/yonetici/kasa/hareketler', { kind: 'EXPENSE', accountId: testId, amount: 200.5, date: today, description: 'TEST elektrik' });
ok(r.status === 201 && (await bal(testId)) === 499.5, 'gider bakiyeden düştü');
r = await mgr('POST', '/api/yonetici/kasa/hareketler', { kind: 'EXPENSE', accountId: testId, amount: 10, date: today, description: '' });
ok(r.status === 400, 'açıklamasız gider reddedildi');
r = await mgr('POST', '/api/yonetici/kasa/hareketler', { kind: 'OTHER_INCOME', accountId: testId, amount: 10, date: '2099-01-01', description: 'TEST ileri' });
ok(r.status === 400, 'ileri tarihli hareket reddedildi');
const st = (await mgr('GET', `/api/yonetici/kasa/${testId}/ekstre`)).data;
const transferRow = st.find((t) => t.type === 'TRANSFER_OUT');
r = await mgr('DELETE', `/api/yonetici/kasa/hareketler/${transferRow.id}`);
ok(r.status === 200 && (await bal(testId)) === 799.5 && (await bal('acc-kasa')) === k1, 'virman silinince iki ayağı da geri alındı');
r = await mgr('PATCH', `/api/yonetici/kasa/${testId}`, { isActive: false });
ok(r.status === 400, `bakiyeli hesap kapatılamaz: ${r.data?.error}`);

// Sakinlere gösterme
r = await mgr('PATCH', `/api/yonetici/kasa/${testId}`, { showToResidents: true });
ok(r.status === 200 && (await res('GET', '/api/sakin/aidat')).data.paymentAccounts.length === 2, 'işaretlenen hesap sakinde göründü');
r = await mgr('PATCH', `/api/yonetici/kasa/${testId}`, { iban: '' });
ok(r.status === 400, 'sakinlere açık hesabın IBAN’ı silinemez');
r = await mgr('PATCH', `/api/yonetici/kasa/${testId}`, { showToResidents: false });
ok((await res('GET', '/api/sakin/aidat')).data.paymentAccounts.length === 1, 'işaret kaldırılınca sakinde gizlendi');

// Pano
r = await mgr('GET', '/api/yonetici/pano');
const p = r.data;
const sum = (await accounts()).filter((a) => a.isActive).reduce((a, x) => a + Math.round(x.balance * 100), 0) / 100;
ok(r.status === 200 && p.units.total === 20 && p.units.occupied + p.units.empty + p.units.renovation === 20, `pano daire sayıları (${p.units.occupied} dolu / ${p.units.empty} boş)`);
ok(p.cash.total === sum, `pano kasa toplamı hesap bakiyelerine eşit (${p.cash.total})`);
const invoices = (await mgr('GET', '/api/yonetici/aidat')).data;
const outstanding = invoices.filter((i) => i.status !== 'cancelled').reduce((a, i) => a + Math.round(i.remainingAmount * 100), 0) / 100;
ok(p.dues.outstanding === outstanding, `pano kalan borç = aidat listesindeki kalan toplamı (${p.dues.outstanding})`);
ok(p.monthly.length === 6 && p.monthly.some((m) => m.revenue > 0), 'son 6 ayın gelir-gider grafiği dolu');
ok(p.recentPayments[0]?.unitNumber === 'A-201', 'son tahsilatlarda en yeni kayıt üstte');

// Firma ayrımı
const other = client();
await other('POST', '/api/auth/register', { siteName: 'Kasa Test Sitesi', name: 'Diğer Yönetici', email: `test-${Date.now()}@example.com`, password: 'Guclu2026x' });
r = await other('GET', '/api/yonetici/kasa');
ok(r.status === 200 && r.data.length === 0, 'başka firma bu sitenin hesaplarını görmez');
r = await other('GET', '/api/yonetici/kasa/acc-banka/ekstre');
ok(r.status === 404, 'başka firma ekstreyi göremez');
r = await other('PATCH', '/api/yonetici/kasa/acc-banka', { showToResidents: false });
ok(r.status === 404, 'başka firma hesabı değiştiremez');
r = await other('POST', '/api/yonetici/kasa/hareketler', { kind: 'EXPENSE', accountId: 'acc-kasa', amount: 1, date: today, description: 'TEST sızma' });
ok(r.status === 400, 'başka firma bu sitenin kasasından ödeme yapamaz');
r = await other('POST', `/api/yonetici/aidat/${due.id}/odeme`, { amount: 1, method: 'CASH', paidAt: today, accountId: 'acc-kasa' });
ok(r.status === 400, 'başka firma bu sitenin borcuna/kasasına tahsilat yazamaz');
r = await other('GET', '/api/yonetici/pano');
ok(r.status === 200 && r.data.units.total === 0 && r.data.cash.total === 0, 'başka firmanın panosu kendi (boş) verisini gösterir');

console.log(`\n${pass} geçti, ${failN} başarısız`);
if (failN) process.exit(1);
