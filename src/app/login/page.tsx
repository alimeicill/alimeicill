'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@siteyonetim.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate login API call
    setTimeout(() => {
      if (email === 'admin@siteyonetim.com' && password === 'demo123') {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
        setError('E-posta adresi veya şifre hatalı.');
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-[var(--bg-primary)]">
      {/* Left Panel - Hero Gradient */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-800 text-white relative overflow-hidden">
        {/* Decorative Grid SVG */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Floating circles */}
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-violet-500/25 blur-3xl"></div>

        <div className="relative flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
            <Building className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SiteYönetim</span>
        </div>

        <div className="relative max-w-lg space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Site ve Apartman Yönetiminde Modern Dönem
          </h2>
          <p className="text-lg text-indigo-100/90 leading-relaxed">
            Aidat takibi, gelir-gider raporları, sayaç okumaları ve sakin ilişkilerini tek bir çatı altında, tamamen dijital ortamda yönetin.
          </p>
        </div>

        <div className="relative text-sm text-indigo-200">
          © {new Date().getFullYear()} SiteYönetim. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md space-y-8 animate-slide-up">
          {/* Logo on Mobile */}
          <div className="flex items-center space-x-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600">
              <Building className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">SiteYönetim</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Giriş Yap
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Yıldız Konakları Sitesi yönetim paneline erişmek için bilgilerinizi girin.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-[var(--text-secondary)]">
                E-posta Adresi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors duration-200"
                  placeholder="isim@siteyonetim.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-[var(--text-secondary)]">
                  Şifre
                </label>
                <a
                  href="#"
                  className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
                >
                  Şifremi Unuttum
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] py-3 pl-10 pr-10 text-sm text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 bg-[var(--bg-secondary)]"
                  defaultChecked
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-[var(--text-secondary)]">
                  Beni Hatırla
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-md hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          {/* Demo Hint */}
          <div className="rounded-xl bg-primary-500/5 border border-primary-500/10 p-4 text-center">
            <span className="text-xs text-[var(--text-secondary)]">
              Demo Giriş Bilgileri:<br />
              <strong className="text-primary-600 dark:text-primary-400">admin@siteyonetim.com</strong> / <strong className="text-primary-600 dark:text-primary-400">demo123</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
