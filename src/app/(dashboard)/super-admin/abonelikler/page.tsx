'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  Settings, 
  Users, 
  Building2, 
  Check, 
  Edit2, 
  TrendingUp, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  maxUnits: number | 'Sınırsız';
  maxManagers: number | 'Sınırsız';
  storageGb: number;
  features: string[];
  status: 'Aktif' | 'Pasif';
  activeTenants: number;
}

interface PlatformInvoice {
  id: string;
  tenantName: string;
  planName: string;
  amount: number;
  date: string;
  status: 'Başarılı' | 'Beklemede' | 'Başarısız';
  billingPeriod: string;
}

export default function SuperAdminAboneliklerPage() {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 'plan-free',
      name: 'FREE (Başlangıç)',
      price: 0,
      maxUnits: 10,
      maxManagers: 1,
      storageGb: 0.1,
      features: ['Temel Daire Takibi', 'Temel Borç Ekleme', 'E-posta Bildirimi', 'Duyuru Paneli'],
      status: 'Aktif',
      activeTenants: 1
    },
    {
      id: 'plan-pro',
      name: 'PRO (Profesyonel)',
      price: 1200,
      maxUnits: 100,
      maxManagers: 3,
      storageGb: 5,
      features: ['Otomatik Aidat Hesaplama', 'Kredi Kartı Entegrasyonu', 'Toplu SMS & Mail', 'Personel Takip Modülü', 'Ziyaretçi QR Davet Sistemi'],
      status: 'Aktif',
      activeTenants: 1
    },
    {
      id: 'plan-enterprise',
      name: 'ENTERPRISE (Kurumsal)',
      price: 4500,
      maxUnits: 'Sınırsız',
      maxManagers: 'Sınırsız',
      storageGb: 50,
      features: ['Özel Alan Adı (Custom Domain)', 'Stripe & İyzico POS Kurulumu', 'AI Yönetici Asistanı', 'Plaka Tanıma Webhook', 'VIP Destek & Özel Danışman'],
      status: 'Aktif',
      activeTenants: 1
    }
  ]);

  const [invoices, setInvoices] = useState<PlatformInvoice[]>([
    { id: 'pinv-001', tenantName: 'Yıldız Konakları Sitesi', planName: 'PRO (Profesyonel)', amount: 1200, date: '15.06.2026', status: 'Başarılı', billingPeriod: 'Haziran 2026' },
    { id: 'pinv-002', tenantName: 'Kanyon Rezidans', planName: 'ENTERPRISE (Kurumsal)', amount: 4500, date: '12.06.2026', status: 'Başarılı', billingPeriod: 'Haziran 2026' },
    { id: 'pinv-003', tenantName: 'Güneş Apartmanı', planName: 'FREE (Başlangıç)', amount: 0, date: '01.06.2026', status: 'Başarılı', billingPeriod: 'Haziran 2026' }
  ]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editMaxUnits, setEditMaxUnits] = useState<string | number>('');
  const [editMaxManagers, setEditMaxManagers] = useState<string | number>('');
  const [editStorageGb, setEditStorageGb] = useState(0);
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Pasif'>('Aktif');

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setEditPrice(plan.price);
    setEditMaxUnits(plan.maxUnits);
    setEditMaxManagers(plan.maxManagers);
    setEditStorageGb(plan.storageGb);
    setEditStatus(plan.status);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const updated = plans.map(p => {
      if (p.id === selectedPlan.id) {
        return {
          ...p,
          price: Number(editPrice),
          maxUnits: (editMaxUnits === 'Sınırsız' ? 'Sınırsız' : Number(editMaxUnits)) as number | 'Sınırsız',
          maxManagers: (editMaxManagers === 'Sınırsız' ? 'Sınırsız' : Number(editMaxManagers)) as number | 'Sınırsız',
          storageGb: Number(editStorageGb),
          status: editStatus
        };
      }
      return p;
    });

    setPlans(updated);
    toast.success(`${selectedPlan.name} limiti başarıyla güncellendi.`);
    setSelectedPlan(null);
  };

  const totalTenants = plans.reduce((sum, p) => sum + p.activeTenants, 0);
  const totalMrr = plans.reduce((sum, p) => sum + (p.price * p.activeTenants), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Abonelik Planları Yönetimi
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          SaaS platformundaki paket fiyatlarını, daire/yönetici limitlerini ve özellik paketlerini denetleyin.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Aylık Yinelenen Gelir (MRR)</span>
            <h3 className="text-2xl font-extrabold text-emerald-500">
              {formatCurrency(totalMrr)}
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Üye Site (Tenants)</span>
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {totalTenants} Adet
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Aktif Lisans Paketleri</span>
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {plans.filter(p => p.status === 'Aktif').length} Paket
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Son Ödemeler (Bu Ay)</span>
            <h3 className="text-2xl font-extrabold text-indigo-500">
              {formatCurrency(invoices.filter(i => i.status === 'Başarılı').reduce((sum, i) => sum + i.amount, 0))}
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* Plans List Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Mevcut Üyelik Paketleri</h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 relative overflow-hidden">
              {plan.status === 'Pasif' && (
                <div className="absolute inset-0 bg-black/5 z-10 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="bg-rose-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow">Pasif Durumda</span>
                </div>
              )}

              {/* Title & Price */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-base text-[var(--text-primary)]">{plan.name}</h4>
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="text-[var(--text-tertiary)] hover:text-indigo-500 p-1.5 rounded-lg transition-colors"
                    title="Planı Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                    {plan.price === 0 ? 'Ücretsiz' : formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && <span className="text-xs text-[var(--text-tertiary)]">/ ay</span>}
                </div>
              </div>

              {/* Limits */}
              <div className="rounded-xl bg-[var(--bg-primary)] p-4 border border-[var(--border-color)] text-xs space-y-2.5 text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Maks. Daire Limiti:</span>
                  <strong className="text-[var(--text-primary)]">{plan.maxUnits} Daire</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Maks. Yönetici Limiti:</span>
                  <strong className="text-[var(--text-primary)]">{plan.maxManagers} Yönetici</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Dosya Depolama:</span>
                  <strong className="text-[var(--text-primary)]">
                    {plan.storageGb >= 1 ? `${plan.storageGb} GB` : `${plan.storageGb * 1000} MB`}
                  </strong>
                </div>
                <div className="pt-2 border-t border-[var(--border-color)]/40 flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Aktif Tenant Sayısı:</span>
                  <strong className="text-indigo-500">{plan.activeTenants} Site</strong>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5 flex-1">
                <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">İçerik & Modüller</span>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Platform Invoices */}
      <div className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Son Abonelik Tahsilatları</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] font-bold">
                <th className="pb-3">Apartman / Site</th>
                <th className="pb-3">Satın Alınan Paket</th>
                <th className="pb-3">Fatura Dönemi</th>
                <th className="pb-3">Tarih</th>
                <th className="pb-3">Durum</th>
                <th className="pb-3 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/40">
              {invoices.map((inv) => (
                <tr key={inv.id} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <td className="py-3.5">
                    <strong className="text-[var(--text-primary)] block text-sm">{inv.tenantName}</strong>
                    <span className="text-[10px] text-[var(--text-tertiary)]">İşlem: {inv.id}</span>
                  </td>
                  <td className="py-3.5 font-medium">{inv.planName}</td>
                  <td className="py-3.5">{inv.billingPeriod}</td>
                  <td className="py-3.5">{inv.date}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                      inv.status === 'Başarılı' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-extrabold text-[var(--text-primary)] text-sm">
                    {inv.amount === 0 ? 'Ücretsiz' : formatCurrency(inv.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Settings Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/50 mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedPlan.name} Paketini Düzenle</h3>
              <button 
                onClick={() => setSelectedPlan(null)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Aylık Paket Fiyatı (₺)</label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  placeholder="örn: 1500"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Maksimum Daire</label>
                  <input
                    type="text"
                    required
                    value={editMaxUnits}
                    onChange={(e) => setEditMaxUnits(e.target.value)}
                    placeholder="örn: 50 veya Sınırsız"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Maksimum Yönetici</label>
                  <input
                    type="text"
                    required
                    value={editMaxManagers}
                    onChange={(e) => setEditMaxManagers(e.target.value)}
                    placeholder="örn: 3 veya Sınırsız"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Depolama Boyutu (GB)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editStorageGb}
                    onChange={(e) => setEditStorageGb(Number(e.target.value))}
                    placeholder="örn: 10"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Paket Durumu</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="Aktif">Aktif (Satışta)</option>
                    <option value="Pasif">Pasif (Satış Dışı)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/50 mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-primary-600 to-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow hover:from-primary-700 hover:to-indigo-800"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
