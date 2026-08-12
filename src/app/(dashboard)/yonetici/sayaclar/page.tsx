'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { mockUnits } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { Gauge, Plus, Download, Check, Sparkles, Filter, Search, ArrowLeft, Landmark, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface MeterReading {
  id: string;
  unitId: string;
  unitNumber: string;
  residentName: string;
  type: 'water' | 'electricity' | 'gas' | 'heating';
  period: string;
  previousReading: number;
  currentReading: number;
  unitPrice: number;
  multiplier: number; // Ortak alan çarpanı
  billed: boolean;
  billedInvoiceId?: string;
  createdAt: string;
}

const mockMeterReadings: MeterReading[] = [
  {
    id: 'met-001',
    unitId: 'u-101',
    unitNumber: 'A-01',
    residentName: 'Ahmet Yılmaz',
    type: 'water',
    period: '2026-06',
    previousReading: 120,
    currentReading: 135,
    unitPrice: 24.5,
    multiplier: 1.0,
    billed: true,
    billedInvoiceId: 'inv-12345',
    createdAt: '2026-06-01'
  },
  {
    id: 'met-002',
    unitId: 'u-102',
    unitNumber: 'A-02',
    residentName: 'Ayşe Demir',
    type: 'electricity',
    period: '2026-06',
    previousReading: 1540,
    currentReading: 1720,
    unitPrice: 3.2,
    multiplier: 1.1, // %10 ortak gider çarpanı
    billed: true,
    billedInvoiceId: 'inv-12346',
    createdAt: '2026-06-01'
  },
  {
    id: 'met-003',
    unitId: 'u-103',
    unitNumber: 'A-03',
    residentName: 'Mehmet Kaya',
    type: 'water',
    period: '2026-07',
    previousReading: 95,
    currentReading: 112,
    unitPrice: 25.0,
    multiplier: 1.0,
    billed: false,
    createdAt: '2026-07-01'
  },
  {
    id: 'met-004',
    unitId: 'u-104',
    unitNumber: 'A-04',
    residentName: 'Fatma Şahin',
    type: 'electricity',
    period: '2026-07',
    previousReading: 2100,
    currentReading: 2280,
    unitPrice: 3.5,
    multiplier: 1.15, // %15 ortak alan elektrik farkı
    billed: false,
    createdAt: '2026-07-02'
  }
];

export default function MeterReadingsPage() {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [meterType, setMeterType] = useState<'water' | 'electricity' | 'gas' | 'heating'>('water');
  const [period, setPeriod] = useState('2026-07');
  const [previousReading, setPreviousReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [unitPrice, setUnitPrice] = useState('25.0');
  const [multiplier, setMultiplier] = useState('1.0');

  useEffect(() => {
    const savedReadings = localStorage.getItem('meter_readings');
    if (savedReadings) {
      setReadings(JSON.parse(savedReadings));
    } else {
      localStorage.setItem('meter_readings', JSON.stringify(mockMeterReadings));
      setReadings(mockMeterReadings);
    }
  }, []);

  const saveReadings = (newReadings: MeterReading[]) => {
    setReadings(newReadings);
    localStorage.setItem('meter_readings', JSON.stringify(newReadings));
  };

  // Automatically fetch previous reading when unit and meter type change
  useEffect(() => {
    if (!selectedUnitId) return;
    const sameMeters = readings.filter(r => r.unitId === selectedUnitId && r.type === meterType);
    if (sameMeters.length > 0) {
      // Find the highest currentReading as the new previousReading
      const maxReading = Math.max(...sameMeters.map(m => m.currentReading));
      setPreviousReading(maxReading.toString());
    } else {
      setPreviousReading('0');
    }

    // Populate default prices
    if (meterType === 'water') setUnitPrice('25.0');
    else if (meterType === 'electricity') setUnitPrice('3.5');
    else if (meterType === 'gas') setUnitPrice('12.0');
    else if (meterType === 'heating') setUnitPrice('1.8');
  }, [selectedUnitId, meterType, readings]);

  const getMeterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      water: 'Süzme Su',
      electricity: 'Süzme Elektrik',
      gas: 'Süzme Doğalgaz',
      heating: 'Isı Pay Ölçer'
    };
    return labels[type] || type;
  };

  const getMeterTypeUnit = (type: string) => {
    return type === 'water' || type === 'gas' ? 'm³' : 'kWh';
  };

  // Calculations
  const calculatedStats = useMemo(() => {
    const totalConsumption = readings.reduce((sum, r) => sum + (r.currentReading - r.previousReading), 0);
    const totalAmount = readings.reduce((sum, r) => {
      const consumption = r.currentReading - r.previousReading;
      return sum + (consumption * r.unitPrice * r.multiplier);
    }, 0);
    const billedCount = readings.filter(r => r.billed).length;
    const unbilledCount = readings.filter(r => !r.billed).length;

    return { totalConsumption, totalAmount, billedCount, unbilledCount };
  }, [readings]);

  // Filtered readings
  const filteredReadings = useMemo(() => {
    return readings.filter(r => {
      const matchesSearch =
        r.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.residentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'billed' && r.billed) ||
        (statusFilter === 'unbilled' && !r.billed);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [readings, searchTerm, typeFilter, statusFilter]);

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      toast.error('Lütfen bir daire seçiniz.');
      return;
    }
    const prev = Number(previousReading);
    const curr = Number(currentReading);
    if (isNaN(curr) || curr < prev) {
      toast.error('Son endeks ilk endeksten küçük olamaz.');
      return;
    }

    const unit = mockUnits.find(u => u.id === selectedUnitId);
    if (!unit) return;

    const newReading: MeterReading = {
      id: `met-${Date.now()}`,
      unitId: selectedUnitId,
      unitNumber: unit.number,
      residentName: unit.tenantName || unit.ownerName || 'Bilinmeyen Sakin',
      type: meterType,
      period,
      previousReading: prev,
      currentReading: curr,
      unitPrice: Number(unitPrice),
      multiplier: Number(multiplier),
      billed: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    saveReadings([newReading, ...readings]);
    toast.success(`${unit.number} dairesi için ${getMeterTypeLabel(meterType)} okuması başarıyla kaydedildi.`);
    setIsAddModalOpen(false);
    setCurrentReading('');
    setSelectedUnitId('');
  };

  // Convert a meter reading to a dynamic invoice in localStorage invoices_list
  const handleBillReading = (reading: MeterReading) => {
    if (reading.billed) {
      toast.warning('Bu sayaç zaten borçlandırılmış.');
      return;
    }

    const consumption = reading.currentReading - reading.previousReading;
    const netAmount = consumption * reading.unitPrice * reading.multiplier;
    const totalAmount = Math.round(netAmount * 100) / 100;
    
    // 1. Create invoice object
    const invoiceId = `inv-${Date.now()}`;
    const newInvoice = {
      id: invoiceId,
      tenantId: 'tenant-001',
      unitId: reading.unitId,
      unitNumber: reading.unitNumber,
      ownerName: reading.residentName,
      period: reading.period,
      totalAmount: totalAmount,
      paidAmount: 0,
      status: 'sent' as const,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
      createdAt: new Date().toISOString(),
      items: [
        {
          id: `ii-${Math.random().toString(36).substring(7)}`,
          description: `${getMeterTypeLabel(reading.type)} Tüketim Bedeli (${consumption} ${getMeterTypeUnit(reading.type)} x ₺${reading.unitPrice} * Çarpan: ${reading.multiplier})`,
          amount: totalAmount,
          type: 'charge' as const
        }
      ]
    };

    // 2. Load existing invoices from localStorage, append, and save
    const savedInvsStr = localStorage.getItem('invoices_list');
    let existingInvs = [];
    try {
      existingInvs = savedInvsStr ? JSON.parse(savedInvsStr) : [];
    } catch (e) {
      existingInvs = [];
    }

    const updatedInvs = [newInvoice, ...existingInvs];
    localStorage.setItem('invoices_list', JSON.stringify(updatedInvs));
    window.dispatchEvent(new Event('storage'));

    // 3. Mark reading as billed
    const updatedReadings = readings.map(r => {
      if (r.id === reading.id) {
        return { ...r, billed: true, billedInvoiceId: invoiceId };
      }
      return r;
    });
    saveReadings(updatedReadings);

    toast.success(`${reading.unitNumber} dairesi için ${formatCurrency(totalAmount)} tutarında sayaç faturası kesildi ve borçlandırıldı.`);
  };

  const handleBillAll = () => {
    const unbilled = readings.filter(r => !r.billed);
    if (unbilled.length === 0) {
      toast.info('Borçlandırılacak yeni sayaç okuması bulunmuyor.');
      return;
    }

    const savedInvsStr = localStorage.getItem('invoices_list');
    let existingInvs = [];
    try {
      existingInvs = savedInvsStr ? JSON.parse(savedInvsStr) : [];
    } catch (e) {
      existingInvs = [];
    }

    const nowTime = Date.now();
    const newInvoices = unbilled.map((reading, index) => {
      const consumption = reading.currentReading - reading.previousReading;
      const netAmount = consumption * reading.unitPrice * reading.multiplier;
      const totalAmount = Math.round(netAmount * 100) / 100;
      const invoiceId = `inv-${nowTime}-${index}`;
      
      return {
        id: invoiceId,
        tenantId: 'tenant-001',
        unitId: reading.unitId,
        unitNumber: reading.unitNumber,
        ownerName: reading.residentName,
        period: reading.period,
        totalAmount: totalAmount,
        paidAmount: 0,
        status: 'sent' as const,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        items: [
          {
            id: `ii-${Math.random().toString(36).substring(7)}`,
            description: `${getMeterTypeLabel(reading.type)} Tüketim Bedeli (${consumption} ${getMeterTypeUnit(reading.type)} x ₺${reading.unitPrice})`,
            amount: totalAmount,
            type: 'charge' as const
          }
        ]
      };
    });

    localStorage.setItem('invoices_list', JSON.stringify([...newInvoices, ...existingInvs]));
    window.dispatchEvent(new Event('storage'));

    const updatedReadings = readings.map(r => {
      const matchingNew = newInvoices.find(inv => inv.id.includes(r.id) || r.unitId === inv.unitId && r.period === inv.period && !r.billed);
      if (matchingNew) {
        return { ...r, billed: true, billedInvoiceId: matchingNew.id };
      }
      if (!r.billed) {
        return { ...r, billed: true, billedInvoiceId: `inv-${nowTime}` };
      }
      return r;
    });

    saveReadings(updatedReadings);
    toast.success(`${unbilled.length} adet yeni sayaç okuması toplu olarak borçlandırıldı ve fatura oluşturuldu.`);
  };

  const handleExportData = () => {
    toast.success('Sayaç Okumaları raporu Excel (CSV) olarak indiriliyor...');
    const headerRow = 'Okuma No,Daire,Sakin,Sayaç Tipi,Dönem,İlk Endeks,Son Endeks,Tüketim,Birim Fiyat,Çarpan,Toplam Tutar,Fatura Durumu\n';
    const csvContent = readings.map(r => {
      const consumption = r.currentReading - r.previousReading;
      const totalAmount = consumption * r.unitPrice * r.multiplier;
      return `"${r.id}","${r.unitNumber}","${r.residentName}","${getMeterTypeLabel(r.type)}","${r.period}",${r.previousReading},${r.currentReading},${consumption},${r.unitPrice},${r.multiplier},${totalAmount},"${r.billed ? 'Borçlandırıldı' : 'Bekliyor'}"`;
    }).join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(headerRow + csvContent)}`;
    link.download = `sayac_okumalari_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Süzme Sayaç Yönetimi
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Daire bazlı elektrik, su, doğalgaz okumaları, ortak alan paylaşımlı fatura kesme işlemleri
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportData}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            Excel Raporu
          </button>
          
          <button
            onClick={handleBillAll}
            className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 px-4 py-2.5 text-sm font-semibold shadow-sm transition-all"
          >
            <Landmark className="mr-2 h-4 w-4" />
            Toplu Borçlandır ({readings.filter(r => !r.billed).length})
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Okuma Ekle
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Toplam Sayaç Kaydı</span>
          <h3 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{readings.length}</h3>
          <div className="absolute right-4 bottom-4 text-indigo-500/20">
            <Gauge className="h-10 w-10" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Toplam Tüketim Hacmi</span>
          <h3 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {calculatedStats.totalConsumption.toLocaleString('tr-TR')} <span className="text-xs text-[var(--text-secondary)]">Birim</span>
          </h3>
          <div className="absolute right-4 bottom-4 text-indigo-500/20">
            <Sparkles className="h-10 w-10" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Hesaplanan Toplam Tutar</span>
          <h3 className="text-3xl font-extrabold text-emerald-500 tracking-tight">
            {formatCurrency(calculatedStats.totalAmount)}
          </h3>
          <div className="absolute right-4 bottom-4 text-emerald-500/20">
            <Landmark className="h-10 w-10" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Bekleyen Okumalar</span>
          <h3 className="text-3xl font-extrabold text-amber-500 tracking-tight">
            {calculatedStats.unbilledCount} <span className="text-xs text-[var(--text-secondary)]">adet fatura bekleyen</span>
          </h3>
          <div className="absolute right-4 bottom-4 text-amber-500/20">
            <FileText className="h-10 w-10" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Daire no veya sakin adı ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">Tüm Sayaç Tipleri</option>
              <option value="water">Süzme Su</option>
              <option value="electricity">Süzme Elektrik</option>
              <option value="gas">Süzme Doğalgaz</option>
              <option value="heating">Isı Pay Ölçer</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">Tüm Faturalandırma Durumları</option>
              <option value="billed">Borçlandırılanlar</option>
              <option value="unbilled">Bekleyenler (Fatura Kesilmemiş)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Readings Table */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="p-4">Daire</th>
                <th className="p-4">Sakin</th>
                <th className="p-4">Sayaç Tipi</th>
                <th className="p-4">Dönem</th>
                <th className="p-4">İlk Endeks</th>
                <th className="p-4">Son Endeks</th>
                <th className="p-4">Tüketim</th>
                <th className="p-4">Birim Fiyat</th>
                <th className="p-4">Çarpan</th>
                <th className="p-4">Hesaplanan Tutar</th>
                <th className="p-4 text-center">Fatura Durumu</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-sm">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-sm text-[var(--text-tertiary)]">
                    Kriterlere uygun sayaç okuma kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredReadings.map((reading) => {
                  const consumption = reading.currentReading - reading.previousReading;
                  const totalAmount = consumption * reading.unitPrice * reading.multiplier;
                  return (
                    <tr 
                      key={reading.id} 
                      className="group transition-colors duration-150 hover:bg-[var(--bg-tertiary)]/20"
                    >
                      <td className="p-4 font-semibold text-[var(--text-primary)]">
                        {reading.unitNumber}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">
                        {reading.residentName}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          reading.type === 'water' ? 'bg-blue-500/10 text-blue-500' :
                          reading.type === 'electricity' ? 'bg-amber-500/10 text-amber-500' :
                          reading.type === 'gas' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {getMeterTypeLabel(reading.type)}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-mono">
                        {reading.period}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-mono">
                        {reading.previousReading} {getMeterTypeUnit(reading.type)}
                      </td>
                      <td className="p-4 text-[var(--text-primary)] font-bold font-mono">
                        {reading.currentReading} {getMeterTypeUnit(reading.type)}
                      </td>
                      <td className="p-4 text-indigo-500 font-bold font-mono">
                        {consumption} {getMeterTypeUnit(reading.type)}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-mono">
                        ₺{reading.unitPrice.toFixed(2)}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-mono">
                        x{reading.multiplier.toFixed(2)}
                      </td>
                      <td className="p-4 font-bold text-[var(--text-primary)] font-mono">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          reading.billed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {reading.billed ? <Check className="h-3 w-3" /> : null}
                          {reading.billed ? 'Borçlandırıldı' : 'Bekliyor'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {!reading.billed ? (
                          <button
                            onClick={() => handleBillReading(reading)}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
                          >
                            Fatura Kes
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--text-tertiary)] italic">Borçlandırıldı</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reading Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Yeni Sayaç Okuması Ekle
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleAddReading} className="p-6 space-y-4">
              {/* Daire Seçimi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Daire Seçimi</label>
                <select
                  value={selectedUnitId}
                  required
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="">Seçiniz...</option>
                  {mockUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.number} - {unit.tenantName || unit.ownerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sayaç Tipi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Sayaç Tipi</label>
                <select
                  value={meterType}
                  onChange={(e) => setMeterType(e.target.value as any)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="water">Süzme Su</option>
                  <option value="electricity">Süzme Elektrik</option>
                  <option value="gas">Süzme Doğalgaz</option>
                  <option value="heating">Isı Pay Ölçer</option>
                </select>
              </div>

              {/* Dönem */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Okuma Dönemi</label>
                <input
                  type="text"
                  required
                  placeholder="2026-07"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              {/* Endeksler Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">İlk Endeks ({getMeterTypeUnit(meterType)})</label>
                  <input
                    type="number"
                    required
                    value={previousReading}
                    onChange={(e) => setPreviousReading(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Son Endeks ({getMeterTypeUnit(meterType)})</label>
                  <input
                    type="number"
                    required
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Fiyat & Çarpan Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Birim Fiyat (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Ortak Gider Çarpanı</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700"
                >
                  Okumayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
