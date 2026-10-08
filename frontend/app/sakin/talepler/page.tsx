'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Empty, ErrorText, Field, Loading, Modal, Table } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { TICKET_STATUS, type TicketStatus } from '@/lib/types';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  response: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ResidentTickets() {
  const { data } = useApi<Ticket[]>('/portal/tickets');
  const [open, setOpen] = useState(false);
  return (
    <Card
      title={<span className="text-emerald-700 dark:text-emerald-400">TALEP LİSTESİ</span>}
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> Yeni talep
        </Button>
      }
    >
      {!data ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty>Henüz talep açmadınız.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>Güncelleme</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-slate-500">{t.description}</div>
                  {t.response && <div className="mt-1 rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Yönetim: {t.response}</div>}
                </td>
                <td>
                  <Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge>
                </td>
                <td className="whitespace-nowrap">{dateTime(t.createdAt)}</td>
                <td className="whitespace-nowrap">{dateTime(t.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <NewTicket open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}

function NewTicket({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: settings } = useApi<{ units: { id: string; label: string }[] }>(open ? '/portal/settings' : null);
  const [form, setForm] = useState({ unitId: '', title: '', description: '' });
  const save = useAction('POST', '/portal/tickets', {
    onSuccess: () => {
      setForm({ unitId: '', title: '', description: '' });
      onClose();
    },
  });
  const unitId = form.unitId || settings?.units[0]?.id || '';
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni talep / arıza"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate({ ...form, unitId })}>
            Gönder
          </Button>
        </>
      }
    >
      {settings && settings.units.length > 1 && (
        <Field label="Daire">
          <select className="field" value={unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
            {settings.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Başlık" required>
        <input className="field" placeholder="Örn. Asansör çalışmıyor" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Açıklama" required>
        <textarea className="field" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <ErrorText error={save.error} />
    </Modal>
  );
}
