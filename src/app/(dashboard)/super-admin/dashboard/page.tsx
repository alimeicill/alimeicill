'use client';

import React, { useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Building2, Users, CreditCard, ShieldCheck, Activity, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function SuperAdminDashboardPage() {
  const [tenants, setTenants] = useState([
    { id: '1', name: 'Yıldız Konakları Sitesi', slug: 'yildiz', plan: 'PRO', units: 20, status: 'Aktif' },
    { id: '2', name: 'Güneş Apartmanı', slug: 'gunes', plan: 'FREE', units: 8, status: 'Aktif' },
    { id: '3', name: 'Kanyon Rezidans', slug: 'kanyon', plan: 'ENTERPRISE', units: 120, status: 'Askıda' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleStatus = (id: string) => {
    setTenants(tenants.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'Aktif' ? 'Askıda' : 'Aktif' };
      }
      return t;
    }));
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          SaaS Kontrol Paneli
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Platform Yönetimi (Super Admin) — SaaS Sağlığı ve Tenant İzleme
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Kayıtlı Tenant"
          value={tenants.length}
          subtitle="Aktif apartman ve site yönetimleri"
          icon={Building2}
          color="blue"
        />

        <StatCard
          title="Aylık Yinelenen Gelir (MRR)"
          value={formatCurrency(18900)}
          subtitle="Aktif aboneliklerin aylık geliri"
          icon={CreditCard}
          trend="up"
          trendValue="%14.2 artış"
          color="green"
        />

        <StatCard
          title="Aktif Kullanıcı (DAU)"
          value="450"
          subtitle="Bugün sisteme bağlanan sakin/yönetici"
          icon={Users}
          trend="up"
          trendValue="+32 yeni"
          color="purple"
        />

        <StatCard
          title="Sistem Durumu"
          value="%99.98"
          subtitle="API sunucuları çalışma yüzdesi"
          icon={Activity}
          color="green"
        />
      </div>

      {/* Tenant Management Table */}
      <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Tenant (Müşteri) Yönetimi</h3>
          
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Tenant adı veya slug ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-1.5 pl-9 pr-4 text-xs text-[var(--text-primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">Tenant Adı</th>
                <th className="p-4">Subdomain / Slug</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Daire Sayısı</th>
                <th className="p-4">Durum</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="transition-colors hover:bg-[var(--bg-tertiary)]/20">
                  <td className="p-4 font-bold text-[var(--text-primary)]">{tenant.name}</td>
                  <td className="p-4 font-mono text-[var(--text-secondary)]">{tenant.slug}.platform.com</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                      tenant.plan === 'ENTERPRISE' 
                        ? 'bg-purple-100 text-purple-700' 
                        : tenant.plan === 'PRO' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-[var(--text-secondary)]">{tenant.units} Daire</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
                      tenant.status === 'Aktif' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(tenant.id)}
                      className="inline-flex items-center space-x-1.5 text-primary-500 hover:text-primary-600 font-bold"
                    >
                      {tenant.status === 'Aktif' ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-emerald-500" />
                          <span>Askıya Al</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-rose-500" />
                          <span>Aktifleştir</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
