'use client';

import React, { useState } from 'react';
import { 
  Building, 
  Palette, 
  Bell, 
  ShieldAlert, 
  Save, 
  Key,
  Globe,
  Database,
  Mail,
  MessageSquare,
  ShieldCheck,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'system' | 'payments' | 'sms_mail' | 'backups'>('system');

  // System Settings state
  const [platformName, setPlatformName] = useState('ApartmanYönet SaaS');
  const [platformUrl, setPlatformUrl] = useState('https://app.apartmanyonet.com');
  const [supportEmail, setSupportEmail] = useState('destek@apartmanyonet.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Payment integration keys state
  const [stripePublicKey, setStripePublicKey] = useState('pk_test_51Px...abc');
  const [stripeSecretKey, setStripeSecretKey] = useState('sk_test_51Px...xyz');
  const [iyzicoApiKey, setIyzicoApiKey] = useState('api_iyzi_test...123');
  const [iyzicoSecretKey, setIyzicoSecretKey] = useState('sec_iyzi_test...456');

  // SMTP Mail Server state
  const [smtpHost, setSmtpHost] = useState('smtp.resend.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('resend');
  const [smtpPass, setSmtpPass] = useState('re_abcdef123');

  // SMS Gateway state
  const [netgsmUser, setNetgsmUser] = useState('yildizkonak');
  const [netgsmPass, setNetgsmPass] = useState('********');

  // Backups state
  const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly'>('daily');
  const [lastBackupDate, setLastBackupDate] = useState('21.06.2026 04:00');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Sistem yapılandırma ayarları başarıyla güncellendi.');
  };

  const handleTakeBackup = () => {
    toast.info('Veritabanı yedeği oluşturuluyor...');
    setTimeout(() => {
      setLastBackupDate(new Date().toLocaleString('tr-TR'));
      toast.success('Yeni veritabanı yedek dosyası başarıyla kaydedildi: db_backup_' + Date.now() + '.sql');
    }, 1500);
  };

  const tabs = [
    { id: 'system', title: 'Sistem Tanımları', icon: Building },
    { id: 'payments', title: 'Ödeme Ağ Geçitleri', icon: Key },
    { id: 'sms_mail', title: 'E-posta & SMS', icon: Mail },
    { id: 'backups', title: 'Yedekleme & Sağlık', icon: Database },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Sistem Global Ayarları
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          SaaS platformunun ödeme altyapısını, iletişim sunucularını ve genel sistem sağlığını yapılandırın.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Side: Tabs Navigation */}
        <div className="md:col-span-1 glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col bg-[var(--bg-secondary)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 p-4 text-xs font-semibold transition-all text-left border-l-4 ${activeTab === tab.id ? 'bg-primary-500/5 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-primary-500' : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/25'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Contents */}
        <div className="md:col-span-3 glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-md">
          
          {/* SYSTEM CONFIG TAB */}
          {activeTab === 'system' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <Server className="h-4 w-4 text-indigo-500" />
                <span>Sistem Yapılandırması</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Platform Adı</label>
                    <input
                      type="text"
                      required
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Destek E-posta</label>
                    <input
                      type="email"
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Platform Giriş URL adresi</label>
                  <input
                    type="url"
                    required
                    value={platformUrl}
                    onChange={(e) => setPlatformUrl(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-color)]/50 pt-4 mt-2">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Platform Bakım Modu</h4>
                    <p className="text-[10px] text-[var(--text-secondary)]">Aktif edildiğinde sadece süper yöneticiler giriş yapabilir.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-color)] text-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border-color)]/50">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow hover:from-primary-700 hover:to-indigo-800"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <Key className="h-4 w-4 text-indigo-500" />
                <span>Ödeme Gateway API Anahtarları</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-3">
                  <strong className="text-xs text-[var(--text-primary)] block">Stripe Gateway (Global)</strong>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Stripe Publishable Key</label>
                      <input
                        type="text"
                        value={stripePublicKey}
                        onChange={(e) => setStripePublicKey(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Stripe Secret Key</label>
                      <input
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-color)]/30">
                  <strong className="text-xs text-[var(--text-primary)] block">İyzico Gateway (Türkiye)</strong>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Iyzico API Key</label>
                      <input
                        type="text"
                        value={iyzicoApiKey}
                        onChange={(e) => setIyzicoApiKey(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Iyzico Secret Key</label>
                      <input
                        type="password"
                        value={iyzicoSecretKey}
                        onChange={(e) => setIyzicoSecretKey(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border-color)]/50">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow"
                >
                  Kimlikleri Güncelle
                </button>
              </div>
            </form>
          )}

          {/* SMS & MAIL TAB */}
          {activeTab === 'sms_mail' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <Mail className="h-4 w-4 text-indigo-500" />
                <span>E-posta & SMS Gateway Sunucuları</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-3">
                  <strong className="text-xs text-[var(--text-primary)] block">Resend SMTP Server (E-posta)</strong>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">SMTP Host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">SMTP Port</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-color)]/30">
                  <strong className="text-xs text-[var(--text-primary)] block">Netgsm API (SMS)</strong>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Kullanıcı Adı (Usercode)</label>
                      <input
                        type="text"
                        value={netgsmUser}
                        onChange={(e) => setNetgsmUser(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Şifre (Password)</label>
                      <input
                        type="password"
                        value={netgsmPass}
                        onChange={(e) => setNetgsmPass(e.target.value)}
                        className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[var(--border-color)]/50">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow"
                >
                  Sunucu Ayarlarını Kaydet
                </button>
              </div>
            </form>
          )}

          {/* BACKUPS TAB */}
          {activeTab === 'backups' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 flex items-center space-x-2">
                <Database className="h-4 w-4 text-indigo-500" />
                <span>Veritabanı Sağlığı & Yedekler</span>
              </h3>

              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <strong className="text-[var(--text-primary)] text-sm block">Son Otomatik Yedekleme</strong>
                    <span className="text-[var(--text-tertiary)] block">Sistem yedekleme durumu: <strong className="text-emerald-500">Sağlıklı</strong></span>
                    <span className="text-[var(--text-tertiary)] block">Son yedekleme tarihi: {lastBackupDate}</span>
                  </div>

                  <button
                    onClick={handleTakeBackup}
                    className="rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow hover:from-primary-700 hover:to-indigo-800 transition-all shrink-0"
                  >
                    Anlık SQL Yedeği Al
                  </button>
                </div>

                <div className="space-y-3 pt-3">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Otomatik Yedekleme Sıklığı</label>
                  
                  <div className="flex items-center space-x-6 text-xs text-[var(--text-secondary)]">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="backup"
                        checked={backupFrequency === 'daily'}
                        onChange={() => setBackupFrequency('daily')}
                        className="h-4 w-4 text-indigo-600 cursor-pointer"
                      />
                      <span>Her Gün (Gece 04:00'da)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="backup"
                        checked={backupFrequency === 'weekly'}
                        onChange={() => setBackupFrequency('weekly')}
                        className="h-4 w-4 text-indigo-600 cursor-pointer"
                      />
                      <span>Her Hafta Pazar Günü</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
