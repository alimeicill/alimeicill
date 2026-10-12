const B = 'http://localhost:3000', token = process.argv[2], EMAIL = 'muhasebe@demo.apartmanyonet.com';
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
const old = client();
ok((await old('POST', '/api/auth/login', { email: EMAIL, password: 'Demo2026!' })).status === 200, 'eski şifreyle oturum açık');
const anon = client();
let r = await anon('POST', '/api/auth/reset-password', { token, password: 'kisa' });
ok(r.status === 400, `zayıf yeni şifre reddedildi: ${r.data?.error}`);
r = await anon('POST', '/api/auth/reset-password', { token: 'x'.repeat(43), password: 'YeniSifre2026' });
ok(r.status === 400, 'sahte bağlantı reddedildi');
r = await anon('POST', '/api/auth/reset-password', { token, password: 'YeniSifre2026' });
ok(r.status === 200, 'şifre sıfırlandı');
ok((await old('GET', '/api/auth/me')).status === 401, 'eski cihazdaki oturum kapandı');
ok((await client()('POST', '/api/auth/login', { email: EMAIL, password: 'Demo2026!' })).status === 401, 'eski şifre artık çalışmıyor');
ok((await client()('POST', '/api/auth/login', { email: EMAIL, password: 'YeniSifre2026' })).status === 200, 'yeni şifreyle giriş');
r = await anon('POST', '/api/auth/reset-password', { token, password: 'BaskaSifre2026' });
ok(r.status === 400, 'aynı bağlantı ikinci kez kullanılamaz');
console.log(`\n${pass} geçti, ${failN} başarısız`);
