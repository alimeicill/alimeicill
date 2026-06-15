'use client';

import React, { useState, useMemo } from 'react';
import { mockUsers, mockUnits } from '@/lib/mock-data';
import { getInitials } from '@/lib/utils';
import { Search, Mail, Phone, Building2, UserCircle, Plus } from 'lucide-react';
import type { User, UserRole } from '@/types';

export default function ResidentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      site_manager: 'Site Yöneticisi',
      accountant: 'Muhasebeci',
      block_rep: 'Blok Temsilcisi',
      owner: 'Kat Maliki (Ev Sahibi)',
      tenant: 'Kiracı',
      super_admin: 'Süper Yönetici',
    };
    return labels[role];
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'site_manager':
      case 'super_admin':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
      case 'accountant':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
      case 'block_rep':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'owner':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
    }
  };

  const getAvatarColor = (role: UserRole) => {
    switch (role) {
      case 'site_manager':
      case 'super_admin':
        return 'from-indigo-500 to-indigo-600 shadow-indigo-500/20';
      case 'accountant':
        return 'from-purple-500 to-purple-600 shadow-purple-500/20';
      case 'block_rep':
        return 'from-amber-500 to-amber-600 shadow-amber-500/20';
      case 'owner':
        return 'from-blue-500 to-blue-600 shadow-blue-500/20';
      default:
        return 'from-emerald-500 to-emerald-600 shadow-emerald-500/20';
    }
  };

  // Find unit details for a user if applicable
  const getUserUnitInfo = (user: User) => {
    if (user.unitId) {
      const unit = mockUnits.find((u) => u.id === user.unitId);
      if (unit) {
        return `${unit.blockName} Blok - Daire ${unit.number}`;
      }
    }
    // Check if the user is a tenant/owner in any unit
    const unitByOwnerName = mockUnits.find((u) => u.ownerName === user.name);
    if (unitByOwnerName) {
      return `${unitByOwnerName.blockName} Blok - Daire ${unitByOwnerName.number} (Malik)`;
    }
    const unitByTenantName = mockUnits.find((u) => u.tenantName === user.name);
    if (unitByTenantName) {
      return `${unitByTenantName.blockName} Blok - Daire ${unitByTenantName.number} (Kiracı)`;
    }
    return null;
  };

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [searchTerm, roleFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Sakinler & Yönetim
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Site sakinleri, ev sahipleri, kiracılar ve idari personelin iletişim rehberi
          </p>
        </div>

        <button
          onClick={() => alert('Sakin ekleme fonksiyonu yakında eklenecektir.')}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Sakin Ekle
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Sakin ismi, e-posta veya telefon ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Roller</option>
            <option value="site_manager">Yöneticiler</option>
            <option value="accountant">Muhasebeciler</option>
            <option value="block_rep">Blok Temsilcileri</option>
            <option value="owner">Ev Sahipleri</option>
            <option value="tenant">Kiracılar</option>
          </select>
        </div>
      </div>

      {/* Grid of Resident Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-[var(--text-tertiary)]">
            Kriterlere uygun kayıt bulunamadı.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const unitInfo = getUserUnitInfo(user);
            const initials = getInitials(user.name);
            const avatarColor = getAvatarColor(user.role);
            
            return (
              <div 
                key={user.id}
                className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Decorative glow corner based on role */}
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full bg-gradient-to-tr ${avatarColor} opacity-5 blur-xl`} />

                {/* Upper row: Avatar & Initials and Role Badge */}
                <div className="flex items-start space-x-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr text-white text-sm font-extrabold shadow-sm ${avatarColor}`}>
                    {initials}
                  </div>
                  
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-bold text-[var(--text-primary)] truncate text-sm">
                      {user.name}
                    </h3>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>

                {/* Communication Info */}
                <div className="mt-6 space-y-3 pt-4 border-t border-[var(--border-color)]/50 text-xs text-[var(--text-secondary)]">
                  {/* Unit info if applicable */}
                  {unitInfo && (
                    <div className="flex items-center space-x-2.5">
                      <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-[var(--text-primary)]">{unitInfo}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Mail className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center space-x-2.5">
                      <Phone className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => alert(`${user.name} için doğrudan mesaj paneli geliştirme aşamasındadır.`)}
                    className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 hover:bg-primary-500/10 hover:text-primary-500 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] transition-colors w-full"
                  >
                    Mesaj Gönder
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
