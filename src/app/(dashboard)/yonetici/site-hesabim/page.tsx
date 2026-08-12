'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Bell, Sun, Moon, Globe, ChevronDown, 
  Sparkles, Calendar, Plus, Mail, Eye, 
  Home, Key, FileText, CheckCircle2, ChevronRight, X, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SiteHesabimService, 
  SiteNote, 
  SiteMessage, 
  SoftwareAnnouncement 
} from '@/lib/services/site-hesabim-service';

export default function SiteHesabimDashboard() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Data States
  const [notes, setNotes] = useState<SiteNote[]>([]);
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [announcements, setAnnouncements] = useState<SoftwareAnnouncement[]>([]);
  const [stats, setStats] = useState<any>(null);

  // UI States
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

  // Load Initial Data from Mock Service
  const loadDashboardData = () => {
    setNotes(SiteHesabimService.getNotes());
    setMessages(SiteHesabimService.getMessages());
    setAnnouncements(SiteHesabimService.getSoftwareAnnouncements());
    setStats(SiteHesabimService.getSummaryStats());
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-advance banner slide every 5 seconds
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
    // Mark as read
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
    const startDay = startOfMonth.getDay(); // 0 is Sunday, 1 is Monday...

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Add empty spacer slots for days before start of month
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
    <div className={`min-h-screen bg-[#F5F5F5] font-sans antialiased text-gray-800 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : ''}`}>
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#E31B23] to-[#ff474f] shadow-md shadow-[#E31B23]/25">
              <span className="font-extrabold text-white text-lg">S</span>
            </div>
            <span className="text-xl font-black tracking-tight text-[#E31B23]">
              SiteHesabım
            </span>
          </div>

          {/* Right Header Operations */}
          <div className="flex items-center gap-4">
            {/* Calendar Indicator */}
            <button className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors">
              <Calendar className="h-5 w-5" />
            </button>

            {/* Notification Bell */}
            <button className="relative rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#E31B23]"></span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Language Selection */}
            <button className="hidden md:flex items-center gap-1.5 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 px-2 py-1.5 rounded-lg text-gray-600 dark:text-slate-300 transition-colors">
              <Globe className="h-4 w-4" />
              <span>TR</span>
            </button>

            {/* Site Switcher Dropdown */}
            <div className="relative">
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
                <span>Yıldız Sitesi (A Blok)</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-slate-700 pl-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gray-300 to-gray-400 flex items-center justify-center text-xs font-extrabold text-white">
                HK
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-tight">Hasan Korkmaz</p>
                <p className="text-[10px] text-gray-400 leading-none">Yönetici</p>
              </div>
            </div>
          </div>
        </div>

        {/* MEGA MENU BAR */}
        <div className="bg-[#E31B23] text-white">
          <div className="mx-auto max-w-7xl px-4">
            <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1.5">
              <Link href="/yonetici/dashboard" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition-all">
                Giriş
              </Link>
              <Link href="/yonetici/sakinler" className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                Üyeler
              </Link>

              {/* Hoverable Mega Dropdown for Giderler */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                  <span>Giderler</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2 space-y-1">
                    <Link href="/yonetici/gelir-gider" className="block px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Gider Listesi</Link>
                    <Link href="/yonetici/gelir-gider" className="block px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Gider Ekle</Link>
                    <Link href="/yonetici/ayarlar" className="block px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Kategori Tanımları</Link>
                  </div>
                </div>
              </div>

              {/* Hoverable Mega Dropdown for Kasalar */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                  <span>Kasalar</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2 space-y-1">
                    <Link href="/yonetici/kasa-banka" className="block px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Kasa Listesi</Link>
                    <Link href="/yonetici/banka-sync" className="block px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Banka Entegrasyon</Link>
                  </div>
                </div>
              </div>

              {/* Hoverable Mega Dropdown for Raporlar */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                  <span>Raporlar</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2 space-y-1">
                    <Link href="/yonetici/raporlar" className="block px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Borç Dağılımı</Link>
                    <Link href="/yonetici/raporlar" className="block px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">Kasa Ekstresi</Link>
                  </div>
                </div>
              </div>

              <Link href="/yonetici/aidat" className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                Borçlandır
              </Link>
              <Link href="/yonetici/dashboard" className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                Hukuki
              </Link>
              <Link href="/yonetici/ayarlar" className="px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                Tanımlar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN TWO-PANEL CONTENT CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT 3/4 PANEL: MAIN WIDGETS */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Banner Slider */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm h-36 bg-[#E31B23] text-white flex items-center justify-between p-6">
              <div className="space-y-1.5 max-w-[70%]">
                <span className="inline-block text-[9px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">DUYURU</span>
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

            {/* Notes & Interactive Agenda Calendar Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Note Taking Widget */}
              <div className="glass rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between min-h-[350px]">
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

                  {/* Notes List */}
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
                  <span>Toplam kayıtlı not: {notes.length}</span>
                </div>
              </div>

              {/* Interactive Calendar Widget */}
              <div className="glass rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Ajanda & Takvim</h3>
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      {new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Calendar Day Header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Pz</span>
                    <span>Pt</span>
                    <span>Sa</span>
                    <span>Ça</span>
                    <span>Pe</span>
                    <span>Cu</span>
                    <span>Ct</span>
                  </div>

                  {/* Calendar Days Grid */}
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
                  <span>Seçili güne gitmek için tıklayın</span>
                </div>
              </div>
            </div>

            {/* Messages DataTable */}
            <div className="glass rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Mesajlar ({messages.filter(m => !m.read).length} Okunmamış)
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
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700/70">
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

          {/* RIGHT 1/4 PANEL: SUMMARY STATS CARDS */}
          <div className="space-y-6">
            
            {/* General Status Card (Genel Durum) */}
            <div className="glass rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Genel Durum</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">%100 Borç/Alacak Genel Dağılımı</p>
              </div>

              {/* Progress Bar */}
              {stats && (
                <div className="space-y-3">
                  <div className="w-full h-3 rounded-full bg-amber-500 overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.generalDurum.alacaklarPct}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${stats.generalDurum.kasaPct}%` }} />
                  </div>

                  <div className="grid grid-cols-2 text-center text-xs">
                    <div className="space-y-0.5 border-r border-gray-100 dark:border-slate-700">
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        %{stats.generalDurum.alacaklarPct} Alacaklar
                      </span>
                      <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{stats.generalDurum.toplamAlacak.toLocaleString('tr-TR')}</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-amber-500 font-bold flex items-center justify-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        %{stats.generalDurum.kasaPct} Kasalar
                      </span>
                      <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{stats.generalDurum.kasaBakiye.toLocaleString('tr-TR')}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Property Status Card (Taşınmaz Durumu) */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-200 dark:border-slate-700 shadow-sm text-center space-y-1 relative overflow-hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 mx-auto">
                    <Home className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Toplam</span>
                  <h4 className="text-base font-extrabold text-gray-800 dark:text-slate-200 leading-none">{stats.tasinmazDurumu.toplamTasinmaz}</h4>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-200 dark:border-slate-700 shadow-sm text-center space-y-1 relative overflow-hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-[#E31B23] mx-auto">
                    <Key className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Borçlu</span>
                  <h4 className="text-base font-extrabold text-gray-800 dark:text-slate-200 leading-none">{stats.tasinmazDurumu.borcluOlan}</h4>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-200 dark:border-slate-700 shadow-sm text-center space-y-1 relative overflow-hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 mx-auto">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Alacaklı</span>
                  <h4 className="text-base font-extrabold text-gray-800 dark:text-slate-200 leading-none">{stats.tasinmazDurumu.alacakliOlan}</h4>
                </div>
              </div>
            )}

            {/* Member Status Card (Üye Durumu) */}
            <div className="glass rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Üye Durumu</h3>
                <p className="text-[10px] text-[#E31B23] font-bold mt-0.5">13 Borçlu Üye Kayıtlı</p>
              </div>

              {/* Progress Bar */}
              {stats && (
                <div className="space-y-3">
                  <div className="w-full h-3 rounded-full bg-emerald-500 overflow-hidden flex">
                    <div className="h-full bg-rose-500" style={{ width: `${stats.uyeDurumu.kalanBorcPct}%` }} />
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.uyeDurumu.tahsilEdilenPct}%` }} />
                  </div>

                  <div className="grid grid-cols-2 text-center text-xs">
                    <div className="space-y-0.5 border-r border-gray-100 dark:border-slate-700">
                      <span className="text-[10px] text-[#E31B23] font-bold flex items-center justify-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E31B23]" />
                        %{stats.uyeDurumu.kalanBorcPct} Kalan Borç
                      </span>
                      <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{stats.uyeDurumu.toplamBorc.toLocaleString('tr-TR')}</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        %{stats.uyeDurumu.tahsilEdilenPct} Tahsilat
                      </span>
                      <strong className="text-gray-800 dark:text-slate-200 font-mono text-[11px]">₺{stats.uyeDurumu.tahsilEdilen.toLocaleString('tr-TR')}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Software Announcements (Program Duyuruları) */}
            <div className="glass rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">Duyurular</h3>
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
      </main>

      {/* 2. MODAL: ADD NEW NOTE */}
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
                  placeholder="Örn: Otopark Çizgi Boyaması"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3.5 py-2 text-xs text-gray-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Detay / Açıklama</label>
                <textarea
                  rows={3}
                  placeholder="Not detaylarını yazınız..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-3.5 py-2 text-xs text-gray-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Not Tarihi</label>
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
                  className="rounded-xl bg-[#E31B23] hover:bg-[#c9181e] text-white px-4 py-2 text-xs font-semibold shadow-sm shadow-[#E31B23]/10"
                >
                  Notu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: MESSAGE DETAIL */}
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
                <span className="font-bold text-[10px] text-gray-400 uppercase">Konu Başlığı:</span>
                <p className="text-sm font-extrabold text-gray-800 dark:text-slate-100">{selectedMessage.subject}</p>
              </div>

              <div className="space-y-1 bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                <span className="font-bold text-[10px] text-gray-400 uppercase">Mesaj İçeriği:</span>
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
