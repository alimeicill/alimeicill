'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, ErrorText, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession, type SessionUser } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string; user: SessionUser }>('/auth/login', { body: { login, password } });
      setSession(res.token, res.user);
      router.replace(res.user.role === 'ADMIN' ? '/panel' : '/sakin');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hesabınıza giriş yapın</h1>
      <p className="mt-1 text-sm text-slate-500">Bilgilerinizi girerek yönetim paneline erişin.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="E-posta veya telefon">
          <input className="field" autoFocus autoComplete="username" placeholder="ornek@firma.com veya 5xx xxx xx xx" value={login} onChange={(e) => setLogin(e.target.value)} />
        </Field>
        <Field label="Şifre">
          <div className="relative">
            <input className="field pr-10" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute inset-y-0 right-0 px-3 text-slate-400" onClick={() => setShow(!show)} aria-label="Şifreyi göster">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <ErrorText error={error} />
        <Button type="submit" loading={loading} className="w-full py-2.5">
          Giriş yap
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Yönetim firması mısınız?{' '}
        <Link href="/kayit" className="font-medium text-brand-600 hover:underline">
          Ücretsiz hesap oluşturun
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-400">Sakinler, yöneticinin verdiği telefon ve şifre ile giriş yapar.</p>
    </AuthShell>
  );
}
