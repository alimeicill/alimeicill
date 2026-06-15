'use client';

import React, { useState, useMemo } from 'react';
import { mockUnits } from '@/lib/mock-data';
import { getStatusColor } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  Building2, 
  Home, 
  Briefcase, 
  Compass,
  User,
  Percent
} from 'lucide-react';

export default function UnitsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [blockFilter, setBlockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      occupied: 'Dolu',
      vacant: 'Boş',
      maintenance: 'Bakımda',
    };
    return labels[status] || status;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'residential':
        return <Home className="h-4 w-4" />;
      case 'commercial':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Compass className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residential: 'Konut',
      commercial: 'Ticari',
      parking: 'Otopark',
    };
    return labels[type] || type;
  };

  // Unique blocks
  const blocks = useMemo(() => {
    return Array.from(new Set(mockUnits.map((u) => u.blockName))).sort();
  }, []);

  const filteredUnits = useMemo(() => {
    return mockUnits.filter((unit) => {
      const matchesSearch =
        unit.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (unit.ownerName && unit.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (unit.tenantName && unit.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesBlock = blockFilter === 'all' || unit.blockName === blockFilter;
      const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;

      return matchesSearch && matchesBlock && matchesStatus;
    });
  }, [searchTerm, blockFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Daireler
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Sitedeki bağımsız bölümlerin doluluk durumları, tapu sahipleri ve kiracı kayıtları
          </p>
        </div>

        <button
          onClick={() => alert('Daire ekleme fonksiyonu yakında eklenecektir.')}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Daire Ekle
        </button>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Daire no, malik veya kiracı adı ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Bloklar</option>
            {blocks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="occupied">Dolu</option>
            <option value="vacant">Boş</option>
            <option value="maintenance">Bakımda</option>
          </select>

          <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden shrink-0 bg-[var(--bg-primary)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-[var(--text-tertiary)]">
              Kriterlere uygun daire bulunamadı.
            </div>
          ) : (
            filteredUnits.map((unit) => (
              <div 
                key={unit.id}
                className="glass relative overflow-hidden rounded-2xl border border-[var(--border-color)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">
                        {unit.blockName} - {unit.number}
                      </h4>
                      <span className="text-xs text-[var(--text-secondary)]">
                        Kat {unit.floor}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(unit.status)}`}>
                    {getStatusLabel(unit.status)}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-xs border-b border-[var(--border-color)]/50 pb-2">
                    <span className="text-[var(--text-tertiary)]">Daire Tipi:</span>
                    <span className="flex items-center gap-1 font-semibold text-[var(--text-secondary)]">
                      {getTypeIcon(unit.type)}
                      {getTypeLabel(unit.type)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-[var(--border-color)]/50 pb-2">
                    <span className="text-[var(--text-tertiary)]">Büyüklük / Arsa Payı:</span>
                    <span className="font-semibold text-[var(--text-secondary)]">
                      {unit.areaSqm}m² / {unit.ownershipShare}/100
                    </span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-[var(--border-color)]/50 pb-2">
                    <span className="text-[var(--text-tertiary)]">Kat Malik (Sahip):</span>
                    <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {unit.ownerName || 'Bilinmiyor'}
                    </span>
                  </div>

                  {unit.tenantName && (
                    <div className="flex justify-between text-xs pb-1">
                      <span className="text-[var(--text-tertiary)]">Kiracı:</span>
                      <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {unit.tenantName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => alert(`Detaylar: ${unit.blockName} Blok Daire ${unit.number}`)}
                    className="w-full text-center rounded-xl bg-[var(--bg-tertiary)] hover:bg-primary-500/10 hover:text-primary-500 py-2.5 text-xs font-bold text-[var(--text-secondary)] transition-all"
                  >
                    Detayları Görüntüle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* List View */
        <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="p-4">Daire</th>
                  <th className="p-4">Kat</th>
                  <th className="p-4">Tip</th>
                  <th className="p-4">Alan</th>
                  <th className="p-4">Tapu Sahibi</th>
                  <th className="p-4">Kiracı</th>
                  <th className="p-4 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                      Daire kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr 
                      key={unit.id}
                      className="group transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20"
                    >
                      <td className="p-4 font-bold text-[var(--text-primary)]">
                        {unit.blockName} - {unit.number}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        {unit.floor}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">
                        {getTypeLabel(unit.type)}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        {unit.areaSqm} m²
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        {unit.ownerName || '-'}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        {unit.tenantName || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(unit.status)}`}>
                          {getStatusLabel(unit.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
