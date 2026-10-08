'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, ConfirmButton, Empty, ErrorText, Field, Loading, Modal, PageHeader } from '@/components/ui';
import { useAction, useApi } from '@/lib/api';
import { dateTime } from '@/lib/format';
import type { Site } from '@/lib/types';

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  site: { name: string } | null;
}

export default function AnnouncementsPage() {
  const { data, isLoading } = useApi<Announcement[]>('/announcements');
  const [open, setOpen] = useState(false);
  const del = useAction<string>('DELETE', (id) => `/announcements/${id}`);
  return (
    <>
      <PageHeader
        title="Duyurular"
        description="Duyurular sakin panelinin ana sayfasında görünür."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Yeni duyuru
          </Button>
        }
      />
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Henüz duyuru yok.</Empty>
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <article key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{a.title}</h2>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    {dateTime(a.createdAt)} <Badge tone="blue">{a.site?.name ?? 'Tüm siteler'}</Badge>
                  </div>
                </div>
                <ConfirmButton message="Duyuru silinsin mi?" onConfirm={() => del.mutate(a.id)}>
                  <Trash2 className="size-3.5" />
                </ConfirmButton>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{a.body}</p>
            </article>
          ))}
        </div>
      )}
      <NewAnnouncement open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NewAnnouncement({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: sites } = useApi<Site[]>(open ? '/sites' : null);
  const [form, setForm] = useState({ siteId: '', title: '', body: '' });
  const save = useAction('POST', '/announcements', {
    onSuccess: () => {
      setForm({ siteId: '', title: '', body: '' });
      onClose();
    },
  });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni duyuru"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate(form)}>
            Yayınla
          </Button>
        </>
      }
    >
      <Field label="Site">
        <select className="field" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
          <option value="">Tüm siteler</option>
          {sites?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Başlık" required>
        <input className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="İçerik" required>
        <textarea className="field" rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      </Field>
      <ErrorText error={save.error} />
    </Modal>
  );
}
