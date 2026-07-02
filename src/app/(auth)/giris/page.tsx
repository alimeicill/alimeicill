'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building, ShieldCheck, User, Key, ArrowRight } from 'lucide-react';

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedRole, setDetectedRole] = useState<'SUPER_ADMIN' | 'SITE_MANAGER' | 'TENANT_RESIDENT' | 'TECHNICAL_STAFF' | null>(null);
  const [detectedTenant, setDetectedTenant] = useState<string | null>(null);

  // E-posta girildiğinde çalışacak akıllı tespit fonksiyonu
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Mock email checks to detect tenant & role
      if (email.includes('admin')) {
        setDetectedRole('SUPER_ADMIN');
        setDetectedTenant('SaaS Platform Yönetimi');
      } else if (email.includes('yonetici')) {
        setDetectedRole('SITE_MANAGER');
        setDetectedTenant('Yıldız Konakları Sitesi');
      } else if (email.includes('sakin')) {
        setDetectedRole('TENANT_RESIDENT');
        setDetectedTenant('Yıldız Konakları - Blok A Daire 12');
      } else if (email.includes('personel') || email.includes('teknik')) {
        setDetectedRole('TECHNICAL_STAFF');
        setDetectedTenant('Yıldız Konakları Sitesi (Teknik Personel)');
      } else {
        // Fallback default
        setDetectedRole('SITE_MANAGER');
        setDetectedTenant('Yıldız Konakları Sitesi');
      }
      setStep(2);
    }, 800);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Redirect to role-based dashboard path
      switch (detectedRole) {
        case 'SUPER_ADMIN':
          router.push('/super-admin/dashboard');
          break;
        case 'SITE_MANAGER':
          router.push('/yonetici/dashboard');
          break;
        case 'TENANT_RESIDENT':
          router.push('/sakin/dashboard');
          break;
        case 'TECHNICAL_STAFF':
          router.push('/personel/dashboard');
          break;
        default:
          router.push('/yonetici/dashboard');
          break;
      }
    }, 1000);
  };

  const getRoleBadge = (role: typeof detectedRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
      case 'SITE_MANAGER':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
      case 'TENANT_RESIDENT':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'TECHNICAL_STAFF':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
      default:
        return '';
    }
  };

  const getRoleLabel = (role: typeof detectedRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Platform Sahibi';
      case 'SITE_MANAGER':
        return 'Site Yöneticisi';
      case 'TENANT_RESIDENT':
        return 'Site Sakini';
      case 'TECHNICAL_STAFF':
        return 'Teknik Personel';
      default:
        return '';
    }
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
            Akıllı Çok Kiracılı SaaS Yönetim Altyapısı
          </h2>
          <p className="text-lg text-blue-100/90 leading-relaxed">
            Apartman, site, rezidans ve karma kullanımlı yapıların operasyonel ve finansal süreçlerini dijital olarak takip edin.
          </p>
        </div>

        <div className="relative text-sm text-blue-200">
          © {new Date().getFullYear()} ApartmanYönet. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Sağ Panel - Akıllı Giriş Formu */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md space-y-8 animate-slide-up">
          <div className="flex items-center space-x-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500">
              <Building className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">ApartmanYönet</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Giriş Yap
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              E-posta adresiniz ile site yönetim panelinize güvenle bağlanın.
            </p>
          </div>

          {step === 1 ? (
            /* ADIM 1: E-POSTA GİRİŞİ */
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-secondary)]">E-posta Adresi</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-3.5 pl-10 pr-4 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                    placeholder="E-posta adresinizi girin..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary-700 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Kontrol Ediliyor...' : 'Devam Et'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          ) : (
            /* ADIM 2: ŞİFRE / DOĞRULAMA (AKILLI TESPİT SONRASI) */
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* Tespit Edilen Bilgiler */}
              <div className="rounded-xl bg-primary-500/5 border border-[var(--border-color)] p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-tertiary)]">Tespit Edilen Site / Kurum:</span>
                  <strong className="text-[var(--text-primary)]">{detectedTenant}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-tertiary)]">Kullanıcı Rolü:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${getRoleBadge(detectedRole)}`}>
                    {getRoleLabel(detectedRole)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-secondary)]">Şifre</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-3.5 pl-10 pr-10 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                    placeholder="Şifrenizi girin..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-tertiary)]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Farklı E-posta ile Giriş
                </button>
                <button
                  type="button"
                  onClick={() => alert('Magic Link e-posta adresinize gönderildi (Simüle).')}
                  className="text-secondary-600 hover:text-secondary-700"
                >
                  Magic Link ile Giriş
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 py-3.5 text-sm font-bold text-white shadow-md hover:from-primary-700 hover:to-indigo-800 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}
              </button>
            </form>
          )}

          {/* Demo Hint */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 space-y-2">
            <span className="block text-xs font-bold text-[var(--text-secondary)]">Rol Yönlendirme Demo E-postaları:</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--text-secondary)]">
              <div>• <strong>admin@site.com</strong> (Süper Yönetici)</div>
              <div>• <strong>yonetici@site.com</strong> (Site Yöneticisi)</div>
              <div>• <strong>sakin@site.com</strong> (Daire Sakini)</div>
              <div>• <strong>personel@site.com</strong> (Teknik Ekip)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
