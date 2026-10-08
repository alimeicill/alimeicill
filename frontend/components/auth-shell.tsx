import { BRAND } from '@/lib/brand';

/** Giriş/kayıt ekranlarının ortak arka planı: lacivert zemin, silik bina silüetleri. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#0e7490_0%,transparent_45%),radial-gradient(ellipse_at_bottom_right,#1e3a8a_0%,transparent_50%)] opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <Buildings className="pointer-events-none absolute bottom-0 right-0 h-[70%] text-sky-300/10" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl md:grid-cols-[1fr_1fr]">
        <div className="relative hidden flex-col bg-gradient-to-br from-navy-900 to-navy-950 p-10 text-white md:flex">
          <div className="text-2xl font-bold tracking-tight">{BRAND}</div>
          <h2 className="mt-12 text-3xl font-bold leading-tight">Site yönetimi artık daha düzenli.</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">Aidat, tahsilat, fatura ve sakin işlemlerini tek panelden yönetin.</p>
          <div className="mt-8 h-1 w-14 rounded bg-accent-400" />
          <Buildings className="absolute bottom-0 right-6 h-64 text-sky-200/15" />
        </div>
        <div className="bg-white p-8 sm:p-10 dark:bg-slate-900">{children}</div>
      </div>
    </main>
  );
}

function Buildings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="20" y="120" width="70" height="280" />
      <rect x="110" y="40" width="80" height="360" />
      <rect x="210" y="170" width="70" height="230" />
      {Array.from({ length: 14 }, (_, r) =>
        [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={122 + c * 22} y={56 + r * 24} width="10" height="12" fill="currentColor" stroke="none" />),
      )}
      {Array.from({ length: 10 }, (_, r) =>
        [0, 1].map((c) => <rect key={`a${r}-${c}`} x={34 + c * 26} y={136 + r * 25} width="10" height="12" fill="currentColor" stroke="none" />),
      )}
      {Array.from({ length: 8 }, (_, r) =>
        [0, 1].map((c) => <rect key={`b${r}-${c}`} x={224 + c * 26} y={186 + r * 25} width="10" height="12" fill="currentColor" stroke="none" />),
      )}
    </svg>
  );
}
