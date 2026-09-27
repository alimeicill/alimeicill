'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Send, 
  Search, 
  TrendingUp, 
  Users, 
  Sparkles,
  BarChart3,
  Check,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export function DashboardPreviewWidget() {
  const [activeTab, setActiveTab] = useState<'chart' | 'dues' | 'tickets'>('chart');
  
  // Dynamic state for live preview interactive actions
  const [collectedAmount, setCollectedAmount] = useState(148500);
  const [pendingAmount, setPendingAmount] = useState(24500);
  const [collectionRate, setCollectionRate] = useState(85.8);
  const [apartmentList, setApartmentList] = useState([
    { id: 'd1', door: 'A-Blok No: 4', owner: 'Ahmet Yılmaz', dues: 2500, status: 'PAID', date: '2026-06-01' },
    { id: 'd2', door: 'A-Blok No: 12', owner: 'Ayşe Kaya', dues: 2500, status: 'UNPAID', date: 'Gecikmede' },
    { id: 'd3', door: 'B-Blok No: 2', owner: 'Mehmet Demir', dues: 3000, status: 'PAID', date: '2026-06-02' },
    { id: 'd4', door: 'B-Blok No: 8', owner: 'Fatma Şahin', dues: 2500, status: 'UNPAID', date: 'Gecikmede' },
    { id: 'd5', door: 'C-Blok No: 1', owner: 'Can Öztürk', dues: 2800, status: 'PAID', date: '2026-06-03' }
  ]);

  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'Asansör Periyodik Bakımı', time: 'Bugün 14:00', author: 'Yönetim' },
    { id: 2, title: 'Yazlık Havuz Temizliği ve İlaçlama', time: 'Dün', author: 'Teknik Ekip' }
  ]);

  // Modal states inside preview
  const [showAddDuesModal, setShowAddDuesModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');

  // Collect payment live action
  const handleCollectDues = (id: string, amount: number) => {
    setApartmentList(prev => prev.map(item => item.id === id ? { ...item, status: 'PAID', date: 'Bugün' } : item));
    setCollectedAmount(prev => prev + amount);
    setPendingAmount(prev => Math.max(0, prev - amount));
    setCollectionRate(prev => Math.min(100, Number((prev + 1.8).toFixed(1))));
    toast.success('Daire aidat tahsilatı simüle edildi! Bakiye ve grafik anlık güncellendi.');
  };

  // Add Announcement live action
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementTitle.trim()) return;
    setAnnouncements(prev => [
      { id: Date.now(), title: newAnnouncementTitle.trim(), time: 'Şimdi', author: 'Site Yöneticisi' },
      ...prev
    ]);
    setNewAnnouncementTitle('');
    setShowAnnouncementModal(false);
    toast.success('Yeni duyuru tüm sakinlerin ekranına anında iletildi!');
  };

  return (
    <div className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 text-white shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Top Header of Interactive Preview */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/60 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-3 w-3 rounded-full bg-red-500/80" />
          <div className="flex h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="flex h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-400">site-yonetim-portal.demo</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Canlı İnteraktif Simülasyon
          </span>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="p-6 space-y-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-all hover:border-indigo-500/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Toplam Kasa Bakiyesi</span>
              <Wallet className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-white">
              {formatCurrency(collectedAmount)}
            </div>
            <div className="flex items-center text-[10px] text-emerald-400 mt-1 font-semibold">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> %14.2 geçen aya göre artış
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-all hover:border-purple-500/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Tahsilat Başarı Oranı</span>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-white">
              %{collectionRate}
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500" 
                style={{ width: `${collectionRate}%` }} 
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-all hover:border-amber-500/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Bekleyen Aidat Tutarı</span>
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300">
              {formatCurrency(pendingAmount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              2 Daire gecikmede
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 transition-all hover:border-emerald-500/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Hızlı İşlem Araçları</span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-1.5 px-2 text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1"
              >
                <Plus className="h-3 w-3" /> Duyuru
              </button>
            </div>
          </div>
        </div>

        {/* Tab Header & Action Modals Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'chart' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Finansal Grafik & Trend
            </button>
            <button
              onClick={() => setActiveTab('dues')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'dues' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daire Aidat Listesi
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Tıklayarak canlı simüle edebilirsiniz
          </div>
        </div>

        {/* Tab Content 1: Financial Chart & Announcements */}
        {activeTab === 'chart' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* SVG Visual Bar Chart */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Aylık Gelir & Gider Dağılımı (2026)
                </h4>
                <div className="flex items-center space-x-3 text-[10px]">
                  <span className="flex items-center gap-1 text-indigo-400 font-bold">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" /> Gelir (Aidat)
                  </span>
                  <span className="flex items-center gap-1 text-purple-400 font-bold">
                    <span className="h-2 w-2 rounded-full bg-purple-500" /> Gider (Fatura/Bakım)
                  </span>
                </div>
              </div>

              {/* Visual Bar Columns */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
                {[
                  { month: 'Ocak', in: 80, out: 45 },
                  { month: 'Şubat', in: 88, out: 52 },
                  { month: 'Mart', in: 92, out: 60 },
                  { month: 'Nisan', in: 85, out: 40 },
                  { month: 'Mayıs', in: 95, out: 58 },
                  { month: 'Haziran', in: 100, out: 42 }
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      <div 
                        className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${item.in}%` }}
                      />
                      <div 
                        className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${item.out}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Announcements Preview Panel */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-indigo-400" />
                  Sakin Bildirim Akışı
                </h4>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  + Yeni Ekle
                </button>
              </div>

              <div className="space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-200">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{item.author} • {item.time}</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Dues Table with Live Collection Button */}
        {activeTab === 'dues' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300">Haziran 2026 Daire Aidat Durumları</h4>
              <span className="text-[11px] text-slate-400">Tek tıkla simüle edin</span>
            </div>
            
            <div className="divide-y divide-slate-800/60 text-xs">
              {apartmentList.map((apt) => (
                <div key={apt.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 font-bold text-indigo-400">
                      {apt.door.split(':')[1]?.trim() || apt.door}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{apt.owner}</p>
                      <p className="text-[10px] text-slate-400">{apt.door}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-slate-200">{formatCurrency(apt.dues)}</span>
                    
                    {apt.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Ödendi ({apt.date})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCollectDues(apt.id, apt.dues)}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 px-3 py-1 text-[10px] font-bold text-white shadow-sm transition-all"
                      >
                        Tahsil Et (Simüle Et)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Internal Modal for Announcement Creation */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Yeni Duyuru Simülasyonu</h3>
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <input
                type="text"
                placeholder="Duyuru Başlığı (Örn: Bahçe Bakımı)"
                value={newAnnouncementTitle}
                onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow"
                >
                  Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
