'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import type { Unit, UnitStatus, UnitType } from '@/types';
import { toast } from 'sonner';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockFilter, setBlockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('daireler_list');
    if (saved) {
      setUnits(JSON.parse(saved));
    } else {
      localStorage.setItem('daireler_list', JSON.stringify(mockUnits));
      setUnits(mockUnits);
    }
  }, []);

  const saveUnits = (newUnits: Unit[]) => {
    setUnits(newUnits);
    localStorage.setItem('daireler_list', JSON.stringify(newUnits));
  };

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

  // Form states for new unit modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState('A');
  const [newNumber, setNewNumber] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newType, setNewType] = useState<UnitType>('residential');
  const [newAreaSqm, setNewAreaSqm] = useState('');
  const [newOwnershipShare, setNewOwnershipShare] = useState('5');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newStatus, setNewStatus] = useState<UnitStatus>('vacant');

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName || !newNumber || !newFloor || !newAreaSqm) {
      toast.error('Blok Adı, Daire No, Kat ve Metrekare alanları zorunludur.');
      return;
    }

    // Unique combination check (Block + Number)
    if (units.some(u => u.blockName.toLowerCase() === newBlockName.toLowerCase() && u.number.toLowerCase() === newNumber.toLowerCase())) {
      toast.error(`Bu blokta (${newBlockName}) ${newNumber} numaralı daire zaten mevcuttur.`);
      return;
    }

    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      tenantId: 'tenant-001',
      blockName: newBlockName.trim().toUpperCase(),
      floor: parseInt(newFloor),
      number: newNumber.trim(),
      areaSqm: parseFloat(newAreaSqm),
      ownershipShare: parseFloat(newOwnershipShare) || 0,
      ownerName: newOwnerName.trim() || undefined,
      tenantName: newTenantName.trim() || undefined,
      status: newStatus,
      type: newType
    };

    const updatedUnits = [...units, newUnit];
    saveUnits(updatedUnits);

    // Reset fields
    setNewBlockName('A');
    setNewNumber('');
    setNewFloor('');
    setNewType('residential');
    setNewAreaSqm('');
    setNewOwnershipShare('5');
    setNewOwnerName('');
    setNewTenantName('');
    setNewStatus('vacant');

    setShowAddModal(false);
    toast.success('Yeni daire başarıyla eklendi.');
  };

  const handleDeleteUnit = (unitId: string) => {
    if (window.confirm('Bu daireyi silmek istediğinize emin misiniz?')) {
      const updated = units.filter(u => u.id !== unitId);
      saveUnits(updated);
      toast.success('Daire başarıyla silindi.');
    }
  };

  // Unique blocks
  const blocks = useMemo(() => {
    return Array.from(new Set(units.map((u) => u.blockName))).sort();
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        unit.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (unit.ownerName && unit.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (unit.tenantName && unit.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesBlock = blockFilter === 'all' || unit.blockName === blockFilter;
      const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;

      return matchesSearch && matchesBlock && matchesStatus;
    });
  }, [units, searchTerm, blockFilter, statusFilter]);

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
          onClick={() => setShowAddModal(true)}
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
                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => alert(`Detaylar: ${unit.blockName} Blok Daire ${unit.number}`)}
                    className="flex-1 text-center rounded-xl bg-[var(--bg-tertiary)] hover:bg-primary-500/10 hover:text-primary-500 py-2 text-xs font-bold text-[var(--text-secondary)] transition-all"
                  >
                    Detaylar
                  </button>
                  <button 
                    onClick={() => handleDeleteUnit(unit.id)}
                    className="px-3 text-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white py-2 text-xs font-bold transition-all"
                    title="Daireyi Sil"
                  >
                    Sil
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
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
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
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-500 hover:text-white px-2.5 py-1 text-xs font-bold text-rose-500 transition-colors"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Yeni Daire Ekle */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Yeni Daire Ekle</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-semibold"
              >
                Kapat
              </button>
            </div>
            
            <form onSubmit={handleAddUnit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Blok Adı *</label>
                  <input
                    type="text"
                    required
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="Örn. A"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Daire No *</label>
                  <input
                    type="text"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="Örn. 15"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Bulunduğu Kat *</label>
                  <input
                    type="number"
                    required
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    placeholder="Örn. 3"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Daire Tipi *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as UnitType)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="residential">Konut (Daire)</option>
                    <option value="commercial">Ticari (Dükkan/Ofis)</option>
                    <option value="parking">Otopark</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Metrekare (m²) *</label>
                  <input
                    type="number"
                    required
                    value={newAreaSqm}
                    onChange={(e) => setNewAreaSqm(e.target.value)}
                    placeholder="Örn. 120"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Arsa Payı Oranı (x/100)</label>
                  <input
                    type="number"
                    value={newOwnershipShare}
                    onChange={(e) => setNewOwnershipShare(e.target.value)}
                    placeholder="Örn. 5"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Kat Malik (Sahibi)</label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Ev sahibi adı"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Kiracı Adı</label>
                  <input
                    type="text"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="Varsa kiracı adı"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Durum *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UnitStatus)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="vacant">Boş</option>
                  <option value="occupied">Dolu</option>
                  <option value="maintenance">Bakımda</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Daireyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
