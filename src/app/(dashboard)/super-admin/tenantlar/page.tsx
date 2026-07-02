'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Settings, 
  Users, 
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  units: number;
  managerName: string;
  managerEmail: string;
  status: 'Aktif' | 'Askıda' | 'Deneme';
  createdAt: string;
}

export default function SuperAdminTenantlarPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    const savedTenants = localStorage.getItem('saas_tenants');
    if (savedTenants) {
      setTenants(JSON.parse(savedTenants));
    } else {
      const defaultTenants: Tenant[] = [
        { id: 't-1', name: 'Yıldız Konakları Sitesi', slug: 'yildiz', plan: 'PRO', units: 20, managerName: 'Hasan Korkmaz', managerEmail: 'hasan.korkmaz@yildiz.com', status: 'Aktif', createdAt: '15.01.2025' },
        { id: 't-2', name: 'Güneş Apartmanı', slug: 'gunes', plan: 'FREE', units: 8, managerName: 'Mehmet Demir', managerEmail: 'mehmet@gmail.com', status: 'Aktif', createdAt: '10.02.2025' },
        { id: 't-3', name: 'Kanyon Rezidans', slug: 'kanyon', plan: 'ENTERPRISE', units: 120, managerName: 'Murat Yıldız', managerEmail: 'murat@kanyon.com', status: 'Askıda', createdAt: '22.03.2025' }
      ];
      localStorage.setItem('saas_tenants', JSON.stringify(defaultTenants));
      setTenants(defaultTenants);
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState<Tenant | null>(null);

  // New Tenant form
  const [newSiteName, setNewSiteName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPlan, setNewPlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
  const [newUnits, setNewUnits] = useState(10);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');

  // Selected new plan for update
  const [selectedPlanType, setSelectedPlanType] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');

  const saveTenants = (updated: Tenant[]) => {
    setTenants(updated);
    localStorage.setItem('saas_tenants', JSON.stringify(updated));
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const updated = tenants.map(t => {
      if (t.id === id) {
        const nextStatus = currentStatus === 'Aktif' ? 'Askıda' : 'Aktif';
        toast.info(`${t.name} abonelik durumu değiştirildi: ${nextStatus}`);
        return { ...t, status: nextStatus as any };
      }
      return t;
    });
    saveTenants(updated);
  };

  const handleAddTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSlug.trim()) return;

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      name: newSiteName,
      slug: newSlug.toLowerCase().replace(/\s+/g, '-'),
      plan: newPlan,
      units: Number(newUnits),
      managerName: newManagerName || 'Atanmadı',
      managerEmail: newManagerEmail || 'Atanmadı',
      status: 'Aktif',
      createdAt: new Date().toLocaleDateString('tr-TR')
    };

    const updated = [...tenants, newTenant];
    saveTenants(updated);
    setIsAddOpen(false);

    // Reset Form
    setNewSiteName('');
    setNewSlug('');
    setNewPlan('FREE');
    setNewUnits(10);
    setNewManagerName('');
    setNewManagerEmail('');

    toast.success(`${newSiteName} platforma başarıyla eklendi.`);
  };

  const handleOpenPlanChange = (tenant: Tenant) => {
    setIsPlanOpen(tenant);
    setSelectedPlanType(tenant.plan);
  };

  const handleSavePlanChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlanOpen) return;

    const updated = tenants.map(t => {
      if (t.id === isPlanOpen.id) {
        return { ...t, plan: selectedPlanType };
      }
      return t;
    });

    saveTenants(updated);
    toast.success(`${isPlanOpen.name} abonelik paketi ${selectedPlanType} olarak güncellendi.`);
    setIsPlanOpen(null);
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.managerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Apartman & Site Müşterileri (Tenants)
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Platforma kayıtlı tüm müşteri site yönetimlerini, daire sayılarını ve abonelik sürelerini takip edin.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-primary-700 hover:to-indigo-800 transition-all shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Müşteri (Site) Ekle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Site (Tenants)</span>
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {tenants.length} Adet
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Aktif Abonelikler</span>
            <h3 className="text-2xl font-extrabold text-emerald-500">
              {tenants.filter(t => t.status === 'Aktif').length} Site
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Askıdaki Siteler</span>
            <h3 className="text-2xl font-extrabold text-rose-500">
              {tenants.filter(t => t.status === 'Askıda').length} Site
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </span>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 bg-[var(--bg-secondary)] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Lisanslı Daire</span>
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {tenants.reduce((sum, t) => sum + t.units, 0)} Daire
            </h3>
          </div>
          <span className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* Filter and Table Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 bg-[var(--bg-secondary)] shadow-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Site adı, subdomain veya yönetici adı ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tenants Table */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">Site / Kurum Adı</th>
                <th className="p-4">Subdomain / Domain</th>
                <th className="p-4">Paket Planı</th>
                <th className="p-4">Yönetici / İletişim</th>
                <th className="p-4">Bağımsız Bölüm</th>
                <th className="p-4">Kayıt Tarihi</th>
                <th className="p-4">Durum</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/40">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                    Kayıtlı site bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="transition-colors hover:bg-[var(--bg-tertiary)]/20">
                    <td className="p-4">
                      <strong className="text-sm text-[var(--text-primary)] block">{tenant.name}</strong>
                      <span className="text-[10px] text-[var(--text-tertiary)]">ID: {tenant.id}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[var(--text-secondary)] block">{tenant.slug}.platform.com</span>
                      <a href={`https://${tenant.slug}.platform.com`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 font-semibold inline-flex items-center gap-0.5 hover:underline mt-0.5">
                        <span>Ziyaret Et</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                        tenant.plan === 'ENTERPRISE'
                          ? 'bg-purple-100 text-purple-700'
                          : tenant.plan === 'PRO'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-[var(--text-primary)] block">{tenant.managerName}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">{tenant.managerEmail}</span>
                    </td>
                    <td className="p-4 font-bold text-[var(--text-secondary)]">
                      {tenant.units} Bağımsız Bölüm
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {tenant.createdAt}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
                        tenant.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPlanChange(tenant)}
                        className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-primary)] p-1.5 inline-flex items-center"
                        title="Paket Değiştir"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        className="rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-primary)] p-1.5 inline-flex items-center"
                        title={tenant.status === 'Aktif' ? 'Askıya Al' : 'Aktifleştir'}
                      >
                        {tenant.status === 'Aktif' ? (
                          <ToggleRight className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-rose-500" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Tenant Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/50 mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Platforma Yeni Site Kaydet</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleAddTenantSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Apartman / Site Adı</label>
                <input
                  type="text"
                  required
                  value={newSiteName}
                  onChange={(e) => {
                    setNewSiteName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  placeholder="örn: Yıldız Sitesi"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Subdomain Slug</label>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                    placeholder="yildiz"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Abonelik Planı</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="FREE">FREE (Başlangıç)</option>
                    <option value="PRO">PRO (Profesyonel)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Kurumsal)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Bağımsız Bölüm (Daire)</label>
                  <input
                    type="number"
                    required
                    value={newUnits}
                    onChange={(e) => setNewUnits(Number(e.target.value))}
                    placeholder="örn: 20"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-1 border-t border-[var(--border-color)]/50 pt-3">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Site Yöneticisi Bilgileri</label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Yönetici Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder="örn: Hasan Korkmaz"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Yönetici E-posta</label>
                <input
                  type="email"
                  required
                  value={newManagerEmail}
                  onChange={(e) => setNewManagerEmail(e.target.value)}
                  placeholder="örn: yonetici@site.com"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/50 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-primary-600 to-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow hover:from-primary-700 hover:to-indigo-800"
                >
                  Müşteriyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Subscription Plan Modal */}
      {isPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]/50 mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Abonelik Değiştir</h3>
              <button 
                onClick={() => setIsPlanOpen(null)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleSavePlanChange} className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)]">
                <strong className="text-[var(--text-primary)]">{isPlanOpen.name}</strong> sitesinin mevcut plan paketini güncelleyin.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Yeni Abonelik Paketi</label>
                <select
                  value={selectedPlanType}
                  onChange={(e) => setSelectedPlanType(e.target.value as any)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="FREE">FREE (Başlangıç)</option>
                  <option value="PRO">PRO (Profesyonel)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Kurumsal)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--border-color)]/50">
                <button
                  type="button"
                  onClick={() => setIsPlanOpen(null)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-primary-600 to-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow hover:from-primary-700 hover:to-indigo-800"
                >
                  Planı Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
