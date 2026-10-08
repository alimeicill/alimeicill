'use client';

import { useState } from 'react';
import { Badge, Button, Empty, ErrorText, Field, Loading, Modal, PageHeader, Pills } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { dateTime, phone } from '@/lib/format';
import { TICKET_STATUS as STATUS, type TicketStatus as Status } from '@/lib/types';


interface Ticket {
  id: string;
  title: string;
  description: string;
  status: Status;
  response: string | null;
  createdAt: string;
  updatedAt: string;
  site: { name: string };
  unit: { doorNo: string; block: { name: string } } | null;
  person: { firstName: string; lastName: string; phone: string | null } | null;
}

export default function TicketsPage() {
  const [status, setStatus] = useState<'' | Status>('');
  const { data, isLoading } = useApi<Ticket[]>(`/tickets?status=${status}`);
  const [sel, setSel] = useState<Ticket | null>(null);
  return (
    <>
      <PageHeader title="Talep / arıza" description="Sakinlerin panelden açtığı arıza ve talepler." />
      <div className="mb-4">
        <Pills
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Tümü' },
            { value: 'OPEN', label: 'Açık' },
            { value: 'IN_PROGRESS', label: 'İşlemde' },
            { value: 'DONE', label: 'Tamamlandı' },
          ]}
        />
      </div>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Talep yok.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((t) => (
            <button key={t.id} type="button" onClick={() => setSel(t)} className="card p-4 text-left transition hover:border-brand-500">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{t.title}</div>
                <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{t.description}</p>
              <div className="mt-2 text-xs text-slate-500">
                {t.site.name}
                {t.unit && ` · ${t.unit.block.name}/${t.unit.doorNo}`}
                {t.person && ` · ${t.person.firstName} ${t.person.lastName}`} · {dateTime(t.createdAt)}
              </div>
            </button>
          ))}
        </div>
      )}
      <TicketModal ticket={sel} onClose={() => setSel(null)} />
    </>
  );
}

function TicketModal({ ticket, onClose }: { ticket: Ticket | null; onClose: () => void }) {
  const [form, setForm] = useState<{ status: Status; response: string }>({ status: 'OPEN', response: '' });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if ((ticket?.id ?? null) !== loadedFor) {
    setLoadedFor(ticket?.id ?? null);
    setForm({ status: ticket?.status ?? 'OPEN', response: ticket?.response ?? '' });
  }
  const save = useAction('PATCH', `/tickets/${ticket?.id}`, { onSuccess: onClose });
  return (
    <Modal
      open={!!ticket}
      onClose={onClose}
      title={ticket?.title ?? ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Kapat
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate(form)}>
            Kaydet
          </Button>
        </>
      }
    >
      {ticket && (
        <>
          <div className="text-sm text-slate-500">
            {ticket.site.name}
            {ticket.unit && ` · ${ticket.unit.block.name}/${ticket.unit.doorNo}`}
            {ticket.person && ` · ${ticket.person.firstName} ${ticket.person.lastName} (${phone(ticket.person.phone)})`}
          </div>
          <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">{ticket.description}</p>
          <Field label="Durum">
            <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
              {(Object.keys(STATUS) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Yanıt (sakin görür)">
            <textarea className="field" rows={3} value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} />
          </Field>
          <ErrorText error={save.error} />
        </>
      )}
    </Modal>
  );
}
