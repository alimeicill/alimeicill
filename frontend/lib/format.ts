const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });
const num = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** API'den gelen Decimal değerler string olarak gelir. */
export const toNum = (v: string | number | null | undefined) => (v == null || v === '' ? 0 : Number(v));
export const money = (v: string | number | null | undefined) => tl.format(toNum(v));
export const amount = (v: string | number | null | undefined) => num.format(toNum(v));

export const date = (v: string | Date | null | undefined) =>
  v ? new Date(v).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const dateTime = (v: string | Date | null | undefined) =>
  v ? new Date(v).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const today = () => new Date().toISOString().slice(0, 10);

export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const periodLabel = (p: string) => `${MONTHS[Number(p.slice(5)) - 1]} ${p.slice(0, 4)}`;

export const phone = (v: string | null | undefined) =>
  v && /^\d{10}$/.test(v) ? `0 (${v.slice(0, 3)}) ${v.slice(3, 6)} ${v.slice(6, 8)} ${v.slice(8)}` : v || '—';

/** UTF-8 BOM'lu CSV — Excel Türkçe karakterleri doğru açar. */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
