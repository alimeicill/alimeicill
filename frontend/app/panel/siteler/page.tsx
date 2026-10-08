'use client';

import { Building2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button, Empty, ErrorText, Field, HowItWorks, Loading, Modal, PageHeader } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import type { Site } from '@/lib/types';

export default function SitesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Sites />
    </Suspense>
  );
}

function Sites() {
  const params = useSearchParams();
  const { data: sites, isLoading } = useApi<Site[]>('/sites');
  const [wizard, setWizard] = useState(false);
  useEffect(() => {
    if (params.get('yeni')) setWizard(true);
  }, [params]);

  return (
    <>
      <HowItWorks>
        <p>
          Her <strong>site</strong> blok ve bağımsız bölümlerden (daire, dükkân) oluşur. Kurulum sihirbazı blokları ve daireleri tek seferde oluşturur;
          sonra site detayından tek tek düzenleyebilirsiniz.
        </p>
        <p>Her yeni site için otomatik olarak bir kasa hesabı açılır, böylece tahsilatları hemen kaydedebilirsiniz.</p>
      </HowItWorks>
      <PageHeader
        title="Siteler ve daireler"
        actions={
          <Button onClick={() => setWizard(true)}>
            <Plus className="size-4" /> Yeni site
          </Button>
        }
      />
      {isLoading ? (
        <Loading />
      ) : !sites?.length ? (
        <Empty>Henüz site yok. «Yeni site» ile kurulum sihirbazını başlatın.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((s) => (
            <Link key={s.id} href={`/panel/siteler/${s.id}`} className="card group p-5 transition hover:border-brand-500 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-700/20">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white">
                    {s.name} {s.code && <span className="text-xs font-normal text-slate-400">({s.code})</span>}
                  </div>
                  <div className="text-sm text-slate-500">{[s.district, s.city].filter(Boolean).join(' / ') || 'Adres girilmemiş'}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Blok</div>
                  <div className="font-semibold">{s._count?.blocks ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Bağımsız bölüm</div>
                  <div className="font-semibold">{s._count?.units ?? 0}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <SiteWizard open={wizard} onClose={() => setWizard(false)} />
    </>
  );
}

interface BlockPlan {
  name: string;
  unitCount: string;
  startNo: string;
}

function SiteWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [site, setSite] = useState({ name: '', code: '', city: '', district: '', address: '' });
  const [blocks, setBlocks] = useState<BlockPlan[]>([{ name: 'A Blok', unitCount: '8', startNo: '1' }]);
  const create = useAction<unknown, Site>('POST', '/sites', {
    onSuccess: (s) => {
      close();
      router.push(`/panel/siteler/${s.id}`);
    },
  });

  function close() {
    setStep(1);
    setSite({ name: '', code: '', city: '', district: '', address: '' });
    setBlocks([{ name: 'A Blok', unitCount: '8', startNo: '1' }]);
    create.reset();
    onClose();
  }

  const totalUnits = blocks.reduce((a, b) => a + (Number(b.unitCount) || 0), 0);
  const updateBlock = (i: number, patch: Partial<BlockPlan>) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const nextLetter = () => `${String.fromCharCode(65 + blocks.length)} Blok`;

  return (
    <Modal
      open={open}
      onClose={close}
      wide
      title={`Kurulum sihirbazı — ${step === 1 ? 'Site bilgileri' : 'Blok ve daireler'}`}
      footer={
        step === 1 ? (
          <>
            <Button variant="secondary" onClick={close}>
              Vazgeç
            </Button>
            <Button disabled={site.name.trim().length < 2} onClick={() => setStep(2)}>
              Devam
            </Button>
          </>
        ) : (
          <>
            <span className="mr-auto text-sm text-slate-500">
              Toplam <strong>{blocks.length}</strong> blok, <strong>{totalUnits}</strong> bağımsız bölüm oluşturulacak.
            </span>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Geri
            </Button>
            <Button
              loading={create.isPending}
              onClick={() => create.mutate({ ...site, blocks: blocks.map((b) => ({ name: b.name, unitCount: Number(b.unitCount) || 0, startNo: Number(b.startNo) || 1 })) })}
            >
              Siteyi oluştur
            </Button>
          </>
        )
      }
    >
      <div className="flex gap-2 text-xs">
        {['Site bilgileri', 'Blok ve daireler'].map((s, i) => (
          <span key={s} className={i + 1 === step ? 'rounded-full bg-brand-600 px-3 py-1 text-white' : 'rounded-full bg-slate-100 px-3 py-1 text-slate-500 dark:bg-slate-800'}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Site adı" required className="sm:col-span-2">
            <input className="field" autoFocus value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} placeholder="Örn. Hazar Siteleri" />
          </Field>
          <Field label="Kısa kod">
            <input className="field" value={site.code} onChange={(e) => setSite({ ...site, code: e.target.value })} placeholder="HZR" />
          </Field>
          <Field label="İl">
            <input className="field" value={site.city} onChange={(e) => setSite({ ...site, city: e.target.value })} />
          </Field>
          <Field label="İlçe">
            <input className="field" value={site.district} onChange={(e) => setSite({ ...site, district: e.target.value })} />
          </Field>
          <Field label="Adres" className="sm:col-span-2">
            <textarea className="field" rows={2} value={site.address} onChange={(e) => setSite({ ...site, address: e.target.value })} />
          </Field>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Her blok için daire sayısını ve ilk kapı numarasını girin. Tek binalı apartmanlar için tek blok yeterlidir.</p>
          {blocks.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_100px_36px] items-end gap-2">
              <Field label={i === 0 ? 'Blok adı' : ''}>
                <input className="field" value={b.name} onChange={(e) => updateBlock(i, { name: e.target.value })} />
              </Field>
              <Field label={i === 0 ? 'Daire sayısı' : ''}>
                <input className="field" inputMode="numeric" value={b.unitCount} onChange={(e) => updateBlock(i, { unitCount: e.target.value.replace(/\D/g, '') })} />
              </Field>
              <Field label={i === 0 ? 'İlk kapı no' : ''}>
                <input className="field" inputMode="numeric" value={b.startNo} onChange={(e) => updateBlock(i, { startNo: e.target.value.replace(/\D/g, '') })} />
              </Field>
              <Button variant="ghost" className="h-9" disabled={blocks.length === 1} onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} aria-label="Bloğu kaldır">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setBlocks([...blocks, { name: nextLetter(), unitCount: blocks.at(-1)?.unitCount ?? '8', startNo: '1' }])}>
            <Plus className="size-3.5" /> Blok ekle
          </Button>
        </div>
      )}
      <ErrorText error={create.error} />
    </Modal>
  );
}
