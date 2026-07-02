'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { mockInvoices, mockUsers } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Send, 
  Search, 
  ArrowLeft, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Smartphone,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface SmsLog {
  id: string;
  kisiId?: string;
  kisiName: string;
  smsTipi: 'Duyuru' | 'Borc';
  telefonNo: string;
  mesajMetni: string;
  gonderimTarihi: string;
  durum: 'Basarili' | 'Basarisiz';
}

interface OverdueDebt {
  id: string;
  unitNumber: string;
  ownerName: string;
  period: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  phone: string;
  userId?: string;
}

export default function SmsManagementPage() {
  const [activeTab, setActiveTab] = useState<'debt' | 'announcement' | 'history'>('debt');
  
  // States for Debt Reminders (Tab 1)
  const [debts, setDebts] = useState<OverdueDebt[]>([]);
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  // States for New Announcement (Tab 2)
  const [targetAudience, setTargetAudience] = useState<string>('Tumu'); // Tumu, Borclular, ABlok, BBlok, SeciliKisiler
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [announcementSearch, setAnnouncementSearch] = useState<string>('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);

  // States for History (Tab 3)
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');

  // Load data from localStorage
  const loadData = () => {
    // 1. Get Overdue/Unpaid invoices
    // Overdue or unpaid invoices (excluding paid)
    const unpaid = mockInvoices.filter(inv => inv.status === 'overdue' || inv.status === 'sent' || inv.status === 'partial');
    const processedDebts: OverdueDebt[] = unpaid.map(inv => {
      // Find user phone from mockUsers
      const user = mockUsers.find(u => u.name.toLowerCase() === inv.ownerName.toLowerCase());
      return {
        id: inv.id,
        unitNumber: inv.unitNumber,
        ownerName: inv.ownerName,
        period: inv.period,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        phone: user?.phone || '+90 532 999 88 77',
        userId: user?.id
      };
    });
    setDebts(processedDebts);

    // 2. Load SMS Logs
    const savedLogs = localStorage.getItem('site_sms_logs');
    if (savedLogs) {
      setSmsLogs(JSON.parse(savedLogs));
    } else {
      const defaultLogs: SmsLog[] = [
        {
          id: 'sms-1',
          kisiId: 'user-004',
          kisiName: 'Fatma Kaya',
          smsTipi: 'Borc',
          telefonNo: '+90 536 444 55 66',
          mesajMetni: 'Sayın Fatma Kaya, A-102 numaralı dairenize ait 15.06.2026 vadeli 1800.00 TL borcunuz bulunmaktadır. ApartmanYönet',
          gonderimTarihi: '2026-06-20T10:00:00.000Z',
          durum: 'Basarili'
        },
        {
          id: 'sms-2',
          kisiName: 'Tüm Sakinler',
          smsTipi: 'Duyuru',
          telefonNo: '+90 535 333 44 55',
          mesajMetni: 'Duyuru: Yarın site genelinde 10:00 - 12:00 saatleri arasında su kesintisi yaşanacaktır. Önlemlerinizi almanızı rica ederiz.',
          gonderimTarihi: '2026-06-24T14:30:00.000Z',
          durum: 'Basarili'
        }
      ];
      localStorage.setItem('site_sms_logs', JSON.stringify(defaultLogs));
      setSmsLogs(defaultLogs);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveLogs = (newLogs: SmsLog[]) => {
    setSmsLogs(newLogs);
    localStorage.setItem('site_sms_logs', JSON.stringify(newLogs));
  };

  // Filter residents for custom audience selection
  const residents = useMemo(() => {
    return mockUsers.filter(u => u.role === 'owner' || u.role === 'tenant' || u.role === 'block_rep');
  }, []);

  const filteredResidents = useMemo(() => {
    return residents.filter(r => 
      r.name.toLowerCase().includes(announcementSearch.toLowerCase()) || 
      (r.phone && r.phone.includes(announcementSearch))
    );
  }, [residents, announcementSearch]);

  // Tab 1: Toggle single checkbox
  const handleSelectDebt = (id: string) => {
    setSelectedDebtIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Tab 1: Toggle all checkboxes
  const handleSelectAllDebts = () => {
    if (selectedDebtIds.length === debts.length) {
      setSelectedDebtIds([]);
    } else {
      setSelectedDebtIds(debts.map(d => d.id));
    }
  };

  // Tab 2: Toggle single resident
  const handleSelectResident = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Tab 2: Select all residents in list
  const handleSelectAllResidents = () => {
    if (selectedUserIds.length === filteredResidents.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredResidents.map(r => r.id));
    }
  };

  // SMS Text calculations
  const smsInfo = useMemo(() => {
    const charCount = announcementText.length;
    const smsCount = charCount === 0 ? 0 : Math.ceil(charCount / 160);
    const charsRemaining = smsCount * 160 - charCount;
    return { charCount, smsCount, charsRemaining };
  }, [announcementText]);

  // Tab 1 Actions: Send bulk debt reminders
  const handleSendReminders = async () => {
    if (selectedDebtIds.length === 0) {
      toast.error('Lütfen en az bir borçlu seçiniz.');
      return;
    }

    setIsSendingReminders(true);
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const selectedDebts = debts.filter(d => selectedDebtIds.includes(d.id));
    const newLogs: SmsLog[] = [];

    selectedDebts.forEach(d => {
      const vadeTarihiStr = d.dueDate ? new Date(d.dueDate).toLocaleDateString('tr-TR') : '15.06.2026';
      const remainingDebt = d.totalAmount - d.paidAmount;
      const text = `Sayın ${d.ownerName}, ${d.unitNumber} numaralı dairenize ait ${vadeTarihiStr} vadeli ${remainingDebt.toFixed(2)} TL borcunuz bulunmaktadır. ApartmanYönet`;

      newLogs.push({
        id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        kisiId: d.userId,
        kisiName: d.ownerName,
        smsTipi: 'Borc',
        telefonNo: d.phone,
        mesajMetni: text,
        gonderimTarihi: new Date().toISOString(),
        durum: 'Basarili'
      });
    });

    const updatedLogs = [...newLogs, ...smsLogs];
    saveLogs(updatedLogs);
    
    toast.success(`${selectedDebts.length} kişiye borç hatırlatma SMS'i başarıyla gönderildi.`);
    setSelectedDebtIds([]);
    setIsSendingReminders(false);
  };

  // Tab 2 Actions: Send general or filtered announcement
  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) {
      toast.error('Lütfen bir duyuru metni giriniz.');
      return;
    }

    let recipients: { id: string; name: string; phone: string }[] = [];

    // Filter recipients based on audience
    switch (targetAudience) {
      case 'Tumu':
        recipients = residents.map(r => ({ id: r.id, name: r.name, phone: r.phone || '+90 532 999 88 77' }));
        break;
      case 'Borclular':
        // Find residents who have outstanding debts
        const debtorNames = new Set(debts.map(d => d.ownerName.toLowerCase()));
        recipients = residents
          .filter(r => debtorNames.has(r.name.toLowerCase()))
          .map(r => ({ id: r.id, name: r.name, phone: r.phone || '+90 532 999 88 77' }));
        break;
      case 'ABlok':
        // A Blok residents
        recipients = residents
          .filter(r => {
            const unit = mockInvoices.find(inv => inv.ownerName === r.name)?.unitNumber || '';
            return unit.startsWith('A-') || unit.toLowerCase().includes('a blok');
          })
          .map(r => ({ id: r.id, name: r.name, phone: r.phone || '+90 532 999 88 77' }));
        break;
      case 'BBlok':
        recipients = residents
          .filter(r => {
            const unit = mockInvoices.find(inv => inv.ownerName === r.name)?.unitNumber || '';
            return unit.startsWith('B-') || unit.toLowerCase().includes('b blok');
          })
          .map(r => ({ id: r.id, name: r.name, phone: r.phone || '+90 532 999 88 77' }));
        break;
      case 'SeciliKisiler':
        if (selectedUserIds.length === 0) {
          toast.error('Lütfen en az bir sakin seçiniz.');
          return;
        }
        recipients = residents
          .filter(r => selectedUserIds.includes(r.id))
          .map(r => ({ id: r.id, name: r.name, phone: r.phone || '+90 532 999 88 77' }));
        break;
      default:
        break;
    }

    if (recipients.length === 0) {
      toast.error('Belirtilen hedef kitleye uygun alıcı bulunamadı.');
      return;
    }

    setIsSendingAnnouncement(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newLogs: SmsLog[] = recipients.map(r => ({
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      kisiId: r.id,
      kisiName: r.name,
      smsTipi: 'Duyuru',
      telefonNo: r.phone,
      mesajMetni: announcementText,
      gonderimTarihi: new Date().toISOString(),
      durum: 'Basarili'
    }));

    const updatedLogs = [...newLogs, ...smsLogs];
    saveLogs(updatedLogs);

    toast.success(`Duyuru ${recipients.length} kişiye başarıyla gönderildi.`);
    setAnnouncementText('');
    setSelectedUserIds([]);
    setIsSendingAnnouncement(false);
  };

  // Tab 3 Actions: Clear history log
  const handleClearLog = (id: string) => {
    if (window.confirm('Bu gönderim kaydını silmek istediğinize emin misiniz?')) {
      const updated = smsLogs.filter(l => l.id !== id);
      saveLogs(updated);
      toast.success('Kayıt başarıyla silindi.');
    }
  };

  // Tab 3: Filtered Logs
  const filteredLogs = useMemo(() => {
    return smsLogs.filter(log => {
      const matchesSearch = 
        log.kisiName.toLowerCase().includes(historySearch.toLowerCase()) || 
        log.telefonNo.includes(historySearch) || 
        log.mesajMetni.toLowerCase().includes(historySearch.toLowerCase());
      
      const matchesType = 
        historyTypeFilter === 'all' || 
        log.smsTipi === historyTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [smsLogs, historySearch, historyTypeFilter]);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-12">
      {/* Header and Back Link */}
      <div className="space-y-4">
        <Link
          href="/yonetici/dashboard"
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Finansal Yönetime Dön
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            SMS & Bildirim Yönetimi
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Site sakinlerine borç hatırlatmaları yapın ve filtreli toplu duyurular gönderin
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('debt')}
          className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'debt'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Borç Hatırlatma
        </button>
        <button
          onClick={() => setActiveTab('announcement')}
          className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'announcement'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Yeni Duyuru Gönder
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Gönderim Geçmişi
        </button>
      </div>

      {/* TAB 1: Debt Reminders */}
      {activeTab === 'debt' && (
        <div className="space-y-6">
          {/* Info Card */}
          <div className="glass p-4 rounded-xl border border-[var(--border-color)] flex items-start gap-3 bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
            <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Borç Hatırlatma Mantığı</p>
              <p className="mt-1">
                Aşağıdaki listede vadesi geçmiş veya henüz tamamı ödenmemiş aidat/borç faturaları olan sakinler listelenmektedir. Gönderilen SMS'ler sakinlere ait telefon numaralarına otomatik şablonla iletilecektir.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="text-xs text-[var(--text-secondary)]">
              Seçilen Kişi: <strong className="text-indigo-500">{selectedDebtIds.length}</strong> / Toplam: <strong>{debts.length}</strong>
            </div>

            <button
              onClick={handleSendReminders}
              disabled={isSendingReminders || selectedDebtIds.length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSendingReminders ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Toplu SMS Gönder ({selectedDebtIds.length})
                </>
              )}
            </button>
          </div>

          {/* Table */}
          <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedDebtIds.length === debts.length && debts.length > 0}
                        onChange={handleSelectAllDebts}
                        className="rounded border-[var(--border-color)] text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                    </th>
                    <th className="p-4">Daire</th>
                    <th className="p-4">Sakin Adı Soyadı</th>
                    <th className="p-4">Dönem</th>
                    <th className="p-4">Vade Tarihi</th>
                    <th className="p-4">Kalan Borç</th>
                    <th className="p-4">Telefon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-sm">
                  {debts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                        Gecikmiş borç kaydı bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    debts.map((d) => {
                      const isSelected = selectedDebtIds.includes(d.id);
                      const remaining = d.totalAmount - d.paidAmount;
                      return (
                        <tr 
                          key={d.id}
                          className={`transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20 ${isSelected ? 'bg-indigo-50/10 dark:bg-indigo-950/5' : ''}`}
                        >
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectDebt(d.id)}
                              className="rounded border-[var(--border-color)] text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                          </td>
                          <td className="p-4 font-bold text-[var(--text-primary)]">
                            {d.unitNumber}
                          </td>
                          <td className="p-4 font-semibold text-[var(--text-secondary)]">
                            {d.ownerName}
                          </td>
                          <td className="p-4 text-[var(--text-secondary)] text-xs">
                            {d.period}
                          </td>
                          <td className="p-4 text-[var(--text-secondary)] text-xs">
                            {d.dueDate ? new Date(d.dueDate).toLocaleDateString('tr-TR') : '15.06.2026'}
                          </td>
                          <td className="p-4 font-bold text-rose-500">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">
                            {d.phone}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: New Announcement */}
      {activeTab === 'announcement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form & Selection Pane (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm space-y-5">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                <span>Duyuru Mesajı Oluştur</span>
              </h3>

              {/* Target Audience Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Hedef Kitle Seçimi</label>
                <select
                  value={targetAudience}
                  onChange={(e) => {
                    setTargetAudience(e.target.value);
                    setSelectedUserIds([]);
                  }}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="Tumu">Tüm Site Sakinleri</option>
                  <option value="Borclular">Sadece Borcu Olan Sakinler</option>
                  <option value="ABlok">Sadece A Blok Sakinleri</option>
                  <option value="BBlok">Sadece B Blok Sakinleri</option>
                  <option value="SeciliKisiler">Belirli Kişileri Seçerek Gönder</option>
                </select>
              </div>

              {/* Metin Giriş Alanı */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span>Mesaj Metni *</span>
                  <span className={smsInfo.charCount > 160 ? 'text-amber-500' : 'text-slate-500'}>
                    {smsInfo.charCount} Karakter • {smsInfo.smsCount} SMS (Kalan: {smsInfo.charsRemaining})
                  </span>
                </div>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  rows={5}
                  required
                  placeholder="Duyuru metnini yazın. (örn: Yarın 10:00-12:00 arası su kesintisi olacaktır. ApartmanYönet)"
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Conditionally render individual selector if SeciliKisiler is chosen */}
              {targetAudience === 'SeciliKisiler' && (
                <div className="space-y-3 pt-3 border-t border-[var(--border-color)]/50">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Sakin Seçin ({selectedUserIds.length})</label>
                    
                    <div className="relative w-48">
                      <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <input 
                        type="text"
                        placeholder="Sakin ismiyle ara..."
                        value={announcementSearch}
                        onChange={(e) => setAnnouncementSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-[var(--border-color)]/60 rounded-xl divide-y divide-[var(--border-color)]/40 bg-[var(--bg-primary)] p-2">
                    <div className="flex items-center p-2 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/20 rounded-lg mb-1">
                      <input 
                        type="checkbox"
                        checked={selectedUserIds.length === filteredResidents.length && filteredResidents.length > 0}
                        onChange={handleSelectAllResidents}
                        className="rounded border-[var(--border-color)] text-indigo-600 h-3.5 w-3.5 mr-2.5"
                      />
                      <span>Tümünü Seç</span>
                    </div>

                    {filteredResidents.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--text-tertiary)]">Arama sonucu sakin bulunamadı.</div>
                    ) : (
                      filteredResidents.map(r => {
                        const isChecked = selectedUserIds.includes(r.id);
                        return (
                          <label key={r.id} className="flex items-center p-2 hover:bg-[var(--bg-secondary)]/50 rounded-lg cursor-pointer text-xs">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectResident(r.id)}
                              className="rounded border-[var(--border-color)] text-indigo-600 h-3.5 w-3.5 mr-2.5"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-[var(--text-primary)] block truncate">{r.name}</span>
                              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{r.phone || 'Telefon yok'}</span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSendAnnouncement}
                  disabled={isSendingAnnouncement || !announcementText.trim() || (targetAudience === 'SeciliKisiler' && selectedUserIds.length === 0)}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSendingAnnouncement ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Duyuruyu SMS Olarak Gönder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Smartphone Simulator Preview (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="glass p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[450px]">
              <span className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5 self-start">
                <Smartphone className="h-4 w-4 text-indigo-500" />
                <span>Gerçek Zamanlı Telefon Önizlemesi</span>
              </span>

              {/* Smartphone Mockup */}
              <div className="relative w-64 h-[400px] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 flex flex-col justify-between overflow-hidden">
                {/* Speaker/Camera bar */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center space-x-1 z-10">
                  <div className="w-8 h-1 bg-slate-700 rounded-full" />
                  <div className="w-2 h-2 bg-slate-800 rounded-full" />
                </div>

                {/* Simulated Screen Content */}
                <div className="w-full h-full bg-slate-950 rounded-[28px] overflow-hidden flex flex-col justify-between p-3.5 text-white">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[8px] font-semibold text-slate-400 mt-1">
                    <span>12:47</span>
                    <div className="flex items-center space-x-1">
                      <span>4G</span>
                      <div className="w-3.5 h-1.5 border border-current rounded-sm" />
                    </div>
                  </div>

                  {/* Chat header area */}
                  <div className="flex flex-col items-center border-b border-slate-800/60 pb-2 mt-4">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-extrabold">
                      AP
                    </div>
                    <span className="text-[9px] font-bold mt-1 text-slate-300">APARTYONET</span>
                  </div>

                  {/* Chat body area */}
                  <div className="flex-1 py-4 overflow-y-auto flex flex-col justify-end">
                    {/* Simulated Text Message bubble */}
                    <div className="bg-slate-800 text-xs p-3 rounded-2xl rounded-bl-sm max-w-[90%] self-start text-slate-100 shadow-lg leading-relaxed break-words">
                      {announcementText.trim() ? (
                        announcementText
                      ) : (
                        <span className="text-slate-500 italic">Mesaj içeriği burada görüntülenecektir...</span>
                      )}
                      <span className="block text-[8px] text-slate-500 text-right mt-1.5">12:47</span>
                    </div>
                  </div>

                  {/* Input area mockup */}
                  <div className="border-t border-slate-800/60 pt-2 flex items-center justify-between text-[9px] text-slate-500">
                    <span>iMessage</span>
                    <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[8px]">
                      ↑
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-secondary)]">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Alıcı, telefon veya mesaj içeriği ile ara..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="all">Tüm Tipler</option>
                <option value="Borc">Borç Hatırlatma</option>
                <option value="Duyuru">Duyuru</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="p-4">Alıcı</th>
                    <th className="p-4">Tip</th>
                    <th className="p-4">Telefon</th>
                    <th className="p-4 w-[40%]">Mesaj</th>
                    <th className="p-4">Tarih</th>
                    <th className="p-4 text-center">Durum</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-sm">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                        Gönderim kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr 
                        key={log.id}
                        className="transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20"
                      >
                        <td className="p-4 font-bold text-[var(--text-primary)]">
                          {log.kisiName}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            log.smsTipi === 'Borc' 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                          }`}>
                            {log.smsTipi === 'Borc' ? 'Borç Hatırlatma' : 'Duyuru'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">
                          {log.telefonNo}
                        </td>
                        <td className="p-4 text-[var(--text-secondary)] text-xs whitespace-pre-line leading-relaxed">
                          {log.mesajMetni}
                        </td>
                        <td className="p-4 text-xs text-[var(--text-secondary)]">
                          {formatDate(log.gonderimTarihi)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            log.durum === 'Basarili' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {log.durum === 'Basarili' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Başarılı
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                Başarısız
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleClearLog(log.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
