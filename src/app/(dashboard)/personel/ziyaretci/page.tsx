'use client';

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Search, 
  UserCheck, 
  LogOut, 
  Plus, 
  Car, 
  Phone, 
  User, 
  Building,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  guestName: string;
  guestPhone: string;
  vehiclePlate: string;
  duration: string;
  purpose: string;
  qrCodeMock: string;
  expiresAt: string;
  createdAt: string;
}

interface VisitorLog {
  id: string;
  name: string;
  plate: string;
  phone: string;
  apartment: string;
  purpose: string;
  time: string;
  exitTime?: string;
  status: 'Giriş Yaptı' | 'Çıkış Yaptı';
}

export default function PersonelZiyaretciPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Walk-in form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [visitingApartment, setVisitingApartment] = useState('');
  const [purpose, setPurpose] = useState('Misafir');

  // Load from localStorage
  useEffect(() => {
    const savedInv = localStorage.getItem('sakin_invitations');
    const savedLogs = localStorage.getItem('sakin_visitor_logs');

    if (savedInv) {
      setInvitations(JSON.parse(savedInv));
    } else {
      const defaultInv = [
        {
          id: 'inv-1',
          guestName: 'Ali Demir',
          guestPhone: '+90 532 999 88 77',
          vehiclePlate: '34 ABC 123',
          duration: '1_day',
          purpose: 'Aile Ziyareti',
          qrCodeMock: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AliDemir-34ABC123-expires2026',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('tr-TR'),
          createdAt: new Date().toLocaleString('tr-TR'),
        }
      ];
      localStorage.setItem('sakin_invitations', JSON.stringify(defaultInv));
      setInvitations(defaultInv);
    }

    if (savedLogs) {
      // Parse & map old logs format if needed, otherwise load directly
      try {
        const parsed = JSON.parse(savedLogs);
        const mapped = parsed.map((log: any, idx: number) => ({
          id: log.id || `log-${idx}-${Date.now()}`,
          name: log.name || log.guestName,
          plate: log.plate || log.vehiclePlate || '',
          phone: log.phone || '',
          apartment: log.apartment || 'Blok A, Daire 12',
          purpose: log.purpose || 'Ziyaret',
          time: log.time || log.createdAt || 'Dün 14:20',
          exitTime: log.exitTime || undefined,
          status: log.status || 'Giriş Yaptı'
        }));
        setLogs(mapped);
      } catch (e) {
        setLogs([]);
      }
    } else {
      const defaultLogs: VisitorLog[] = [
        { id: 'log-1', name: 'Kurye - Getir', plate: '34 DFG 456', phone: '+90 555 123 45 67', apartment: 'A Blok Daire 5', purpose: 'Kurye', time: 'Dün 14:20', status: 'Giriş Yaptı' },
        { id: 'log-2', name: 'Teknisyen - Arçelik', plate: '06 XYZ 98', phone: '+90 555 987 65 43', apartment: 'B Blok Daire 8', purpose: 'Teknik Servis', time: '17.06.2026 10:15', exitTime: '17.06.2026 11:30', status: 'Çıkış Yaptı' },
      ];
      localStorage.setItem('sakin_visitor_logs', JSON.stringify(defaultLogs));
      setLogs(defaultLogs);
    }
  }, []);

  const saveData = (newInv: Invitation[], newLogs: VisitorLog[]) => {
    setInvitations(newInv);
    setLogs(newLogs);
    localStorage.setItem('sakin_invitations', JSON.stringify(newInv));
    localStorage.setItem('sakin_visitor_logs', JSON.stringify(newLogs));
    
    // Dispatch event so other tabs sync immediately
    window.dispatchEvent(new Event('storage'));
  };

  // Confirm Entry of pre-invited guest
  const handleCheckInGuest = (inv: Invitation) => {
    const newLog: VisitorLog = {
      id: `log-${Date.now()}`,
      name: inv.guestName,
      plate: inv.vehiclePlate || 'Yok',
      phone: inv.guestPhone || 'Yok',
      apartment: 'A Blok Daire 12', // Mehmet Kaya's flat
      purpose: inv.purpose,
      time: new Date().toLocaleString('tr-TR'),
      status: 'Giriş Yaptı'
    };

    // Remove from active invitations and add to entry logs
    const updatedInv = invitations.filter(i => i.id !== inv.id);
    const updatedLogs = [newLog, ...logs];

    saveData(updatedInv, updatedLogs);
    toast.success(`${inv.guestName} giriş kaydı onaylandı.`);
  };

  // Check out visitor
  const handleCheckOutVisitor = (logId: string) => {
    const updatedLogs = logs.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          status: 'Çıkış Yaptı' as const,
          exitTime: new Date().toLocaleString('tr-TR')
        };
      }
      return log;
    });

    saveData(invitations, updatedLogs);
    toast.success('Ziyaretçi çıkış kaydı yapıldı.');
  };

  // Add Walk-in (Randevusuz)
  const handleCreateWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const newLog: VisitorLog = {
      id: `log-${Date.now()}`,
      name: guestName,
      plate: vehiclePlate || 'Yok',
      phone: guestPhone || 'Yok',
      apartment: visitingApartment || 'Genel',
      purpose: purpose,
      time: new Date().toLocaleString('tr-TR'),
      status: 'Giriş Yaptı'
    };

    const updatedLogs = [newLog, ...logs];
    saveData(invitations, updatedLogs);
    
    // Reset Form
    setGuestName('');
    setGuestPhone('');
    setVehiclePlate('');
    setVisitingApartment('');
    setPurpose('Misafir');
    setIsFormOpen(false);

    toast.success(`${guestName} randevusuz giriş kaydı oluşturuldu.`);
  };

  // Filter Active Inv & Logs by Search Term
  const filteredInvitations = invitations.filter(inv => 
    inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.vehiclePlate && inv.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredLogs = logs.filter(log =>
    log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.plate && log.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
    log.apartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Ziyaretçi Giriş / Çıkış Paneli
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Misafir QR kodlarını sorgulayın, araç plakalarını onaylayın ve anlık ziyaretçi giriş kayıtlarını yönetin.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-primary-700 hover:to-indigo-800 transition-all shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Randevusuz Giriş Kaydı
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-secondary)] shadow-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Ziyaretçi adı, plaka veya daire no ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Active Invitations & Live Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Invitations List */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-indigo-500" />
              <span>Aktif Sakin Davetiyeleri (Sorgu Sonucu)</span>
            </h3>

            {filteredInvitations.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-tertiary)] bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-xl">
                Bekleyen aktif QR davetiyesi bulunmuyor.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredInvitations.map((inv) => (
                  <div key={inv.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 flex flex-col justify-between space-y-4 hover:border-indigo-500/35 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <strong className="text-sm text-[var(--text-primary)] block">{inv.guestName}</strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                          {inv.purpose}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          <span>Daire: <strong className="text-[var(--text-primary)]">A Blok, Daire 12</strong></span>
                        </div>
                        {inv.vehiclePlate && (
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5 text-blue-500" />
                            <span>Araç Plaka: <strong className="text-[var(--text-primary)]">{inv.vehiclePlate}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>Son Geçerlilik: {inv.expiresAt}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckInGuest(inv)}
                      className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Girişi Onayla (Kapıyı Aç)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Entry Logs */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Giriş / Çıkış Günlüğü</h3>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                Eşleşen giriş kaydı bulunamadı.
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-[var(--text-primary)]">{log.name}</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          log.status === 'Giriş Yaptı'
                            ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--text-tertiary)]">
                        <span>Gidilen Daire: <strong className="text-[var(--text-primary)]">{log.apartment}</strong></span>
                        {log.plate && <span>Plaka: <strong>{log.plate}</strong></span>}
                        <span>Ziyaret Amacı: {log.purpose}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right text-[var(--text-secondary)]">
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-[var(--text-tertiary)]">Giriş: {log.time}</span>
                        {log.exitTime && <span className="block text-[10px] text-rose-500 font-medium">Çıkış: {log.exitTime}</span>}
                      </div>

                      {log.status === 'Giriş Yaptı' && (
                        <button
                          onClick={() => handleCheckOutVisitor(log.id)}
                          className="rounded-lg border border-[var(--border-color)] hover:border-amber-500 hover:text-amber-500 bg-[var(--bg-secondary)] px-3 py-1.5 font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Çıkış Yap
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics & Quick Guide */}
        <div className="space-y-6">
          {/* Quick Guide */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-500" />
              <span>Güvenlik Görevlisi Rehberi</span>
            </h3>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc pl-4 leading-relaxed">
              <li>Ziyaretçinin sunduğu QR davet kodunu listeden teyit edip <strong>"Girişi Onayla"</strong> butonuna basın.</li>
              <li>Plaka tanıma sistemi plakayı okuduğunda, eşleşen davetiyesi olan araçlar için bariyer otomatik açılır.</li>
              <li>Randevusuz gelen tüm kurye, kargo ve komşu misafirlerini sağ üstteki <strong>"Randevusuz Giriş Kaydı"</strong> butonuyla sisteme kaydedin.</li>
              <li>Ziyaretçi siteden ayrılırken listeden ismini bularak mutlaka <strong>"Çıkış Yap"</strong> kaydını tamamlayın.</li>
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Günün İstatistikleri</h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3">
                <span className="text-[10px] text-[var(--text-tertiary)] block font-semibold">İçerideki Ziyaretçi</span>
                <strong className="text-xl font-bold text-indigo-500 block mt-1">
                  {logs.filter(l => l.status === 'Giriş Yaptı').length}
                </strong>
              </div>
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3">
                <span className="text-[10px] text-[var(--text-tertiary)] block font-semibold">Toplam Çıkış Yapan</span>
                <strong className="text-xl font-bold text-emerald-500 block mt-1">
                  {logs.filter(l => l.status === 'Çıkış Yaptı').length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Entry Registration Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/50 mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Randevusuz Ziyaretçi Giriş Kaydı</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Ziyaretçi Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="örn: Ahmet Şen"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Ziyaretçi Telefon Numarası</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="örn: +90 532 000 11 22"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Araç Plakası</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="örn: 34 ABC 123"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Gidilen Daire</label>
                  <input
                    type="text"
                    required
                    value={visitingApartment}
                    onChange={(e) => setVisitingApartment(e.target.value)}
                    placeholder="örn: A Blok Daire 12"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Giriş Amacı</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Misafir">Misafir / Ziyaretçi</option>
                  <option value="Kurye">Kurye / Yemek Teslimatı</option>
                  <option value="Kargo">Kargo Teslimatı</option>
                  <option value="Teknik Servis">Teknik Servis / Tamirat</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-primary-600 to-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow hover:from-primary-700 hover:to-indigo-800 flex items-center gap-1"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Giriş Kaydı Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
