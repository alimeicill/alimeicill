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
const mgr = client(); await mgr('POST', '/api/auth/login', { email: 'yonetici@demo.apartmanyonet.com', password: 'Demo2026!' });
const resident = client(); await resident('POST', '/api/auth/login', { email: 'sakin@demo.apartmanyonet.com', password: 'Demo2026!' });

let r = await mgr('POST', '/api/yonetici/sakinler/user-007/davet');
ok(r.status === 400 && /e-posta/.test(r.data.error), `e-postasız sakine davet: ${r.data?.error}`);
r = await mgr('POST', '/api/yonetici/sakinler/user-005/davet');
ok(r.status === 409, 'giriş yapabilen sakine davet bağlantısı verilmez (hesap ele geçirme önlemi)');
r = await mgr('PATCH', '/api/yonetici/sakinler/user-005', { email: 'baska@example.com' });
ok(r.status === 409, 'giriş yapabilen sakinin e-postası değiştirilemez');
r = await mgr('POST', '/api/yonetici/sakinler/user-001/davet');
ok(r.status === 404, 'yönetici hesabı için davet üretilemez');
r = await resident('POST', '/api/yonetici/sakinler/user-007/davet');
ok(r.status === 403, 'sakin davet gönderemez');
r = await mgr('PATCH', '/api/yonetici/sakinler/user-007', { email: 'muhasebe@demo.apartmanyonet.com' });
ok(r.status === 409, 'başkasının e-postası verilemez');
r = await mgr('PATCH', '/api/yonetici/sakinler/user-007', { email: 'gecersiz' });
ok(r.status === 400, 'geçersiz e-posta reddedildi');
r = await mgr('PATCH', '/api/yonetici/sakinler/user-007', { email: 'mustafa.test@example.com' });
ok(r.status === 200, 'sakine e-posta eklendi');
r = await mgr('POST', '/api/yonetici/sakinler/user-007/davet');
ok(r.status === 200 && r.data.link.includes('/sifre-sifirla?token=') && r.data.link.endsWith('&davet=1') && r.data.emailed === false, 'davet bağlantısı üretildi (SMTP yok → e-posta gönderilmedi)');
const token = new URL(r.data.link).searchParams.get('token');
r = await mgr('POST', '/api/yonetici/sakinler/user-007/davet');
const token2 = new URL(r.data.link).searchParams.get('token');
r = await client()('POST', '/api/auth/reset-password', { token, password: 'Mustafa2026' });
ok(r.status === 400, 'yeni davet önceki bağlantıyı geçersiz kıldı');
r = await client()('POST', '/api/auth/reset-password', { token: token2, password: 'Mustafa2026' });
ok(r.status === 200, 'sakin şifresini belirledi');
const m = client();
r = await m('POST', '/api/auth/login', { email: 'mustafa.test@example.com', password: 'Mustafa2026' });
ok(r.status === 200 && r.data.home === '/sakin/dashboard', 'davetli sakin giriş yaptı → sakin paneli');
r = await m('GET', '/api/auth/me');
ok(JSON.stringify(r.data.ownedUnitIds) === '["unit-A301"]', `davetli sakinin dairesi: ${JSON.stringify(r.data.ownedUnitIds)}`);
r = await mgr('GET', '/api/yonetici/sakinler');
ok(r.data.find((u) => u.id === 'user-007').canLogin === true, 'sakinler listesinde "giriş aktif"');
r = await mgr('POST', '/api/yonetici/sakinler/user-007/davet');
ok(r.status === 409, 'artık davet tekrar üretilemez');
console.log(`\n${pass} geçti, ${failN} başarısız`);
