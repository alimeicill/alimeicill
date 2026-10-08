'use client';

import { Info, Loader2, X } from 'lucide-react';
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-brand-700 to-brand-500 text-white hover:from-brand-600 hover:to-brand-500 shadow-sm',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  success: 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-sm',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, required, children, className }: { label: string; hint?: ReactNode; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Checkbox({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="size-4 accent-brand-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Card({ children, className, title, subtitle, actions }: { children: ReactNode; className?: string; title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cx('card p-5', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  blue: 'bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900',
  amber: 'bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900',
  orange: 'bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900',
  green: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900',
  rose: 'bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900',
  plain: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
};

export function StatCard({ label, value, sub, icon, tone = 'plain' }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <div className={cx('flex items-start gap-3 rounded-xl border p-4 shadow-sm', TONES[tone])}>
      {icon && <div className="rounded-lg bg-white/70 p-2 text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">{icon}</div>}
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 truncate text-xl font-semibold text-slate-900 tabular-nums dark:text-white">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Sayfanın üstündeki açılır "Nasıl çalışır?" kutusu. */
export function HowItWorks({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-100/60 text-sm dark:border-slate-800 dark:bg-slate-900/60">
      <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 font-medium" onClick={() => setOpen(!open)}>
        <Info className="size-4 text-brand-600" /> Nasıl çalışır?
      </button>
      {open && <div className="space-y-1.5 border-t border-slate-200 px-4 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">{children}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">{children}</div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
      {error instanceof Error ? error.message : String(error)}
    </div>
  );
}

const BADGE = {
  gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  red: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  blue: 'bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-100',
};

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: keyof typeof BADGE }) {
  return <span className={cx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', BADGE[tone])}>{children}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[1px] sm:pt-10">
      <div className={cx('card w-full shadow-xl', wide ? 'max-w-3xl' : 'max-w-lg')} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Kapat">
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cx(
            '-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition',
            value === t.value
              ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-100'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Pills<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
            value === o.value
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Tablo kabı — dar ekranlarda yatay kaydırma tabloyla sınırlı kalır. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[640px] text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 [&_thead]:bg-slate-50 dark:[&_thead]:bg-slate-900 [&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100 dark:[&_tbody_tr]:border-slate-800 [&_tbody_tr:hover]:bg-slate-50/70 dark:[&_tbody_tr:hover]:bg-slate-800/40">
        {children}
      </table>
    </div>
  );
}

/** Onay isteyen silme/iptal butonu. */
export function ConfirmButton({
  onConfirm,
  children,
  message = 'Bu işlemi onaylıyor musunuz?',
  loading,
  variant = 'ghost',
}: {
  onConfirm: () => void;
  children: ReactNode;
  message?: string;
  loading?: boolean;
  variant?: Variant;
}) {
  return (
    <Button size="sm" variant={variant} loading={loading} onClick={() => window.confirm(message) && onConfirm()}>
      {children}
    </Button>
  );
}
