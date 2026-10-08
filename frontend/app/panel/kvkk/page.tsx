'use client';

import { useState } from 'react';
import { Badge, Button, Empty, HowItWorks, Loading, PageHeader, Pills, StatCard, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { date, phone } from '@/lib/format';

interface Kvkk {
  total: number;
  consented: number;
  people: { id: string; firstName: string; lastName: string; phone: string | null; kvkkConsentAt: string | null }[];
}

export default function KvkkPage() {
  const { data, isLoading } = useApi<Kvkk>('/kvkk');
  const [filter, setFilter] = useState<'' | 'yes' | 'no'>('');
  const mark = useAction<{ id: string; consent: boolean }>('POST', (b) => `/people/${b.id}/kvkk`);
  const rows = (data?.people ?? []).filter((p) => (filter === 'yes' ? p.kvkkConsentAt : filter === 'no' ? !p.kvkkConsentAt : true));
  return (
    <>
      <HowItWorks>
        <p>
          Sakinlerin kişisel verileri (ad, telefon, TCKN, borç bilgisi) 6698 sayılı KVKK kapsamında işlenir. Aydınlatma metnini ilettiğiniz ve açık rıza aldığınız
          kişileri burada işaretleyin; onay tarihi kayıt altına alınır.
        </p>
      </HowItWorks>
      <PageHeader title="KVKK onayları" />
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <StatCard label="Toplam kişi" value={data.total} />
            <StatCard tone="green" label="Onay alınan" value={data.consented} />
            <StatCard tone="amber" label="Onay bekleyen" value={data.total - data.consented} />
          </div>
          <div className="mb-4">
            <Pills
              value={filter}
              onChange={setFilter}
              options={[
                { value: '', label: 'Tümü' },
                { value: 'yes', label: 'Onaylı' },
                { value: 'no', label: 'Bekleyen' },
              ]}
            />
          </div>
          {rows.length === 0 ? (
            <Empty>Kayıt yok.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Ad soyad</th>
                  <th>Telefon</th>
                  <th>Durum</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">
                      {p.firstName} {p.lastName}
                    </td>
                    <td>{phone(p.phone)}</td>
                    <td>{p.kvkkConsentAt ? <Badge tone="green">Onaylı · {date(p.kvkkConsentAt)}</Badge> : <Badge tone="amber">Bekliyor</Badge>}</td>
                    <td className="text-right">
                      {p.kvkkConsentAt ? (
                        <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: p.id, consent: false })}>
                          Geri al
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => mark.mutate({ id: p.id, consent: true })}>
                          Onay alındı
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </>
  );
}
