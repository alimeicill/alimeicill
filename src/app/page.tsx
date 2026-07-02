'use client';

import React from 'react';
import Link from 'next/link';
import { Building, ShieldCheck, Zap, Receipt, Sparkles, PhoneCall, Check, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-between text-[var(--text-primary)]">
      {/* Navbar */}
      <nav className="glass border-b border-[var(--border-color)] sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold">
                <Building className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                ApartmanYönet
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/giris"
                className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
              >
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-20 overflow-hidden text-center max-w-4xl mx-auto px-4 space-y-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl -z-10" />

        <span className="inline-flex items-center space-x-1 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
          <Sparkles className="h-3 w-3 mr-1" />
          Versiyon 1.0 — Tam Kapsamlı SaaS Altyapısı
        </span>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Apartman ve Site Yönetiminde <br />
          <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
            Yeni Nesil Dijital Dönem
          </span>
        </h1>

        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Aidat takibi, otomatik faiz hesaplama, Tiptap dökümanları, akıllı Kanban görev yönetimi ve anlık sakin bildirimlerini tek bir merkezden yönetin.
        </p>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/kayit"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:from-primary-700 hover:to-indigo-800 transition-all"
          >
            Sitenizi Şimdi Kurun
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Özellikleri İncele
          </a>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Tek Bir Çatı Altında Tüm Operasyonlar</h2>
            <p className="text-sm text-[var(--text-secondary)]">Sitenizin operasyonel ve finansal tüm ihtiyaçlarına özel olarak tasarlanmış modüller.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Receipt,
                title: 'Aidat & Finans Takibi',
                desc: 'Otomatik aidat tahakkuku, gecikme faizi işletimi ve banka entegrasyonları ile tahsilat oranlarınızı artırın.',
              },
              {
                icon: Zap,
                title: 'Arıza & Teknik Yönetim',
                desc: 'Kanban tabanlı görev atamaları ile asansör, elektrik, temizlik işlerini takip edin, teknik personele otomatik atayın.',
              },
              {
                icon: ShieldCheck,
                title: 'Güvenlik & Ziyaretçiler',
                desc: 'Ziyaretçiler için QR davetiyeleri, kargo/teslimat takipleri ve giriş-çıkış log kayıtları ile sitenizin güvenliğini artırın.',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="glass border border-[var(--border-color)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 mb-4">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-bold text-lg mb-2">{feat.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Büyüklüğünüze Göre Fiyatlandırma</h2>
          <p className="text-sm text-[var(--text-secondary)]">İster tek bloklu apartman, ister binlerce dairelik devasa siteler.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          {[
            {
              name: 'Ücretsiz Plan (FREE)',
              price: '₺0',
              desc: 'Küçük tek bloklu apartmanlar için temel özellikler.',
              features: ['20 Daireye Kadar', 'Temel Aidat Kayıtları', 'Banka EFT/Havale Bilgileri', 'Destek Talebi Sistemi'],
            },
            {
              name: 'Profesyonel Plan (PRO)',
              price: '₺499 / ay',
              desc: 'Çok bloklu siteler için gelişmiş finans ve operasyon.',
              features: ['100 Daireye Kadar', 'İyzico Sanal POS Entegrasyonu', 'Otomatik Gecikme Faizi', 'Tiptap Editör Belge Paylaşımı', '7/24 Teknik Personel Paneli'],
            },
            {
              name: 'Enterprise Plan',
              price: 'Teklif Alın',
              desc: 'Rezidans, AVM ve karma kullanımlı mega yapılar.',
              features: ['Sınırsız Daire ve Blok', 'Özel API Entegrasyonları', 'Akıllı Sayaç & IoT Desteği', 'OCR Fatura Okuma', 'Özel SLA ve Müşteri Temsilcisi'],
            },
          ].map((plan, idx) => (
            <div key={idx} className={`glass border rounded-3xl p-8 shadow-sm flex flex-col justify-between ${idx === 1 ? 'border-primary-600 ring-2 ring-primary-500/10 scale-105 relative' : 'border-[var(--border-color)]'}`}>
              {idx === 1 && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  En Popüler
                </span>
              )}
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-[var(--text-primary)]">{plan.name}</h4>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{plan.desc}</p>
                <div className="h-px bg-[var(--border-color)] my-4" />
                <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  href="/kayit"
                  className={`flex w-full items-center justify-center rounded-xl py-3 text-xs font-bold shadow-sm transition-all ${
                    idx === 1
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  Hemen Başla
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-[var(--border-color)] py-8 text-center text-xs text-[var(--text-tertiary)]">
        <p>© {new Date().getFullYear()} ApartmanYönet. Tüm hakları saklıdır. Çözüm ortaklığı ve entegrasyonlar için iletişime geçebilirsiniz.</p>
      </footer>
    </div>
  );
}
