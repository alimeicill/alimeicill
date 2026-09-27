'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  Landmark, 
  ListTodo, 
  MessageSquare, 
  Calculator, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function InteractiveFeatures() {
  // Calculator state
  const [apartmentCount, setApartmentCount] = useState(48);
  const [monthlyDues, setMonthlyDues] = useState(2500);

  const annualCollection = apartmentCount * monthlyDues * 12;
  const timeSavedHours = Math.round(apartmentCount * 0.75);

  return (
    <section id="features" className="py-24 bg-slate-100/70 text-slate-900 relative overflow-hidden border-y border-slate-200">
      {/* Glow ambient background */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Modern SaaS Özellik Modülleri
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
            Apartman ve Siteniz İçin <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              Eksiksiz 4 Temel Güç Modülü
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Klasik karmaşık yönetim programları yerine şeffaf, otomatik ve 2026 modern FinTech standartlarında geliştirildi.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Feature 1: Dues Tracking */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 shadow-sm group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Otomatik Aidat & Borçlandırma</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Her ayın 1'inde otomatik Cron Job ile borçlandırma, gecikme faizi hesaplama ve SMS hatırlatma.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-indigo-700 flex items-center font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> %99.8 Tahsilat başarısı
            </div>
          </div>

          {/* Feature 2: Income / Expense */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:border-purple-500/50 hover:shadow-xl transition-all duration-300 shadow-sm group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:scale-110 transition-transform">
              <Landmark className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Şeffaf Gelir / Gider & Muhasebe</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              GİB e-Fatura entegrasyonu, KDV hesaplayıcı, Yevmiye fişleri ve banka hesap hareketleri otomatik senkronizasyon.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-purple-700 flex items-center font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Tek Düzen Muhasebe
            </div>
          </div>

          {/* Feature 3: Maintenance / Tickets */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 shadow-sm group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-110 transition-transform">
              <ListTodo className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Arıza & Teknik İş Emirleri</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Sakinlerin bildirdiği arızaları teknik personele Kanban görev panosu üzerinden atayın ve anlık takip edin.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 flex items-center font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Kanban Görev Panosu
            </div>
          </div>

          {/* Feature 4: Resident Announcements & QR */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 shadow-sm group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Anlık Duyuru & Ziyaretçi QR</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Toplu SMS / WhatsApp duyuruları ve sakinlerin misafirleri için ürettiği dinamik QR giriş kodları.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-700 flex items-center font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Ziyaretçi QR Kodu
            </div>
          </div>

        </div>

        {/* Interactive Calculator Banner Widget */}
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-white via-indigo-50/50 to-purple-50/50 p-6 sm:p-10 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                <Calculator className="h-4 w-4" /> İnteraktif Zaman & Verim Hesaplayıcı
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                Sitenizin Yıllık Aidat Hacmini ve Kazancını Hesaplayın
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Sürgüleri kaydırarak sitenize özel yıllık tahsilat hacmini ve sistemin size kazandıracağı zamanı görün.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 min-w-[280px] space-y-3 text-center shadow-md">
              <span className="text-xs font-semibold text-slate-500">Yıllık İşlenen Aidat Hacmi</span>
              <div className="text-3xl font-black text-emerald-600">
                {formatCurrency(annualCollection)}
              </div>
              <div className="text-xs text-indigo-700 font-bold">
                ⚡ Ayda ortalama <span className="text-slate-900 underline">{timeSavedHours} saat</span> zaman tasarrufu
              </div>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
            {/* Slider 1: Apartment Count */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Toplam Daire Sayısı</span>
                <span className="text-indigo-600">{apartmentCount} Daire</span>
              </div>
              <input 
                type="range"
                min="10"
                max="250"
                step="2"
                value={apartmentCount}
                onChange={(e) => setApartmentCount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Slider 2: Monthly Dues */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Ortalama Aylık Aidat</span>
                <span className="text-purple-600">{formatCurrency(monthlyDues)}</span>
              </div>
              <input 
                type="range"
                min="500"
                max="10000"
                step="250"
                value={monthlyDues}
                onChange={(e) => setMonthlyDues(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
