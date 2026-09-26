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
import { mockDashboardStats } from '@/lib/mock-data';
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
  const stats = mockDashboardStats;

  // Notes, messages, and summary stats loaded from local storage / service
  const [notes, setNotes] = useState<SiteNote[]>([]);
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SoftwareAnnouncement[]>([]);
  const [shStats, setShStats] = useState<any>(null);

  // Active slide banner index
  const [activeSlide, setActiveSlide] = useState(0);

  const loadData = () => {
    setNotes(SiteHesabimService.getNotes());
    setMessages(SiteHesabimService.getMessages());
    setAnnouncements(SiteHesabimService.getSoftwareAnnouncements());
    setShStats(SiteHesabimService.getSummaryStats());
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

  // Modernized unified data structure for KPI stat cards
  const kpiStats = useMemo(() => {
    return {
      totalProperties: shStats?.tasinmazDurumu?.toplamTasinmaz || 6,
      occupancyRate: 85,
      collectionRate: stats.collectionRate,
      totalCollected: stats.totalRevenue,
      totalOutstanding: stats.totalExpenses,
      debtorCount: shStats?.tasinmazDurumu?.borcluOlan || 13,
      overdueAmount: shStats?.uyeDurumu?.toplamBorc || stats.overdueInvoices * 1250,
      netCash: shStats?.generalDurum?.kasaBakiye || stats.totalRevenue - stats.totalExpenses
    };
  }, [shStats, stats]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs text-slate-800 dark:text-slate-100">
      
      {/* Header title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Kontrol Paneli
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Yıldız Konakları Sitesi — Modern Yönetici Dashboard Ekranı
        </p>
      </div>

      {/* A. 4'lü KPI Grid */}
      <StatCards stats={kpiStats} />

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
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Finansal Özet</h3>
              <FinancialSummaryWidget />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Sayaç Okumaları - Su Tüketimi</h3>
              <MeterChartWidget />
            </div>
          </div>

          {/* Orijinal Faturalar & Görevler Listesi */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Son Faturalar</h3>
              <RecentInvoicesWidget />
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

            {shStats && (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center space-y-1 relative overflow-hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 mx-auto">
                    <Home className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Toplam</span>
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                    {shStats.tasinmazDurumu.toplamTasinmaz}
                  </h4>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center space-y-1 relative overflow-hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 mx-auto">
                    <Key className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Borçlu</span>
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                    {shStats.tasinmazDurumu.borcluOlan}
                  </h4>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center space-y-1 relative overflow-hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 mx-auto">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Alacaklı</span>
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                    {shStats.tasinmazDurumu.alacakliOlan}
                  </h4>
                </div>
              </div>
            )}
          </div>

          {/* Borç / Alacak Dengesi (Genel Durum & Üye Durumu) */}
          <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Borç / Alacak Dengesi
            </h3>

            {shStats && (
              <div className="space-y-4">
                {/* 1. Alacaklar vs Kasa */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Finansal Dağılım</span>
                    <span>%{shStats.generalDurum.alacaklarPct} Alacak / %{shStats.generalDurum.kasaPct} Nakit</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                    <div className="h-full bg-indigo-500" style={{ width: `${shStats.generalDurum.alacaklarPct}%` }} />
                    <div className="h-full bg-emerald-500" style={{ width: `${shStats.generalDurum.kasaPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Toplam Alacak: ₺{shStats.generalDurum.toplamAlacak.toLocaleString()}</span>
                    <span>Kasa: ₺{shStats.generalDurum.kasaBakiye.toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Kalan Borç vs Tahsil Edilen */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Tahsilat Oranı</span>
                    <span>%{shStats.uyeDurumu.tahsilEdilenPct} Tahsil / %{shStats.uyeDurumu.kalanBorcPct} Bekleyen</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${shStats.uyeDurumu.tahsilEdilenPct}%` }} />
                    <div className="h-full bg-rose-500" style={{ width: `${shStats.uyeDurumu.kalanBorcPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Tahsilat: ₺{shStats.uyeDurumu.tahsilEdilen.toLocaleString()}</span>
                    <span>Geciken Borç: ₺{shStats.uyeDurumu.toplamBorc.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Doluluk Oranı Chart */}
          <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Doluluk Analizi</h3>
            <OccupancyWidget />
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
