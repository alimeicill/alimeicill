'use client';

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Clock, 
  Car, 
  User, 
  Share2, 
  Info
} from 'lucide-react';

interface Invitation {
  id: string;
  guestName: string;
  guestPhone: string;
  vehiclePlate: string;
  duration: '1_hour' | '1_day' | '1_week';
  purpose: string;
  qrCodeMock: string;
  expiresAt: string;
  createdAt: string;
}

export default function SakinZiyaretciPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);

  // Load and initialize data from localStorage
  useEffect(() => {
    const savedInv = localStorage.getItem('sakin_invitations');
    const savedLogs = localStorage.getItem('sakin_visitor_logs');

    if (savedInv) {
      setInvitations(JSON.parse(savedInv));
    } else {
      const defaultInv: Invitation[] = [
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
        },
      ];
      localStorage.setItem('sakin_invitations', JSON.stringify(defaultInv));
      setInvitations(defaultInv);
    }

    if (savedLogs) {
      setVisitorLogs(JSON.parse(savedLogs));
    } else {
      const defaultLogs = [
        { name: 'Kurye - Getir', plate: '34 DFG 456', time: 'Dün 14:20', status: 'Giriş Yaptı' },
        { name: 'Teknisyen - Arçelik', plate: '06 XYZ 98', time: '17.06.2026 10:15', status: 'Çıkış Yaptı' },
      ];
      localStorage.setItem('sakin_visitor_logs', JSON.stringify(defaultLogs));
      setVisitorLogs(defaultLogs);
    }
  }, []);

  const saveInvitations = (newInv: Invitation[]) => {
    setInvitations(newInv);
    localStorage.setItem('sakin_invitations', JSON.stringify(newInv));
  };

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [duration, setDuration] = useState<'1_hour' | '1_day' | '1_week'>('1_day');
  const [purpose, setPurpose] = useState('Misafir');

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const expirationMap = {
      '1_hour': 1 * 60 * 60 * 1000,
      '1_day': 24 * 60 * 60 * 1000,
      '1_week': 7 * 24 * 60 * 60 * 1000,
    };

    const expiresAtDate = new Date(Date.now() + expirationMap[duration]);
    const qrData = encodeURIComponent(`Name:${guestName}|Plate:${vehiclePlate || 'Yok'}|Expires:${expiresAtDate.toISOString()}`);

    const newInvite: Invitation = {
      id: `inv-${Date.now()}`,
      guestName,
      guestPhone,
      vehiclePlate,
      duration,
      purpose,
      qrCodeMock: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`,
      expiresAt: expiresAtDate.toLocaleString('tr-TR'),
      createdAt: new Date().toLocaleString('tr-TR'),
    };

    const updated = [newInvite, ...invitations];
    saveInvitations(updated);
    setIsFormOpen(false);

    // Reset Form
    setGuestName('');
    setGuestPhone('');
    setVehiclePlate('');
    setDuration('1_day');
    setPurpose('Misafir');
  };

  const handleDeleteInvite = (id: string) => {
    const updated = invitations.filter((inv) => inv.id !== id);
    saveInvitations(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Ziyaretçi QR Daveti
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Misafirleriniz için geçici QR giriş kodları oluşturun ve araç plakalarını bariyer otomasyonu için kaydedin.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-primary-700 hover:to-indigo-800 transition-all shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni QR Daveti Oluştur
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Invitations List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Aktif Davetiyeleriniz</h3>
          
          {invitations.length === 0 ? (
            <div className="glass rounded-2xl border border-dashed border-[var(--border-color)] p-12 text-center text-sm text-[var(--text-tertiary)] bg-[var(--bg-secondary)] flex flex-col items-center justify-center space-y-3">
              <QrCode className="h-10 w-10 text-[var(--text-tertiary)] opacity-65" />
              <span>Aktif ziyaretçi davetiniz bulunmuyor. Yeni bir davetiye oluşturarak başlayın.</span>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 bg-[var(--bg-secondary)] relative overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <User className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{inv.guestName}</h4>
                        <span className="text-[10px] text-[var(--text-secondary)]">{inv.purpose}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteInvite(inv.id)}
                      className="text-[var(--text-tertiary)] hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                      title="Davetiyeyi Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* QR Display */}
                  <div className="flex justify-center bg-white p-3 rounded-xl max-w-[170px] mx-auto border border-slate-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inv.qrCodeMock} alt="QR Giriş Kodu" className="h-36 w-36 object-contain" />
                  </div>

                  {/* Details info */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border-color)]/50 text-xs text-[var(--text-secondary)]">
                    {inv.vehiclePlate && (
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-blue-500" />
                        <span>Bariyer Plaka Yetkisi: <strong className="text-[var(--text-primary)]">{inv.vehiclePlate}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>Son Geçerlilik: <strong>{inv.expiresAt}</strong></span>
                    </div>
                  </div>

                  {/* Actions share */}
                  <button
                    onClick={() => alert('Davet linki kopyalandı! Misafirinize SMS veya WhatsApp ile iletebilirsiniz.')}
                    className="w-full rounded-xl bg-[var(--bg-tertiary)] hover:bg-primary-500/10 hover:text-primary-500 py-2.5 text-xs font-bold text-[var(--text-secondary)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Daveti Paylaş / Kopyala
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & History */}
        <div className="space-y-6">
          {/* Bariyer Info */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-500" />
              <span>Bariyer Otomasyonu Bilgisi</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ziyaretçiniz kapıya geldiğinde plaka tanıma kamerası plakasını okuyarak bariyeri otomatik olarak açar. Davetiyeye araç plakasını doğru girdiğinizden emin olun.
            </p>
          </div>

          {/* Past Entries Logs */}
          <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Son Giriş Kayıtları</h3>
            
            {visitorLogs.length === 0 ? (
              <div className="text-xs text-[var(--text-tertiary)] text-center py-4">
                Henüz giriş kaydı bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {visitorLogs.map((log, idx) => (
                  <div key={idx} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--text-primary)]">{log.name}</span>
                      <span className="block text-[10px] text-[var(--text-tertiary)]">{log.plate ? `${log.plate} • ` : ''}{log.time}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      log.status === 'Giriş Yaptı'
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Invite Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Yeni Ziyaretçi Daveti Oluştur</h3>
            
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Ziyaretçi Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="örn: Ali Demir"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Ziyaretçi Telefon Numarası</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="örn: +90 532 999 88 77"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Ziyaretçi Araç Plakası (Bariyer İçin)</label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="örn: 34 ABC 123"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Geçerlilik Süresi</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="1_hour">1 Saatlik Giriş</option>
                    <option value="1_day">1 Günlük Giriş</option>
                    <option value="1_week">1 Haftalık Giriş</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Ziyaret Amacı</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Misafir">Aile / Arkadaş</option>
                    <option value="Kurye">Kurye / Teslimat</option>
                    <option value="Teknik Servis">Teknik Servis</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow hover:from-primary-700 hover:to-indigo-800"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
