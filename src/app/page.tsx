'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Check, 
  TrendingUp, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { PromotionalModal } from '@/components/landing/PromotionalModal';
import { DashboardPreviewWidget } from '@/components/landing/DashboardPreviewWidget';
import { InteractiveFeatures } from '@/components/landing/InteractiveFeatures';

export default function LandingPage() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* 1. Animated Promotional Pop-Up Modal */}
      <PromotionalModal />

      {/* 2. Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 transition-all shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white font-black shadow-md shadow-indigo-500/20">
                <Building className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                ApartmanYönet
              </span>
            </div>

            {/* Navigation links */}
            <div className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-600">
              <button 
                onClick={() => scrollToSection('hero')} 
                className="hover:text-indigo-600 transition-colors"
              >
                Ana Sayfa
              </button>
              <button 
                onClick={() => scrollToSection('preview')} 
                className="hover:text-indigo-600 transition-colors"
              >
                Canlı Önizleme
              </button>
              <button 
                onClick={() => scrollToSection('features')} 
                className="hover:text-indigo-600 transition-colors"
              >
                Özellikler
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="hover:text-indigo-600 transition-colors"
              >
                Fiyatlandırma
              </button>
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center space-x-3">
              <Link
                href="/giris"
                className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-2 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/yonetici/dashboard"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Demo Paneline Gir</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <header id="hero" className="relative pt-32 pb-20 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-indigo-50/20">
        
        {/* Background Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs font-bold text-indigo-700 shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>2026 Nesil Şeffaf Site ve Rezidans SaaS Platformu</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
                Akıllı Site ve Apartman Yönetimi: <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                  Şeffaf, Kolay, Güvenli
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Aidat takibi, otomatik banka senkronizasyonu, resmi e-Fatura entegrasyonu, arıza/görev yönetimi ve sakin bildirimlerini tek bir dijital merkezden yönetin.
              </p>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => scrollToSection('preview')}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 group"
                >
                  <span>Hemen Keşfet</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  href="/yonetici/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 px-8 py-4 text-sm font-extrabold text-slate-700 hover:text-slate-900 transition-all shadow-sm hover:border-slate-400"
                >
                  <Play className="mr-2 h-4 w-4 text-indigo-600 fill-indigo-600" />
                  Demo Paneline Gir
                </Link>
              </div>

              {/* Key Trust Stats */}
              <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-200 text-center lg:text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">%99.8</div>
                  <div className="text-[11px] text-slate-500 font-semibold">Otomatik Banka Eşleşmesi</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">1,250+</div>
                  <div className="text-[11px] text-slate-500 font-semibold">Aktif Yönetilen Daire</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">₺45M+</div>
                  <div className="text-[11px] text-slate-500 font-semibold">Yıllık İşlenen Aidat Hacmi</div>
                </div>
              </div>

            </div>

            {/* Hero Right: 3D Building Graphics & Floating Glass Metric Badges */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-2xl p-2 group">
                
                {/* Embedded 3D Building Image */}
                <img
                  src="/isometric_building.png"
                  alt="Modern 3D Isometric Property Building"
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                />

                {/* Floating Glassmorphic Badge 1: Live Collection */}
                <div className="absolute top-6 left-6 rounded-2xl bg-white/90 border border-slate-200 backdrop-blur-xl p-3 shadow-xl flex items-center space-x-3 animate-pulse" style={{ animationDuration: '4s' }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">Aylık Tahsilat Hacmi</div>
                    <div className="text-xs font-black text-slate-900">₺1.450.000 +</div>
                  </div>
                </div>

                {/* Floating Glassmorphic Badge 2: Security SSL */}
                <div className="absolute bottom-6 right-6 rounded-2xl bg-white/90 border border-slate-200 backdrop-blur-xl p-3 shadow-xl flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">Resmi GİB Entegrasyonu</div>
                    <div className="text-xs font-black text-slate-900">256-Bit SSL Güvencesi</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 4. Live Interactive Dashboard Preview Section */}
      <section id="preview" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Canlı Sistem Önizlemesi
          </span>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
            Gerçek Yönetim Panelini İnceleyin
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Sistemimizin gerçek **Yönetici Kontrol Paneli** ekranı aşağıda canlı olarak çalışmaktadır.
          </p>
        </div>

        {/* Live Interactive Dashboard Component */}
        <DashboardPreviewWidget />
      </section>

      {/* 5. Interactive Feature Highlights & Aidat Calculator */}
      <InteractiveFeatures />

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            Esnek SaaS Paketleri
          </span>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
            Her Büyüklükteki Apartman ve Site İçin
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            İster 10 dairelik aile apartmanı, ister 1.000 dairelik mega rezidans.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          
          {/* Plan 1: Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all shadow-sm">
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Başlangıç (FREE)</h3>
              <div className="text-3xl font-black text-slate-900">₺0 <span className="text-xs text-slate-500 font-normal">/ sonsuza kadar</span></div>
              <p className="text-xs text-slate-600 font-medium">Küçük tek bloklu apartmanlar için temel yönetim modülü.</p>
              
              <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 20 Daireye Kadar</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Temel Aidat Kayıtları</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Havale/EFT Hesap Bilgileri</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Destek Talebi Paneli</li>
              </ul>
            </div>

            <Link
              href="/yonetici/dashboard"
              className="w-full text-center py-3 px-4 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Ücretsiz Başla
            </Link>
          </div>

          {/* Plan 2: Pro */}
          <div className="rounded-3xl border-2 border-indigo-600 bg-gradient-to-b from-white to-indigo-50/50 p-8 flex flex-col justify-between space-y-6 shadow-2xl relative scale-105">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 rounded-full text-[10px] font-black uppercase text-white tracking-widest shadow">
              En Çok Tercih Edilen
            </span>

            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Profesyonel (PRO)</h3>
              <div className="text-3xl font-black text-slate-900">₺499 <span className="text-xs text-indigo-700 font-semibold">/ ay</span></div>
              <p className="text-xs text-slate-600 font-medium">Çok bloklu siteler için tam kapsamlı finans & operasyon.</p>
              
              <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-indigo-100 font-medium">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 100 Daireye Kadar</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Otomatik Banka Entegrasyonu</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> GİB E-Fatura & Yevmiye Defteri</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Ziyaretçi QR Davet Kodu</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> SMS / WhatsApp Duyuru Motoru</li>
              </ul>
            </div>

            <Link
              href="/yonetici/dashboard"
              className="w-full text-center py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-extrabold text-xs text-white shadow-lg shadow-indigo-500/20 transition-all"
            >
              Demo Paneline Gir
            </Link>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all shadow-sm">
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Kurumsal (ENTERPRISE)</h3>
              <div className="text-3xl font-black text-slate-900">Teklif Alın</div>
              <p className="text-xs text-slate-600 font-medium">Rezidans, AVM ve binlerce dairelik mega toplu yapılar.</p>
              
              <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100 font-medium">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Sınırsız Daire & Blok</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Akıllı Sayaç & IoT Desteği</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Özel API & ERP Entegrasyonu</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 7/24 Özel Müşteri Temsilcisi</li>
              </ul>
            </div>

            <Link
              href="/yonetici/dashboard"
              className="w-full text-center py-3 px-4 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              İletişime Geçin
            </Link>
          </div>

        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-500 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
              <Building className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">ApartmanYönet SaaS Portal</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-600 font-medium">
            <Link href="/yonetici/dashboard" className="hover:text-indigo-600">Kontrol Paneli</Link>
            <Link href="/yonetici/banka-sync" className="hover:text-indigo-600">Banka Sync</Link>
            <Link href="/yonetici/finans-gelismis" className="hover:text-indigo-600">Resmi Muhasebe</Link>
            <Link href="/giris" className="hover:text-indigo-600">Giriş Yap</Link>
          </div>

          <p>© 2026 ApartmanYönet. Tüm hakları saklıdır.</p>
        </div>
      </footer>

    </div>
  );
}
