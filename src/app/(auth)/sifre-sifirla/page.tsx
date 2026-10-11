'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Building, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';

export default function SifreSifirlaPage() {
  // useSearchParams statik derlemede Suspense sınırı ister.
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  // Yöneticinin gönderdiği davet bağlantısı mı, şifre sıfırlama mı?
  const isInvite = params.get('davet') === '1';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Şifre güncellenemedi.');
        return;
      }
      setDone(true);
    } catch {
      setError('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    'block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-3.5 pl-10 pr-10 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500">
            <Building className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">ApartmanYönet</span>
        </div>

        {done ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{isInvite ? 'Hesabınız etkinleştirildi' : 'Şifreniz güncellendi'}</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {isInvite
                  ? 'E-posta adresiniz ve belirlediğiniz şifreyle giriş yapabilirsiniz.'
                  : 'Yeni şifrenizle giriş yapabilirsiniz. Diğer cihazlardaki açık oturumlar kapatıldı.'}
              </p>
            </div>
            <Link
              href="/giris"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 py-3.5 text-sm font-bold text-white shadow-md"
            >
              Giriş Yap
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Bağlantı eksik</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Bu sayfayı e-postanıza gelen şifre sıfırlama bağlantısından açmalısınız.{' '}
              <Link href="/sifremi-unuttum" className="font-semibold text-primary-600">
                Yeni bağlantı isteyin
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{isInvite ? 'Hesabınızı etkinleştirin' : 'Yeni şifre belirleyin'}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {isInvite ? 'Site yönetiminiz sizi sakin paneline davet etti. Giriş için bir şifre belirleyin: ' : ''}En az 8 karakter; harf ve
                rakam içermelidir.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { id: 'password', label: 'Yeni şifre', value: password, set: setPassword },
                { id: 'confirm', label: 'Yeni şifre (tekrar)', value: confirm, set: setConfirm },
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <label htmlFor={f.id} className="text-sm font-semibold text-[var(--text-secondary)]">
                    {f.label}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      id={f.id}
                      type={show ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className={inputCls}
                    />
                    {f.id === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-tertiary)]"
                      >
                        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 py-3.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Kaydediliyor...' : isInvite ? 'Şifremi Belirle' : 'Şifremi Güncelle'}
              </button>
            </form>
          </>
        )}

        <div className="text-center">
          <Link href="/giris" className="inline-flex items-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
