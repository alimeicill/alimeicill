'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Field } from './ui';
import { useApi } from '@/lib/api';
import { phone } from '@/lib/format';
import type { Person } from '@/lib/types';

/** Ad/soyad/telefon ile kişi arayıp seçer. */
export function PersonPicker({ value, onChange }: { value: Person | null; onChange: (p: Person | null) => void }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data } = useApi<{ items: Person[] }>(`/people?q=${encodeURIComponent(debounced)}`);

  if (value) {
    return (
      <Field label="Kişi">
        <div className="flex items-center justify-between rounded-lg border border-brand-500 bg-brand-50 px-3 py-2 text-sm dark:bg-brand-700/20">
          <span>
            {value.firstName} {value.lastName} <span className="text-slate-500">· {phone(value.phone)}</span>
          </span>
          <button type="button" className="text-xs text-brand-700 hover:underline dark:text-brand-100" onClick={() => onChange(null)}>
            Değiştir
          </button>
        </div>
      </Field>
    );
  }
  return (
    <Field label="Kişi ara (ad, soyad, telefon)">
      <input className="field" autoFocus placeholder="Yazmaya başlayın..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
        {data?.items.length ? (
          data.items.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className="flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span>
                {p.firstName} {p.lastName}
              </span>
              <span className="text-slate-500">{phone(p.phone)}</span>
            </button>
          ))
        ) : (
          <p className="px-3 py-3 text-sm text-slate-500">
            Bu aramada kişi yok.{' '}
            <Link href="/panel/kisiler?yeni=1" className="text-brand-600 hover:underline">
              Yeni kişi ekleyin
            </Link>
            .
          </p>
        )}
      </div>
    </Field>
  );
}
