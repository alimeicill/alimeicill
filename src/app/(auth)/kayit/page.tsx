'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Phone, Building, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function KayitPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      // Registration successful -> redirect to onboarding wizard
      router.push('/kurulum');
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-[var(--bg-primary)]">
      {/* Sol Panel - Hero Görsel & Gradyan */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-tr from-primary-600 via-primary-700 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-secondary-500/20 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-primary-500/25 blur-3xl"></div>

        <div className="relative flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
            <Building className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ApartmanYönet</span>
        </div>

        <div className="relative max-w-lg space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Yönetim Süreçlerinizi Saniyeler İçinde Başlatın
          </h2>
          <p className="text-lg text-blue-100/90 leading-relaxed">
            Hemen kaydolun ve sitenizi/apartmanınızı kurarak daire sakinlerini davet etmeye başlayın.
          </p>
        </div>

        <div className="relative text-sm text-blue-200">
          © {new Date().getFullYear()} ApartmanYönet. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Sağ Panel - Kayıt Formu */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md space-y-6 animate-slide-up">
          <div className="flex items-center space-x-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500">
              <Building className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">ApartmanYönet</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Yönetici Kaydı
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Apartman veya site yöneticisi olarak ücretsiz hesabınızı oluşturun.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Ad Soyad</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="örn: Ahmet Yılmaz"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">E-posta Adresi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="örn: ahmet@siteyonetim.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Telefon Numarası</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none"
                  placeholder="örn: +90 532 111 22 33"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Şifre</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2.5 pl-9 pr-4 text-xs text-[var(--text-primary)] focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Şifre Tekrar</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2.5 px-3.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center text-xs text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 mr-2"
                />
                <span>Kullanıcı Sözleşmesini kabul ediyorum.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 py-3 text-sm font-bold text-white shadow-md hover:from-primary-700 hover:to-indigo-800 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Kaydediliyor...' : 'Kaydol ve Siteni Kur'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>

          <div className="text-center text-xs text-[var(--text-secondary)]">
            Zaten hesabınız var mı?{' '}
            <Link href="/giris" className="font-bold text-primary-500 hover:text-primary-600">
              Giriş Yapın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
