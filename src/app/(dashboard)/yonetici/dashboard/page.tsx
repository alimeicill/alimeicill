'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StatCards } from '@/components/dashboard/StatCards';
import { NotesCalendar } from '@/components/dashboard/NotesCalendar';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { FinancialSummaryWidget } from '@/components/dashboard/FinancialSummaryWidget';
import { RecentInvoicesWidget } from '@/components/dashboard/RecentInvoicesWidget';
import { TaskListWidget } from '@/components/dashboard/TaskListWidget';
import { AnnouncementsWidget } from '@/components/dashboard/AnnouncementsWidget';
import { OccupancyWidget } from '@/components/dashboard/OccupancyWidget';
import { MeterChartWidget } from '@/components/dashboard/MeterChartWidget';
import { useQuery } from '@tanstack/react-query';
import type { ManagerDashboard } from '@/lib/server/dashboard';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Sparkles, Home, Key, FileText, ChevronRight, ArrowRight 
} from 'lucide-react';
import { 
  SiteHesabimService, 
  SiteNote, 
  SiteMessage, 
  SoftwareAnnouncement 
} from '@/lib/services/site-hesabim-service';
import { HeroCarouselBanner } from '@/components/dashboard/HeroCarouselBanner';
import Link from 'next/link';

export default function YoneticiDashboardPage() {
  // Rakamlar veritabanından (doluluk, tahsilat, borç, kasa, gelir-gider).
  const { data: pano, error: panoError } = useQuery<ManagerDashboard>({
    queryKey: ['manager-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/yonetici/pano');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Pano verileri yüklenemedi.');
      return body;
    },
  });

  // Notes, messages, and summary stats loaded from local storage / service
  const [notes, setNotes] = useState<SiteNote[]>([]);
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SoftwareAnnouncement[]>([]);

  // Active slide banner index
  const [activeSlide, setActiveSlide] = useState(0);

  const loadData = () => {
    setNotes(SiteHesabimService.getNotes());
    setMessages(SiteHesabimService.getMessages());
    setAnnouncements(SiteHesabimService.getSoftwareAnnouncements());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handlers passed to modular components
  const handleAddNote = (title: string, content: string, date: string) => {
    SiteHesabimService.addNote(title, content, date);
    loadData();
  };

  const handleDeleteNote = (id: string) => {
    SiteHesabimService.deleteNote(id);
    loadData();
  };

  const handleMarkMessageRead = (id: string) => {
    const updated = SiteHesabimService.markMessageRead(id);
    setMessages(updated);
  };

  const kpiStats = useMemo(() => {
    if (!pano) return null;
    return {
      totalProperties: pano.units.total,
      occupancyRate: pano.units.occupancyRate,
      monthCollected: pano.dues.monthCollected,
      monthAccrued: pano.dues.monthAccrued,
      collectionRate: pano.dues.monthCollectionRate,
      totalOutstanding: pano.dues.outstanding,
      debtorCount: pano.dues.debtorUnits,
      overdueAmount: pano.dues.overdue,
      netCash: pano.cash.total,
      cash: pano.cash.cash,
      bank: pano.cash.bank,
    };
  }, [pano]);

  // Borç / varlık dengesi: açık üye borcu ile kasa + banka toplamının oranı.
  const balance = useMemo(() => {
    if (!pano) return null;
    const receivable = pano.dues.outstanding;
    const cash = Math.max(pano.cash.total, 0);
    const whole = receivable + cash;
    const receivablePct = whole > 0 ? Math.round((receivable / whole) * 100) : 0;
    return { receivable, receivablePct, cashPct: whole > 0 ? 100 - receivablePct : 0 };
  }, [pano]);

  const pending = pano && pano.dues.monthAccrued > 0 ? 100 - pano.dues.monthCollectionRate : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs text-slate-800 dark:text-slate-100">
      
      {/* Header title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Kontrol Paneli
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {pano?.siteName ? `${pano.siteName} — güncel durum` : 'Güncel durum'}
        </p>
      </div>

      {/* A. 4'lü KPI Grid */}
      {panoError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600">{(panoError as Error).message}</div>
      )}
      {kpiStats ? <StatCards stats={kpiStats} /> : <div className="h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}

      {/* Main Grid: Sol Kolon (8) & Sağ Kolon (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Hareketli & Dinamik Hızlı İşlemler Banner Slider */}
          <HeroCarouselBanner />

          {/* Interactive Calendar & Notes */}
          <NotesCalendar 
            notes={notes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />

          {/* Orijinal Finansal Grafik & Sayaç Grafiği */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Gelir / Gider (Son 6 Ay)</h3>
              {pano && <FinancialSummaryWidget data={pano.monthly} />}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Sayaç Okumaları - Su Tüketimi</h3>
              <MeterChartWidget />
            </div>
          </div>

          {/* Orijinal Faturalar & Görevler Listesi */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Son Tahsilatlar</h3>
              {pano && <RecentInvoicesWidget payments={pano.recentPayments} />}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Açık Görevler</h3>
              <TaskListWidget />
            </div>
          </div>

          {/* Messages Table */}
          <RecentMessages 
            messages={messages}
            onMarkRead={handleMarkMessageRead}
          />

        </div>

        {/* Right Column (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Taşınmaz Durumu Kartı */}
          <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Taşınmaz Durumu
            </h3>

            {pano && (
              <div className="grid grid-cols-3 gap-2.5">
                <PropertyTile icon={<Home className="h-4 w-4" />} tone="indigo" label="Toplam" value={pano.units.total} />
                <PropertyTile icon={<Key className="h-4 w-4" />} tone="rose" label="Borçlu" value={pano.dues.debtorUnits} />
                <PropertyTile icon={<FileText className="h-4 w-4" />} tone="emerald" label="Boş" value={pano.units.empty} />
              </div>
            )}
          </div>

          {/* Borç / Alacak Dengesi (Genel Durum & Üye Durumu) */}
          <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Borç / Alacak Dengesi
            </h3>

            {pano && balance && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Alacak / Nakit</span>
                    <span>%{balance.receivablePct} Alacak / %{balance.cashPct} Nakit</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                    <div className="h-full bg-indigo-500" style={{ width: `${balance.receivablePct}%` }} />
                    <div className="h-full bg-emerald-500" style={{ width: `${balance.cashPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Üye alacağı: {formatCurrency(balance.receivable)}</span>
                    <span>Kasa + banka: {formatCurrency(pano.cash.total)}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Bu ayın tahsilatı</span>
                    <span>%{pano.dues.monthCollectionRate} tahsil / %{pending} bekleyen</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${pano.dues.monthCollectionRate}%` }} />
                    <div className="h-full bg-rose-500" style={{ width: `${pending}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Tahsil: {formatCurrency(pano.dues.monthCollected)}</span>
                    <span>Gecikmiş borç: {formatCurrency(pano.dues.overdue)}</span>
                  </div>
                </div>

                <Link href="/yonetici/kasa-banka" className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600">
                  Kasa & Banka <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Doluluk Oranı Chart */}
          <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Doluluk Analizi</h3>
            {pano && <OccupancyWidget units={pano.units} />}
          </div>

          {/* Sistem Duyuruları */}
          <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Sistem Duyuruları
              </h3>
              <button 
                onClick={() => toast.info('Tüm duyurular listeleniyor...')}
                className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold flex items-center gap-0.5"
              >
                Tümünü Gör <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                    {ann.title}
                  </p>
                  <span className="block text-[9px] font-mono text-slate-400">{ann.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Orijinal Son Duyurular */}
          <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Son Duyurular</h3>
            <AnnouncementsWidget />
          </div>

        </div>
      </div>

    </div>
  );
}

function PropertyTile({ icon, tone, label, value }: { icon: React.ReactNode; tone: 'indigo' | 'rose' | 'emerald'; label: string; value: number }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
  };
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center space-y-1 relative overflow-hidden">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg mx-auto ${tones[tone]}`}>{icon}</span>
      <span className="text-[9px] uppercase font-bold text-slate-400 block">{label}</span>
      <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-none">{value}</h4>
    </div>
  );
}
