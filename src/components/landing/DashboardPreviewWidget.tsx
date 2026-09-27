'use client';

import React from 'react';
import Link from 'next/link';
import YoneticiDashboardPage from '@/app/(dashboard)/yonetici/dashboard/page';
import { ExternalLink, Sparkles, Building2, LayoutDashboard, Wallet, Building, Users, Landmark, FileText, Settings } from 'lucide-react';

export function DashboardPreviewWidget() {
  return (
    <div className="w-full rounded-3xl border border-slate-200/90 bg-white text-slate-900 shadow-2xl overflow-hidden">
      
      {/* Top Browser Header Mockup Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-100/80 px-6 py-3.5">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            https://site-yonetim.com/yonetici/dashboard
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Canlı Sistem Önizlemesi
          </span>

          <Link
            href="/yonetici/dashboard"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all"
          >
            <span>Tam Ekran Aç</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Embedded Dashboard Container with Interactive Sidebar Mockup */}
      <div className="flex h-[720px] overflow-hidden bg-slate-50">
        
        {/* Left Mini Sidebar Preview */}
        <aside className="w-56 shrink-0 bg-white border-r border-slate-200 p-4 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm text-indigo-900">ApartmanYönet</span>
            </div>

            <nav className="space-y-1">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs">
                <LayoutDashboard className="h-4 w-4" /> Kontrol Paneli
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium">
                <Building className="h-4 w-4" /> Daireler
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium">
                <Users className="h-4 w-4" /> Sakinler
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium">
                <Landmark className="h-4 w-4" /> Finansal İşlemler
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium">
                <FileText className="h-4 w-4" /> Duyurular
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium">
                <Settings className="h-4 w-4" /> Ayarlar
              </div>
            </nav>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Yıldız Konakları</p>
            <p>Sistem Yöneticisi Paneli</p>
          </div>
        </aside>

        {/* Main Dashboard Interactive Area (Actual Dashboard Component) */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <YoneticiDashboardPage />
        </main>
      </div>
    </div>
  );
}
