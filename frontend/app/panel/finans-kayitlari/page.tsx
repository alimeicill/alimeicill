'use client';

import { ArrowLeftRight, ClipboardCheck, FileText, Receipt, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { TransferModal, TxModal } from '@/components/tx-modals';
import { Badge, Button, Card, Empty, ErrorText, Loading, PageHeader, Pills, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { date, money } from '@/lib/format';
import { SOURCE_LABEL, type CashTx } from '@/lib/types';

type Source = '' | CashTx['source'];

export default function FinanceRecordsPage() {
  const [source, setSource] = useState<Source>('');
  const { data, isLoading } = useApi<CashTx[]>(`/transactions?source=${source}&take=200`);
  const [tx, setTx] = useState<'IN' | 'OUT' | null>(null);
  const [transfer, setTransfer] = useState(false);
  const del = useAction<string>('DELETE', (id) => `/transactions/${id}`);

  return (
    <>
      <PageHeader title="Finans kayıtları" />
      <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Hızlı işlemler</div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => setTx('IN')}>
          <TrendingUp className="size-4" /> Gelir kaydet
        </Button>
        <Button variant="secondary" onClick={() => setTx('OUT')}>
          <Receipt className="size-4" /> Gider kaydet
        </Button>
        <Link href="/panel/daire-borclari" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          <ClipboardCheck className="size-4" /> Borçlandırma yap
        </Link>
        <Link href="/panel/faturalar?yeni=1" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          <FileText className="size-4" /> Fatura ekle
        </Link>
        <Button variant="secondary" onClick={() => setTransfer(true)}>
          <ArrowLeftRight className="size-4" /> Virman
        </Button>
      </div>

      <Card title="Finans hareketleri" subtitle="Kasa ve banka hesaplarına giren ve çıkan tüm kayıtlar.">
        <div className="mb-4">
          <Pills<Source>
            value={source}
            onChange={setSource}
            options={[
              { value: '', label: 'Tümü' },
              { value: 'COLLECTION', label: 'Tahsilatlar' },
              { value: 'INCOME', label: 'Gelir girişleri' },
              { value: 'EXPENSE', label: 'Gider kayıtları' },
              { value: 'INVOICE_PAYMENT', label: 'Fatura ödemeleri' },
              { value: 'TRANSFER', label: 'Virmanlar' },
            ]}
          />
        </div>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>Henüz kayıt yok. Hızlı işlemlerden gelir, gider, borçlandırma veya fatura ekleyebilirsiniz.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Tür</th>
                <th>Açıklama</th>
                <th>Hesap</th>
                <th>Site</th>
                <th className="!text-right">Tutar</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap">{date(t.date)}</td>
                  <td>
                    <Badge tone={t.direction === 'IN' ? 'green' : 'red'}>{SOURCE_LABEL[t.source]}</Badge>
                  </td>
                  <td>
                    {t.description || '—'}
                    <div className="text-xs text-slate-500">{[t.financeItem?.name, t.currentAccount?.title].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td>{t.paymentAccount?.name}</td>
                  <td>{t.site?.name ?? '—'}</td>
                  <td className={`text-right font-medium tabular-nums ${t.direction === 'IN' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {t.direction === 'IN' ? '+' : '−'}
                    {money(t.amount)}
                  </td>
                  <td className="text-right">
                    {t.source !== 'COLLECTION' && (
                      <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => window.confirm('Kayıt silinsin mi?') && del.mutate(t.id)}>
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="mt-3">
          <ErrorText error={del.error} />
        </div>
      </Card>
      <TxModal direction={tx} onClose={() => setTx(null)} />
      <TransferModal open={transfer} onClose={() => setTransfer(false)} />
    </>
  );
}
