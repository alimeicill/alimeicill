'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building, ShieldCheck, User, Wrench, ShieldAlert, ArrowRight } from 'lucide-react';

export default function DashboardRouterPage() {
  const router = useRouter();

  const handleSelectRole = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="glass border border-[var(--border-color)] w-full max-w-xl rounded-3xl p-8 shadow-xl space-y-6 text-center animate-slide-up">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold">
            <Building className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Hesap / Rol Seçimi</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Bağlı olduğunuz birden fazla apartman veya yetki seti tespit edildi. Devam etmek için birini seçin.
          </p>
        </div>

        {/* Roles List */}
        <div className="space-y-4">
          {[
            {
              name: 'Yıldız Konakları Sitesi',
              role: 'Site Yöneticisi',
              icon: ShieldCheck,
              path: '/yonetici/dashboard',
              color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400',
            },
            {
              name: 'Yıldız Konakları Sitesi',
              role: 'Daire Sakini (Blok A, Daire 12)',
              icon: User,
              path: '/sakin/dashboard',
              color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400',
            },
            {
              name: 'Yıldız Konakları Sitesi',
              role: 'Teknik Personel (Baş Teknisyen)',
              icon: Wrench,
              path: '/personel/dashboard',
              color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400',
            },
            {
              name: 'SaaS Platform Yönetimi',
              role: 'Platform Sahibi (Super Admin)',
              icon: ShieldAlert,
              path: '/super-admin/dashboard',
              color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSelectRole(item.path)}
                className="w-full text-left p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-primary-500/30 hover:shadow-md transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-bold text-sm text-[var(--text-primary)] truncate">{item.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">{item.role}</span>
                  </div>
                </div>

                <span className="p-1 rounded-lg bg-[var(--bg-tertiary)] group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
