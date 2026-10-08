'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, ErrorText, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession, type SessionUser } from '@/lib/session';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);
  const [form, setForm] = useState({ firmName: '', name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string; user: SessionUser }>('/auth/register', { body: form });
      setSession(res.token, res.user);
      router.replace('/panel');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Yönetim hesabı oluşturun</h1>
      <p className="mt-1 text-sm text-slate-500">Firmanız için çalışma alanı açılır; siteleri hemen ekleyebilirsiniz.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Field label="Firma / yönetim adı" required>
          <input className="field" value={form.firmName} onChange={set('firmName')} />
        </Field>
        <Field label="Ad soyad" required>
          <input className="field" value={form.name} onChange={set('name')} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="E-posta" required>
            <input className="field" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Telefon">
            <input className="field" placeholder="5xx xxx xx xx" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
        <Field label="Şifre" required hint="En az 8 karakter">
          <input className="field" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        <ErrorText error={error} />
        <Button type="submit" loading={loading} className="w-full py-2.5">
          Hesabı oluştur
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Zaten hesabınız var mı?{' '}
        <Link href="/giris" className="font-medium text-brand-600 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </AuthShell>
  );
}
