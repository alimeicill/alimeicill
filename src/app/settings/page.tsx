'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  Building, 
  Palette, 
  Bell, 
  ShieldAlert, 
  Save, 
  Key,
  Globe,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'security'>('general');

  // General settings state
  const [siteName, setSiteName] = useState('Yıldız Konakları Sitesi');
  const [address, setAddress] = useState('Yıldız Mah. Çamlık Cad. No:42');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Beşiktaş');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');

  // Notifications toggle settings state
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [invoiceReminder, setInvoiceReminder] = useState(true);

  // Security password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Genel ayarlar kaydedildi!');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Şifreler eşleşmiyor!');
      return;
    }
    alert('Şifre başarıyla güncellendi!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const tabs = [
    { id: 'general', title: 'Genel', icon: Building },
    { id: 'appearance', title: 'Görünüm', icon: Palette },
    { id: 'notifications', title: 'Bildirimler', icon: Bell },
    { id: 'security', title: 'Güvenlik', icon: ShieldAlert },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Ayarlar
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Yönetim paneli, tema, bildirimler ve güvenlik yapılandırmaları
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Side: Tabs Navigation */}
        <div className="md:col-span-1 glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 p-4 text-sm font-semibold transition-all text-left border-l-4 ${activeTab === tab.id ? 'bg-primary-500/5 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-primary-500' : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/20'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Contents */}
        <div className="md:col-span-3 glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary-500" />
                <span>Genel Site Ayarları</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Apartman / Site Adı</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Adres Açıklaması</label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">İlçe</label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Şehir</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Language Selection */}
                <div className="space-y-3 pt-3">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center space-x-1.5">
                    <Globe className="h-4 w-4 text-[var(--text-tertiary)]" />
                    <span>Arayüz Dili (Dil Seçimi)</span>
                  </label>
                  
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                      <input
                        type="radio"
                        name="lang"
                        checked={language === 'tr'}
                        onChange={() => setLanguage('tr')}
                        className="h-4 w-4 border-[var(--border-color)] text-primary-600 bg-[var(--bg-primary)]"
                      />
                      <span>Türkçe (TR)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                      <input
                        type="radio"
                        name="lang"
                        checked={language === 'en'}
                        onChange={() => setLanguage('en')}
                        className="h-4 w-4 border-[var(--border-color)] text-primary-600 bg-[var(--bg-primary)]"
                      />
                      <span>English (EN)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border-color)]/50">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <Palette className="h-5 w-5 text-primary-500" />
                <span>Görünüm ve Tema Ayarları</span>
              </h3>

              {/* Theme selectors */}
              <div className="space-y-4">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Renk Modu (Tema)</label>
                
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center border rounded-xl p-4 gap-2 transition-all ${theme === 'light' ? 'border-primary-500 bg-primary-500/5 text-primary-500' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/20'}`}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-xs font-bold">Aydınlık</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center border rounded-xl p-4 gap-2 transition-all ${theme === 'dark' ? 'border-primary-500 bg-primary-500/5 text-primary-500' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/20'}`}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-xs font-bold">Karanlık</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center justify-center border rounded-xl p-4 gap-2 transition-all ${theme === 'system' ? 'border-primary-500 bg-primary-500/5 text-primary-500' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/20'}`}
                  >
                    <Laptop className="h-5 w-5" />
                    <span className="text-xs font-bold">Sistem</span>
                  </button>
                </div>
              </div>

              {/* Theme Swatch Preview */}
              <div className="space-y-3 pt-3">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Vurgu Rengi</label>
                <div className="flex items-center space-x-3">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 ring-2 ring-indigo-500/40 ring-offset-2 cursor-pointer" />
                  <span className="h-6 w-6 rounded-full bg-emerald-600 opacity-60 cursor-not-allowed" />
                  <span className="h-6 w-6 rounded-full bg-rose-600 opacity-60 cursor-not-allowed" />
                  <span className="h-6 w-6 rounded-full bg-amber-600 opacity-60 cursor-not-allowed" />
                </div>
                <span className="block text-[10px] text-[var(--text-tertiary)]">Diğer renk temaları sonraki aşamalarda aktif edilecektir.</span>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary-500" />
                <span>Bildirim Kanalları Tercihi</span>
              </h3>

              <div className="space-y-4 divide-y divide-[var(--border-color)]/50">
                {/* Email Notif */}
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">E-posta Bildirimleri</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Aidat faturaları ve duyurular e-posta adresinize gelsin.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>

                {/* SMS Notif */}
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">SMS Bildirimleri</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Önemli acil bildirimler ve hatırlatmalar SMS olarak gelsin.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={(e) => setSmsNotif(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>

                {/* Push Notif */}
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Anlık Bildirimler</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Tarayıcı üzerinden anlık bildirimler gönderilsin.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotif}
                    onChange={(e) => setPushNotif(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>

                {/* Invoice Reminder */}
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Fatura Gecikme Hatırlatmaları</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Fatura son ödeme tarihinden 3 gün önce hatırlatma gönderilsin.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={invoiceReminder}
                    onChange={(e) => setInvoiceReminder(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-primary-500" />
                <span>Güvenlik & Şifre Değiştir</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Mevcut Şifre</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
                      <Key className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Yeni Şifre</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                      placeholder="En az 6 karakter"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Yeni Şifre Tekrar</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                      placeholder="En az 6 karakter"
                    />
                  </div>
                </div>

                {/* Two Factor Toggle */}
                <div className="flex items-center justify-between border-t border-[var(--border-color)]/50 pt-4 mt-2">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">İki Faktörlü Doğrulama (2FA)</h4>
                    <p className="text-xs text-[var(--text-secondary)]">Giriş işlemlerinde telefon veya e-posta doğrulaması isteyin.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border-color)]/50">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200"
                >
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
