// Daireler, sakinler, daire sahipliği ve şifre sıfırlama testleri (yerel demo veritabanı).
import { readFileSync } from 'node:fs';
const B = 'http://localhost:3000';
let pass = 0, failN = 0;
const ok = (c, m) => { c ? pass++ : failN++; console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); };
function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(B + path, {
      method, redirect: 'manual',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
    return { status: res.status, data };
  };
}
const PW = 'Demo2026!';
const mgr = client(); await mgr('POST', '/api/auth/login', { email: 'yonetici@demo.apartmanyonet.com', password: PW });
const res = client(); await res('POST', '/api/auth/login', { email: 'sakin@demo.apartmanyonet.com', password: PW });

// --- Daireler ---
let r = await mgr('GET', '/api/yonetici/daireler');
ok(r.status === 200 && r.data.length === 20, `20 daire veritabanından geldi (${r.data?.length})`);
const a201 = r.data.find((u) => u.id === 'unit-A201');
ok(a201?.ownerName === 'Mehmet Demir' && a201.ownerId === 'user-005', 'A-201 maliki Mehmet Demir');
ok(r.data.filter((u) => u.tenantName).length === 3, '3 dairede kiracı var');
r = await res('GET', '/api/yonetici/daireler');
ok(r.status === 403, 'sakin yönetici daire listesine erişemez');
r = await res('GET', '/api/units');
ok(r.status === 200 && r.data.length === 20 && r.data.every((u) => !('emergencyPhone' in u) && !('vehicles' in u)), 'özet daire listesi kişisel alanları içermiyor');

r = await mgr('POST', '/api/yonetici/daireler', { blockName: 'C', number: '1', floor: 1, type: 'residential', areaSqm: 90, ownershipShare: 4, status: 'occupied', ownerName: 'Test Malik', tenantName: 'Test Kiracı', vehicle: '34 TST 01', pet: 'Boncuk' });
ok(r.status === 201 && r.data.ownerName === 'Test Malik' && r.data.tenantName === 'Test Kiracı' && r.data.vehicles[0] === '34 TST 01', 'yeni daire malik, kiracı, araç ile eklendi');
const newUnit = r.data;
r = await mgr('POST', '/api/yonetici/daireler', { blockName: 'C', number: '1', floor: 1, type: 'residential', areaSqm: 90, ownershipShare: 4, status: 'vacant' });
ok(r.status === 409, `aynı blok + numara reddedildi: ${r.data?.error}`);
r = await mgr('POST', '/api/yonetici/daireler', { blockName: 'C', number: '2', floor: 1, type: 'villa', areaSqm: -3, ownershipShare: 4, status: 'vacant' });
ok(r.status === 400, `geçersiz daire verisi reddedildi: ${r.data?.error}`);

// --- Sakinler ---
r = await mgr('GET', '/api/yonetici/sakinler');
const testOwner = r.data.find((u) => u.name === 'Test Malik');
ok(r.status === 200 && testOwner?.unitLabel?.includes('C / Daire 1'), `daire eklerken açılan malik sakinlerde görünüyor (${testOwner?.unitLabel})`);
ok(r.data.some((u) => u.name === 'Mehmet Demir' && u.canLogin), 'giriş yapabilen sakin işaretli');
r = await mgr('POST', '/api/yonetici/sakinler', { name: 'Yeni Kiracı', email: 'sakin@demo.apartmanyonet.com', role: 'tenant' });
ok(r.status === 409, 'kayıtlı e-posta ile sakin eklenemez');
r = await mgr('POST', '/api/yonetici/sakinler', { name: 'Sahte Yönetici', role: 'site_manager' });
ok(r.status === 400, 'bu ekrandan yönetici hesabı açılamaz');
r = await mgr('POST', '/api/yonetici/sakinler', { name: 'Yeni Malik', phone: '05320000000', role: 'owner', unitId: 'unit-B502' });
ok(r.status === 201, 'e-postasız malik daireye bağlanarak eklendi');
const newResId = r.data.id;
r = await mgr('GET', '/api/yonetici/daireler');
ok(r.data.find((u) => u.id === newUnit.id) && r.data.find((u) => u.id === 'unit-B502').residentHistory.some((h) => h.resident.startsWith('Yeni Malik')), 'yeni malik B-502 geçmişinde');
r = await mgr('DELETE', `/api/yonetici/sakinler/user-001`);
ok(r.status === 404, 'yönetici hesabı sakin ekranından silinemez');

// --- Sahiplik: oturum ve genel kurul ---
r = await res('GET', '/api/auth/me');
ok(JSON.stringify(r.data.ownedUnitIds) === '["unit-A201"]', 'sakinin dairesi veritabanından');
r = await mgr('GET', '/api/genel-kurul');
const live = r.data.find((m) => m.status === 'devam');
if (live) {
  const item = live.agenda[0].id;
  r = await res('PUT', `/api/genel-kurul/${live.id}/votes`, { agendaItemId: item, unitId: 'unit-A201', choice: 'ret' });
  ok(r.status === 200, 'sakin veritabanı sahipliğiyle kendi dairesi adına oy verdi');
  r = await res('PUT', `/api/genel-kurul/${live.id}/votes`, { agendaItemId: item, unitId: 'unit-A101', choice: 'ret' });
  ok(r.status === 403, 'başkasının dairesi adına oy reddedildi');
  r = await res('PUT', `/api/genel-kurul/${live.id}/votes`, { agendaItemId: item, unitId: newUnit.id, choice: 'ret' });
  ok(r.status === 403, 'sonradan eklenen başka dairede de oy reddedildi');
}

// --- Temizlik ---
r = await mgr('DELETE', `/api/yonetici/daireler/${newUnit.id}`);
ok(r.status === 200, 'test dairesi silindi');
for (const name of ['Test Malik', 'Test Kiracı']) {
  const u = (await mgr('GET', '/api/yonetici/sakinler')).data.find((x) => x.name === name);
  if (u) await mgr('DELETE', `/api/yonetici/sakinler/${u.id}`);
}
r = await mgr('DELETE', `/api/yonetici/sakinler/${newResId}`);
ok(r.status === 200, 'test sakini silindi');

// --- Şifre sıfırlama ---
const anon = client();
r = await anon('POST', '/api/auth/forgot-password', { email: 'olmayan@example.com' });
const generic = r.data.message;
ok(r.status === 200, 'kayıtsız e-posta için de başarı yanıtı');
r = await anon('POST', '/api/auth/forgot-password', { email: 'muhasebe@demo.apartmanyonet.com' });
ok(r.status === 200 && r.data.message === generic, 'kayıtlı e-posta için aynı yanıt (e-posta ifşa edilmiyor)');
const acct = client(); await acct('POST', '/api/auth/login', { email: 'muhasebe@demo.apartmanyonet.com', password: PW });
ok((await acct('GET', '/api/auth/me')).status === 200, 'muhasebe hesabının açık oturumu var');

console.log(`
${pass} geçti, ${failN} başarısız`);
