'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft, Building, MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-[var(--bg-primary)]">
      {/* Sol Panel - Hero Gradyan */}
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
            Şifrenizi Mi Unuttunuz?
          </h2>
          <p className="text-lg text-blue-100/90 leading-relaxed">
            Endişelenmeyin! E-posta adresinizi girerek şifrenizi sıfırlamak için gerekli bağlantıyı alabilirsiniz.
          </p>
        </div>

        <div className="relative text-sm text-blue-200">
          © {new Date().getFullYear()} ApartmanYönet. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Sağ Panel - Şifre Sıfırlama Formu */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md space-y-8 animate-slide-up">
          <div className="flex items-center space-x-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500">
              <Building className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">ApartmanYönet</span>
          </div>

          {!submitted ? (
            <>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Şifre Sıfırlama
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Kayıtlı e-posta adresinizi girin, size şifre sıfırlama linki gönderelim.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-3.5 pl-10 pr-4 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="örn: ahmet@siteyonetim.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-primary-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <MailCheck className="h-8 w-8 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">Talep Alındı</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Şifre sıfırlama yönergeleri <strong>{email}</strong> adresinize başarıyla gönderildi. Lütfen gelen kutunuzu (ve gereksiz kutusunu) kontrol edin.
                </p>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link 
              href="/giris" 
              className="inline-flex items-center text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Giriş Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
