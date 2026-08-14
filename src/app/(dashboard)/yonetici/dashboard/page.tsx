'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
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
  TrendingUp, TrendingDown, Percent, AlertTriangle,
  Search, Plus, Mail, Eye, 
  Home, Key, FileText, Calendar, X, Trash2, ChevronRight, Sparkles
} from 'lucide-react';
import { 
  SiteHesabimService, 
  SiteNote, 
  SiteMessage, 
  SoftwareAnnouncement 
} from '@/lib/services/site-hesabim-service';

export default function YoneticiDashboardPage() {
  const stats = mockDashboardStats;

  // Notes & Messages states from Service
  const [notes, setNotes] = useState<SiteNote[]>([]);
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SoftwareAnnouncement[]>([]);
  const [shStats, setShStats] = useState<any>(null);

  // UI states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noteSearch, setNoteSearch] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Modals
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SiteMessage | null>(null);

  // New Note Form States
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);

  // Load Initial Data
  const loadDashboardData = () => {
    setNotes(SiteHesabimService.getNotes());
    setMessages(SiteHesabimService.getMessages());
    setAnnouncements(SiteHesabimService.getSoftwareAnnouncements());
    setShStats(SiteHesabimService.getSummaryStats());
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-advance banner slide
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Notes based on Selected Date & Search Term
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesDate = note.date === selectedDate;
      const matchesSearch = note.title.toLowerCase().includes(noteSearch.toLowerCase()) || 
                            note.content.toLowerCase().includes(noteSearch.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [notes, selectedDate, noteSearch]);

  // Add Note Handler
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) {
      toast.error('Lütfen not başlığı giriniz.');
      return;
    }
    
    SiteHesabimService.addNote(newNoteTitle, newNoteContent, newNoteDate);
    toast.success('Not başarıyla kaydedildi.');
    loadDashboardData();
    setShowNoteModal(false);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  // Delete Note Handler
  const handleDeleteNote = (id: string) => {
    SiteHesabimService.deleteNote(id);
    toast.success('Not silindi.');
    loadDashboardData();
  };

  // Open Message Detail Modal
  const handleOpenMessage = (msg: SiteMessage) => {
    setSelectedMessage(msg);
    setShowMsgModal(true);
    const updated = SiteHesabimService.markMessageRead(msg.id);
    setMessages(updated);
  };

  // Simulate Sending Email
  const handleSimulateEmail = (sender: string) => {
    toast.success(`${sender} adresine bilgilendirme e-postası gönderildi.`);
  };

  // Mini Calendar Generator for Current Month
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = endOfMonth.getDate();
    const startDay = startOfMonth.getDay();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Spacer days from previous month
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthEnd - i;
      const mStr = String(month === 0 ? 12 : month).padStart(2, '0');
      const yStr = month === 0 ? year - 1 : year;
      days.push({
        dateStr: `${yStr}-${mStr}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false
      });
    }

    // Current Month days
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      days.push({
        dateStr: `${year}-${mStr}-${String(i).padStart(2, '0')}`,
        dayNum: i,
        isCurrentMonth: true
      });
    }

    return days;
  }, []);

  return (
    <div className="space-y-8 animate-fade-in text-xs text-gray-800 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Kontrol Paneli
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Yıldız Konakları Sitesi — Yönetici Genel Bakış
          </p>
        </div>
      </div>

      {/* 4 Original Stats Cards styled modernly */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Bu yılki toplam aidat ve diğer gelirler"
          icon={TrendingUp}
          trend="up"
          trendValue="%12.5 artış"
          color="green"
        />
        <StatCard
          title="Toplam Gider"
          value={formatCurrency(stats.totalExpenses)}
          subtitle="Bu yılki toplam fatura ve bakım giderleri"
          icon={TrendingDown}
          trend="down"
          trendValue="%4.2 düşüş"
          color="red"
        />
        <StatCard
          title="Tahsilat Oranı"
          value={`%${stats.collectionRate}`}
          subtitle="Faturaların ödenme oranı"
          icon={Percent}
          trend="up"
          trendValue="%3.1 artış"
          color="blue"
        />
        <StatCard
          title="Gecikmiş Faturalar"
          value={stats.overdueInvoices}
          subtitle="Ödeme tarihi geçmiş fatura sayısı"
          icon={AlertTriangle}
          trend="up"
          trendValue="+2 yeni"
          color="amber"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column (3/4 width) - Contains charts and widgets */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Banner Slider */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm h-36 bg-[#E31B23] text-white flex items-center justify-between p-6">
            <div className="space-y-1.5 max-w-[75%]">
              <span className="inline-block text-[9px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">SİSTEM DUYURUSU</span>
              {activeSlide === 0 ? (
                <h2 className="text-sm sm:text-base font-extrabold transition-all duration-300">
                  Site ve Apartman Yönetimleri için büyük kolaylık: Banka Entegrasyonu!
                </h2>
              ) : (
                <h2 className="text-sm sm:text-base font-extrabold transition-all duration-300">
                  Süzme sayaç okumaları, ortak alan paylaşımları ve gelişmiş borçlandırma artık yayında!
                </h2>
              )}
              <p className="text-[10px] text-white/80">Kredi kartı, banka havalesi ve otomatik ödeme entegrasyonlarını tanımlayın.</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-center shrink-0">
              <Sparkles className="h-10 w-10 text-white animate-pulse" />
            </div>
            {/* Slider Dots */}
            <div className="absolute bottom-2 left-6 flex items-center space-x-1.5">
              <button onClick={() => setActiveSlide(0)} className={`h-1.5 w-1.5 rounded-full ${activeSlide === 0 ? 'bg-white' : 'bg-white/40'}`} />
              <button onClick={() => setActiveSlide(1)} className={`h-1.5 w-1.5 rounded-full ${activeSlide === 1 ? 'bg-white' : 'bg-white/40'}`} />
            </div>
          </div>

          {/* Notes & Interactive Calendar Widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes List */}
            <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between min-h-[350px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Kayıtlı Notlar ({filteredNotes.length})</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={noteSearch}
                        onChange={(e) => setNoteSearch(e.target.value)}
                        className="pl-7 pr-2.5 py-1 text-[11px] rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none w-24 focus:w-36 transition-all"
                      />
                    </div>
                    <button 
                      onClick={() => setShowNoteModal(true)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 shadow-sm transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {filteredNotes.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400 italic">
                      {selectedDate} tarihine ait not bulunamadı. Yeni bir not ekleyebilirsiniz.
                    </div>
                  ) : (
                    filteredNotes.map(note => (
                      <div key={note.id} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200/50 dark:border-slate-700 flex items-start justify-between gap-2 group shadow-sm">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-tight">{note.title}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-normal">{note.content}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="text-[10px] text-gray-400 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 pt-2 flex items-center justify-between">
                <span>Seçili Gün: <strong>{selectedDate}</strong></span>
                <span>Toplam not: {notes.length}</span>
              </div>
            </div>

            {/* Calendar Agenda */}
            <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Ajanda & Takvim</h3>
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                    {new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Pz</span><span>Pt</span><span>Sa</span><span>Ça</span><span>Pe</span><span>Cu</span><span>Ct</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((day, idx) => {
                    const noteCount = notes.filter(n => n.date === day.dateStr).length;
                    const isSelected = selectedDate === day.dateStr;
                    const isToday = new Date().toISOString().split('T')[0] === day.dateStr;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day.dateStr)}
                        className={`relative h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-[#E31B23] text-white shadow-md shadow-[#E31B23]/25 scale-105' 
                            : isToday 
                              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-[#E31B23] border border-[#E31B23]/30'
                              : day.isCurrentMonth
                                ? 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200'
                                : 'text-gray-300 dark:text-slate-600'
                        }`}
                      >
                        <span>{day.dayNum}</span>
                        {noteCount > 0 && (
                          <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-[#E31B23]'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-[10px] text-gray-400 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <span>Mevcut Ay</span>
                <span>Filtrelemek için tıklayın</span>
              </div>
            </div>
          </div>

          {/* Original Widgets: FinancialSummary & MeterChart Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm bg-white dark:bg-slate-800">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Finansal Özet</h3>
              <FinancialSummaryWidget />
            </div>

            <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm bg-white dark:bg-slate-800">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Sayaç Okumaları - Su Tüketimi</h3>
              <MeterChartWidget />
            </div>
          </div>

          {/* Original Widgets: RecentInvoices & TaskList Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm bg-white dark:bg-slate-800">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Son Faturalar</h3>
              <RecentInvoicesWidget />
            </div>

            <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm bg-white dark:bg-slate-800">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Açık Görevler</h3>
              <TaskListWidget />
            </div>
          </div>

          {/* Sakin Mesajları DataTable */}
          <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Sakin Mesajları ({messages.filter(m => !m.read).length} Okunmamış)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Gönderen Sakin</th>
                    <th className="p-3">Konu Başlığı</th>
                    <th className="p-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/70 text-gray-700 dark:text-slate-300">
                  {messages.map(msg => (
                    <tr 
                      key={msg.id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-all ${
                        !msg.read ? 'font-bold text-gray-900 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      <td className="p-3 font-mono text-[10px] text-gray-400">{msg.date}</td>
                      <td className="p-3 flex items-center gap-1.5">
                        {!msg.read && <span className="h-1.5 w-1.5 rounded-full bg-[#E31B23]" />}
                        {msg.sender}
                      </td>
                      <td className="p-3">{msg.subject}</td>
                      <td className="p-3 text-right space-x-1.5">
                        <button 
                          onClick={() => handleSimulateEmail(msg.sender)}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600 transition-colors inline-flex"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleOpenMessage(msg)}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-indigo-50 hover:border-indigo-200 text-indigo-600 transition-colors inline-flex"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (1/4 width) - Summary Cards and Small Widgets */}
        <div className="space-y-6">
          
          {/* Genel Durum Card */}
          <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Genel Durum</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">%100 Borç/Alacak Genel Dağılımı</p>
            </div>

            {shStats && (
              <div className="space-y-3">
                <div className="w-full h-3 rounded-full bg-amber-500 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${shStats.generalDurum.alacaklarPct}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${shStats.generalDurum.kasaPct}%` }} />
                </div>

                <div className="grid grid-cols-2 text-center text-xs">
                  <div className="space-y-0.5 border-r border-gray-100 dark:border-slate-700">
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      %{shStats.generalDurum.alacaklarPct} Alacaklar
                    </span>
                    <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{shStats.generalDurum.toplamAlacak.toLocaleString('tr-TR')}</strong>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-amber-500 font-bold flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      %{shStats.generalDurum.kasaPct} Kasalar
                    </span>
                    <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{shStats.generalDurum.kasaBakiye.toLocaleString('tr-TR')}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Taşınmaz Durumu stats cards */}
          {shStats && (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-[var(--border-color)] shadow-sm text-center space-y-1 relative overflow-hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 mx-auto">
                  <Home className="h-4 w-4" />
                </span>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Toplam</span>
                <h4 className="text-base font-extrabold text-gray-800 dark:text-slate-200 leading-none">{shStats.tasinmazDurumu.toplamTasinmaz}</h4>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-[var(--border-color)] shadow-sm text-center space-y-1 relative overflow-hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-[#E31B23] mx-auto">
                  <Key className="h-4 w-4" />
                </span>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Borçlu</span>
                <h4 className="text-base font-extrabold text-gray-800 dark:text-slate-200 leading-none">{shStats.tasinmazDurumu.borcluOlan}</h4>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-[var(--border-color)] shadow-sm text-center space-y-1 relative overflow-hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 mx-auto">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="text-[9px] uppercase font-bold text-gray-400 block">Alacaklı</span>
                <h4 className="text-base font-extrabold text-gray-800 dark:text-slate-200 leading-none">{shStats.tasinmazDurumu.alacakliOlan}</h4>
              </div>
            </div>
          )}

          {/* Üye Durumu Card */}
          <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Üye Durumu</h3>
              <p className="text-[10px] text-[#E31B23] font-bold mt-0.5">13 Borçlu Üye Kayıtlı</p>
            </div>

            {shStats && (
              <div className="space-y-3">
                <div className="w-full h-3 rounded-full bg-emerald-500 overflow-hidden flex">
                  <div className="h-full bg-rose-500" style={{ width: `${shStats.uyeDurumu.kalanBorcPct}%` }} />
                  <div className="h-full bg-emerald-500" style={{ width: `${shStats.uyeDurumu.tahsilEdilenPct}%` }} />
                </div>

                <div className="grid grid-cols-2 text-center text-xs">
                  <div className="space-y-0.5 border-r border-gray-100 dark:border-slate-700">
                    <span className="text-[10px] text-[#E31B23] font-bold flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E31B23]" />
                      %{shStats.uyeDurumu.kalanBorcPct} Kalan Borç
                    </span>
                    <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{shStats.uyeDurumu.toplamBorc.toLocaleString('tr-TR')}</strong>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      %{shStats.uyeDurumu.tahsilEdilenPct} Tahsilat
                    </span>
                    <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{shStats.uyeDurumu.tahsilEdilen.toLocaleString('tr-TR')}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Original Occupancy donut widget */}
          <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Doluluk Oranı</h3>
            <OccupancyWidget />
          </div>

          {/* Original Announcements widget */}
          <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Son Duyurular</h3>
            <AnnouncementsWidget />
          </div>

          {/* Software announcements list */}
          <div className="glass rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Program Duyuruları</h3>
              <button 
                onClick={() => toast.info('Tüm sistem duyuruları listeleniyor...')}
                className="text-[10px] text-gray-400 hover:text-indigo-500 font-bold flex items-center gap-0.5"
              >
                Tümünü Gör <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="space-y-1 text-xs">
                  <p className="font-semibold text-gray-700 dark:text-slate-300 leading-snug hover:text-[#E31B23] transition-colors cursor-pointer">
                    {ann.title}
                  </p>
                  <span className="block text-[10px] font-mono text-gray-400">{ann.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Note modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#E31B23]" />
                Ajandaya Yeni Not Ekle
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="rounded-lg p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddNoteSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Not Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Asansör Bakımı"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3.5 py-2 text-xs text-gray-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Açıklama</label>
                <textarea
                  rows={3}
                  placeholder="Not detaylarını yazınız..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3.5 py-2 text-xs text-gray-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Tarih</label>
                <input
                  type="date"
                  required
                  value={newNoteDate}
                  onChange={(e) => setNewNoteDate(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3.5 py-2 text-xs text-gray-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#E31B23] hover:bg-[#c9181e] text-white px-4 py-2 text-xs font-semibold shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message modal */}
      {showMsgModal && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">
                Sakin Mesaj Detayı
              </h3>
              <button onClick={() => setShowMsgModal(false)} className="rounded-lg p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-gray-100 dark:border-slate-700 pb-3 text-[10px] text-gray-400">
                <div>
                  <span className="font-bold block uppercase">Gönderen:</span>
                  <span className="text-gray-700 dark:text-slate-300 font-semibold">{selectedMessage.sender}</span>
                </div>
                <div>
                  <span className="font-bold block uppercase">Tarih:</span>
                  <span className="text-gray-700 dark:text-slate-300 font-semibold">{selectedMessage.date}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-[10px] text-gray-400 uppercase">Konu:</span>
                <p className="text-sm font-extrabold text-gray-800 dark:text-slate-100">{selectedMessage.subject}</p>
              </div>

              <div className="space-y-1 bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                <span className="font-bold text-[10px] text-gray-400 uppercase">Mesaj:</span>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-medium mt-1">{selectedMessage.content}</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  onClick={() => handleSimulateEmail(selectedMessage.sender)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-sm"
                >
                  E-posta Gönder
                </button>
                <button
                  type="button"
                  onClick={() => setShowMsgModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
