'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { mockUnits, mockInvoices, mockUsers } from '@/lib/mock-data';
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
  Percent,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Landmark,
  Download,
  ClipboardList
} from 'lucide-react';
import type { Unit, UnitStatus, UnitType } from '@/types';
import { toast } from 'sonner';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<Unit | null>(null);

  // Helper: Retrieve contact info for unit owners/tenants
  const getUserDetails = (name?: string) => {
    if (!name) return null;
    return mockUsers.find(u => u.name.toLowerCase() === name.toLowerCase()) || null;
  };

  // Helper: Calculate unit financials
  const getUnitFinancials = (unitNumber: string) => {
    const unitInvs = mockInvoices.filter(
      inv => inv.unitNumber.toLowerCase() === unitNumber.toLowerCase()
    );
    const totalInvoiced = unitInvs.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = unitInvs.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalDebt = totalInvoiced - totalPaid;
    return {
      invoices: unitInvs,
      totalInvoiced,
      totalPaid,
      totalDebt,
    };
  };
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
  
  // Custom alignment fields states
  const [newRooms, setNewRooms] = useState('3+1');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [newVehicle, setNewVehicle] = useState('');
  const [newPet, setNewPet] = useState('');

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
      type: newType,
      rooms: newRooms.trim() || '3+1',
      emergencyName: newEmergencyName.trim() || undefined,
      emergencyPhone: newEmergencyPhone.trim() || undefined,
      vehicles: newVehicle.trim() ? [newVehicle.trim()] : [],
      pets: newPet.trim() ? [newPet.trim()] : [],
      residentHistory: [
        { date: new Date().toISOString().split('T')[0], action: 'Kayıt', resident: newOwnerName.trim() || newTenantName.trim() || 'Yeni Sakin' }
      ]
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
    setNewRooms('3+1');
    setNewEmergencyName('');
    setNewEmergencyPhone('');
    setNewVehicle('');
    setNewPet('');

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

  const handleExportData = (type: 'excel' | 'pdf') => {
    toast.success(`${type === 'excel' ? 'Excel (CSV)' : 'PDF Raporu'} başarıyla oluşturuldu ve indiriliyor...`);
    const headerRow = 'ID,Blok,Daire No,Kat,Tip,Alan (m2),Arsa Payi,Malik,Sakin,Durum\n';
    const csvContent = units.map(u => 
      `"${u.id}","${u.blockName}","${u.number}",${u.floor},"${u.type}",${u.areaSqm},${u.ownershipShare},"${u.ownerName || ''}","${u.tenantName || ''}","${u.status}"`
    ).join('\n');
    
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(headerRow + csvContent)}`;
    link.download = `daireler_listesi_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'csv' : 'txt'}`;
    link.click();
  };

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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportData('excel')}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            Excel Aktar
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Daire Ekle
          </button>
        </div>
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
                    onClick={() => setSelectedUnitForDetail(unit)}
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
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedUnitForDetail(unit)}
                          className="rounded-lg border border-[var(--border-color)] hover:bg-primary-500/10 hover:text-primary-500 hover:border-primary-500 px-2.5 py-1 text-xs font-bold text-[var(--text-secondary)] transition-colors"
                        >
                          Detay
                        </button>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Oda Sayısı *</label>
                  <input
                    type="text"
                    required
                    value={newRooms}
                    onChange={(e) => setNewRooms(e.target.value)}
                    placeholder="Örn. 3+1"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Acil Durum Kişisi</label>
                  <input
                    type="text"
                    value={newEmergencyName}
                    onChange={(e) => setNewEmergencyName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Acil Durum Tel</label>
                  <input
                    type="text"
                    value={newEmergencyPhone}
                    onChange={(e) => setNewEmergencyPhone(e.target.value)}
                    placeholder="+90 532..."
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Araç Plakası</label>
                  <input
                    type="text"
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    placeholder="Örn. 34 ABC 123"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Evcil Hayvan</label>
                  <input
                    type="text"
                    value={newPet}
                    onChange={(e) => setNewPet(e.target.value)}
                    placeholder="Örn. Pamuk (Kedi)"
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
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

      {/* Modal: Daire Detayları */}
      {selectedUnitForDetail && (() => {
        const unit = selectedUnitForDetail;
        const ownerDetails = getUserDetails(unit.ownerName);
        const tenantDetails = getUserDetails(unit.tenantName);
        const financials = getUnitFinancials(unit.number);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="glass w-full max-w-2xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{unit.blockName} - {unit.number}</h3>
                    <p className="text-xs text-white/80">Daire Detayları ve Finansal Durum</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUnitForDetail(null)} 
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <span className="text-sm font-bold">Kapat</span>
                </button>
              </div>

              {/* Content Grid */}
              <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                
                {/* 1. Daire Genel Bilgileri */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-2.5 border border-[var(--border-color)]/30">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-0.5">Daire Tipi</span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-primary)]">
                      {getTypeIcon(unit.type)}
                      {getTypeLabel(unit.type)}
                    </span>
                  </div>

                  <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-2.5 border border-[var(--border-color)]/30">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-0.5">Kat Bilgisi</span>
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{unit.floor}. Kat</span>
                  </div>

                  <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-2.5 border border-[var(--border-color)]/30">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-0.5">Oda Sayısı</span>
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{unit.rooms || '3+1'}</span>
                  </div>

                  <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-2.5 border border-[var(--border-color)]/30">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-0.5">Brüt Alan</span>
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{unit.areaSqm} m²</span>
                  </div>

                  <div className="bg-[var(--bg-tertiary)]/50 rounded-xl p-2.5 border border-[var(--border-color)]/30">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-0.5">Arsa Payı</span>
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{unit.ownershipShare}/100</span>
                  </div>
                </div>

                {/* 2. Daire Durumu ve İlişkili Kişiler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tapu Sahibi */}
                  <div className="border border-[var(--border-color)]/60 rounded-2xl p-4 bg-[var(--bg-tertiary)]/10 space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      <span>Kat Maliki (Ev Sahibi)</span>
                    </h4>
                    {unit.ownerName ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{unit.ownerName}</p>
                        {ownerDetails ? (
                          <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                            <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {ownerDetails.email}</p>
                            <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {ownerDetails.phone}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-tertiary)] italic">İletişim bilgisi bulunamadı.</p>
                        )}
                        {!unit.tenantName && unit.emergencyName && (
                          <div className="mt-2 pt-2 border-t border-[var(--border-color)]/30 text-[10px] text-[var(--text-secondary)]">
                            <span className="font-bold text-[var(--text-tertiary)] uppercase block text-[8px] mb-0.5">Acil Durum İrtibat:</span>
                            <strong>{unit.emergencyName}</strong>: {unit.emergencyPhone || '-'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-tertiary)] italic">Kat maliki tanımlanmamış.</p>
                    )}
                  </div>

                  {/* Kiracı */}
                  <div className="border border-[var(--border-color)]/60 rounded-2xl p-4 bg-[var(--bg-tertiary)]/10 space-y-3">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      <span>Sakin (Kiracı) Bilgisi</span>
                    </h4>
                    {unit.tenantName ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{unit.tenantName}</p>
                        {tenantDetails ? (
                          <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                            <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {tenantDetails.email}</p>
                            <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> {tenantDetails.phone}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-tertiary)] italic">İletişim bilgisi bulunamadı.</p>
                        )}
                        {unit.emergencyName && (
                          <div className="mt-2 pt-2 border-t border-[var(--border-color)]/30 text-[10px] text-[var(--text-secondary)]">
                            <span className="font-bold text-[var(--text-tertiary)] uppercase block text-[8px] mb-0.5">Acil Durum İrtibat:</span>
                            <strong>{unit.emergencyName}</strong>: {unit.emergencyPhone || '-'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--text-tertiary)] italic py-2">
                        {unit.status === 'vacant' ? (
                          <span className="text-emerald-500 font-semibold">Daire Boş</span>
                        ) : (
                          <div className="space-y-2">
                            <span>Kiracı kaydı bulunamadı (Ev sahibi oturuyor).</span>
                            {unit.emergencyName && (
                              <div className="mt-2 pt-2 border-t border-[var(--border-color)]/30 text-[10px] text-[var(--text-secondary)]">
                                <span className="font-bold text-[var(--text-tertiary)] uppercase block text-[8px] mb-0.5">Acil Durum İrtibat:</span>
                                <strong>{unit.emergencyName}</strong>: {unit.emergencyPhone || '-'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2.5. Araç & Evcil Hayvan Bilgileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-[var(--border-color)]/60 rounded-2xl p-4 bg-[var(--bg-tertiary)]/10 space-y-2">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      <span>Kayıtlı Araç Plakaları</span>
                    </h4>
                    {unit.vehicles && unit.vehicles.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {unit.vehicles.map((v, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-xs font-bold text-[var(--text-primary)]">
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-tertiary)] italic">Kayıtlı araç bulunmamaktadır.</p>
                    )}
                  </div>

                  <div className="border border-[var(--border-color)]/60 rounded-2xl p-4 bg-[var(--bg-tertiary)]/10 space-y-2">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      <span>Evcil Hayvan Kayıtları</span>
                    </h4>
                    {unit.pets && unit.pets.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {unit.pets.map((p, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)]">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-tertiary)] italic">Kayıtlı evcil hayvan bulunmamaktadır.</p>
                    )}
                  </div>
                </div>

                {/* 2.7. Sakin Geçmişi Zaman Çizelgesi */}
                <div className="border border-[var(--border-color)]/60 rounded-2xl p-4 bg-[var(--bg-tertiary)]/10 space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-indigo-500" />
                    <span>Daire Sakin Geçmişi (Aktif/Pasif)</span>
                  </h4>
                  {unit.residentHistory && unit.residentHistory.length > 0 ? (
                    <div className="space-y-3 pl-2 pt-1">
                      {unit.residentHistory.map((hist, idx) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-indigo-500/30 last:border-transparent pb-1">
                          <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500"></span>
                          <div className="flex justify-between text-[11px]">
                            <strong className="text-[var(--text-primary)]">{hist.resident}</strong>
                            <span className="text-[var(--text-tertiary)] font-mono">{hist.date}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">İşlem: {hist.action}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-tertiary)] italic">Geçmiş sakin veya kiralama kaydı bulunmamaktadır.</p>
                  )}
                </div>

                {/* 3. Finansal Durum & Aidat Borcu */}
                <div className="border border-[var(--border-color)]/60 rounded-2xl p-4 bg-[var(--bg-tertiary)]/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-indigo-500" />
                      <span>Aidat ve Finansal Durum</span>
                    </h4>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${financials.totalDebt > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {financials.totalDebt > 0 ? `Toplam Borç: ₺${financials.totalDebt.toLocaleString('tr-TR')}` : 'Borç Bulunmuyor'}
                    </span>
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]/50">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold block mb-1">Toplam Tahakkuk</span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">₺{financials.totalInvoiced.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]/50">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold block mb-1">Toplam Ödenen</span>
                      <span className="text-xs font-bold text-emerald-500">₺{financials.totalPaid.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]/50">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold block mb-1">Kalan Bakiye (Borç)</span>
                      <span className={`text-xs font-bold ${financials.totalDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ₺{financials.totalDebt.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {/* Last Invoices List */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">Son Fatura Kayıtları</span>
                    {financials.invoices.length === 0 ? (
                      <p className="text-xs text-[var(--text-tertiary)] italic py-2">Daireye ait fatura kaydı bulunmamaktadır.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {financials.invoices.map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]/30">
                            <div className="space-y-0.5">
                              <p className="font-bold text-[var(--text-primary)]">{inv.period} Aidat Ödemesi</p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">Son Ödeme: {inv.dueDate}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-[var(--text-secondary)]">₺{inv.totalAmount.toLocaleString('tr-TR')}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                                inv.status === 'overdue' ? 'bg-rose-500/10 text-rose-500' :
                                'bg-amber-500/10 text-amber-500'
                              }`}>
                                {inv.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                {inv.status === 'paid' ? 'Ödendi' : inv.status === 'overdue' ? 'Gecikti' : 'Bekliyor'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-[var(--bg-tertiary)]/30 px-6 py-4 border-t border-[var(--border-color)] flex justify-end">
                <button
                  onClick={() => setSelectedUnitForDetail(null)}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-indigo-600 hover:to-indigo-700 transition-all"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
