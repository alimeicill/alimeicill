'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Gavel,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  Trash2,
  Play,
  Flag,
  CalendarClock,
  MapPin,
  Video,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ATTENDANCE_LABELS,
  DECISION_TYPES,
  VOTE_LABELS,
  calculateItemResult,
  calculateQuorum,
  findProxyViolations,
  formatMeetingDate,
  getVotingUnits,
  loadMeetings,
  proxyLimit,
  saveMeetings,
  type AgendaItem,
  type AttendanceMode,
  type DecisionType,
  type GeneralMeeting,
  type VoteChoice,
} from '@/lib/genel-kurul';

type Tab = 'hazirun' | 'gundem' | 'tutanak';

const STATUS_STYLES: Record<GeneralMeeting['status'], { label: string; cls: string }> = {
  planlandi: { label: 'Planlandı', cls: 'bg-sky-500/10 text-sky-500' },
  devam: { label: 'Toplantı Sürüyor', cls: 'bg-amber-500/10 text-amber-500' },
  tamamlandi: { label: 'Tamamlandı', cls: 'bg-emerald-500/10 text-emerald-500' },
};

const VOTE_STYLES: Record<VoteChoice, string> = {
  kabul: 'bg-emerald-500 text-white',
  ret: 'bg-rose-500 text-white',
  cekimser: 'bg-slate-400 text-white',
};

const inputCls =
  'block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none';

export default function GeneralMeetingPage() {
  const units = useMemo(() => getVotingUnits(), []);
  const [meetings, setMeetings] = useState<GeneralMeeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('hazirun');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const list = loadMeetings();
      setMeetings(list);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const meeting = meetings.find((m) => m.id === selectedId) ?? null;

  const updateMeeting = (id: string, fn: (m: GeneralMeeting) => GeneralMeeting) => {
    const next = meetings.map((m) => (m.id === id ? fn(m) : m));
    setMeetings(next);
    saveMeetings(next);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bu genel kurulu silmek istediğinize emin misiniz?')) return;
    const next = meetings.filter((m) => m.id !== id);
    setMeetings(next);
    saveMeetings(next);
    setSelectedId(next[0]?.id ?? null);
    toast.success('Genel kurul silindi.');
  };

  const stats = useMemo(() => {
    const upcoming = meetings.filter((m) => m.status === 'planlandi').length;
    const live = meetings.filter((m) => m.status === 'devam').length;
    const decisions = meetings
      .filter((m) => m.status === 'tamamlandi')
      .reduce((s, m) => s + m.agenda.filter((a) => calculateItemResult(m, a, units).passed).length, 0);
    return { upcoming, live, decisions };
  }, [meetings, units]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <Gavel className="h-8 w-8 text-indigo-500" />
            Dijital Genel Kurul
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kat Mülkiyeti Kanunu&apos;na uygun hazirun, yeter sayı, vekâlet ve karar hesaplarıyla genel kurulunuzu yönetin.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Genel Kurul
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-gradient-to-br from-sky-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Planlanan Kurullar</span>
          <h3 className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.upcoming}</h3>
        </div>
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-gradient-to-br from-amber-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Şu An Süren</span>
          <h3 className="text-3xl font-extrabold text-amber-500">{stats.live}</h3>
        </div>
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Kesinleşen Kararlar</span>
          <h3 className="text-3xl font-extrabold text-emerald-500">{stats.decisions}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
        {/* Meeting list */}
        <div className="space-y-3 print:hidden">
          {meetings.length === 0 && (
            <div className="glass rounded-2xl border border-[var(--border-color)] p-8 text-center text-xs text-[var(--text-tertiary)]">
              Henüz bir genel kurul oluşturulmadı.
            </div>
          )}
          {meetings.map((m) => {
            const q = calculateQuorum(m, units);
            const st = STATUS_STYLES[m.status];
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left glass rounded-2xl border p-4 transition-all ${
                  m.id === selectedId
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-indigo-500/5'
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {m.kind === 'olagan' ? 'Olağan' : 'Olağanüstü'} · {m.round}. toplantı
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">{m.title}</h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">{formatMeetingDate(m.scheduledAt)}</p>
                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-[var(--text-tertiary)]">
                    Katılım: <strong className="text-[var(--text-primary)]">{q.presentUnits}/{q.totalUnits}</strong>
                  </span>
                  <span className={q.met ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                    {q.met ? 'Yeter sayı var' : 'Yeter sayı yok'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        {meeting ? (
          <MeetingDetail
            meeting={meeting}
            units={units}
            tab={tab}
            setTab={setTab}
            onUpdate={(fn) => updateMeeting(meeting.id, fn)}
            onDelete={() => handleDelete(meeting.id)}
          />
        ) : (
          <div className="glass rounded-2xl border border-[var(--border-color)] p-12 text-center text-[var(--text-tertiary)]">
            Detaylarını görmek için bir genel kurul seçin.
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <CreateMeetingModal
          onClose={() => setIsAddModalOpen(false)}
          onCreate={(m) => {
            const next = [m, ...meetings];
            setMeetings(next);
            saveMeetings(next);
            setSelectedId(m.id);
            setTab('hazirun');
            setIsAddModalOpen(false);
            toast.success('Genel kurul oluşturuldu. Sakinlere bildirim gönderildi.');
          }}
        />
      )}
    </div>
  );
}

function MeetingDetail({
  meeting,
  units,
  tab,
  setTab,
  onUpdate,
  onDelete,
}: {
  meeting: GeneralMeeting;
  units: ReturnType<typeof getVotingUnits>;
  tab: Tab;
  setTab: (t: Tab) => void;
  onUpdate: (fn: (m: GeneralMeeting) => GeneralMeeting) => void;
  onDelete: () => void;
}) {
  const quorum = calculateQuorum(meeting, units);
  const violations = findProxyViolations(meeting, units);
  const locked = meeting.status === 'tamamlandi';

  const setAttendance = (unitId: string, mode: AttendanceMode | '') => {
    onUpdate((m) => {
      const attendance = { ...m.attendance };
      const votes = { ...m.votes };
      if (mode === '') {
        delete attendance[unitId];
        // Toplantıda olmayan malikin oyu geçersizdir.
        for (const k of Object.keys(votes)) {
          if (votes[k]?.[unitId]) {
            votes[k] = { ...votes[k] };
            delete votes[k][unitId];
          }
        }
      } else {
        attendance[unitId] = { mode, proxyName: mode === 'vekalet' ? attendance[unitId]?.proxyName ?? '' : undefined };
      }
      return { ...m, attendance, votes };
    });
  };

  const setProxyName = (unitId: string, proxyName: string) => {
    onUpdate((m) => ({ ...m, attendance: { ...m.attendance, [unitId]: { mode: 'vekalet', proxyName } } }));
  };

  const setVote = (itemId: string, unitId: string, choice: VoteChoice) => {
    onUpdate((m) => {
      const current = m.votes[itemId] ?? {};
      const next = { ...current };
      if (next[unitId] === choice) delete next[unitId];
      else next[unitId] = choice;
      return { ...m, votes: { ...m.votes, [itemId]: next } };
    });
  };

  const startMeeting = () => {
    if (!quorum.met) {
      toast.error(`Toplantı yeter sayısı sağlanamadı. Gerekli: ${quorum.required}.`);
      return;
    }
    onUpdate((m) => ({ ...m, status: 'devam' }));
    toast.success('Toplantı açıldı. Oylama başlatılabilir.');
  };

  const postponeToSecondRound = () => {
    onUpdate((m) => {
      const d = new Date(m.scheduledAt);
      d.setDate(d.getDate() + 7);
      return { ...m, round: 2, scheduledAt: d.toISOString(), status: 'planlandi' };
    });
    toast.info('Yeter sayı sağlanamadığı için 7 gün sonrasına 2. toplantı planlandı (KMK md. 30).');
  };

  const finishMeeting = () => {
    onUpdate((m) => ({ ...m, status: 'tamamlandi' }));
    setTab('tutanak');
    toast.success('Genel kurul kapatıldı, tutanak oluşturuldu.');
  };

  const sharePct = quorum.totalShare ? Math.round((quorum.presentShare / quorum.totalShare) * 100) : 0;
  const unitPct = quorum.totalUnits ? Math.round((quorum.presentUnits / quorum.totalUnits) * 100) : 0;

  return (
    <div className="space-y-4 min-w-0">
      {/* Meeting header card */}
      <div className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[meeting.status].cls}`}>
              {STATUS_STYLES[meeting.status].label}
            </span>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{meeting.title}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatMeetingDate(meeting.scheduledAt)}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {meeting.location}</span>
              {meeting.onlineLink && (
                <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Online katılım açık</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {meeting.status === 'planlandi' && (
              <>
                <button onClick={startMeeting} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600">
                  <Play className="h-3.5 w-3.5" /> Toplantıyı Aç
                </button>
                {meeting.round === 1 && !quorum.met && (
                  <button onClick={postponeToSecondRound} className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
                    2. Toplantıya Ertele
                  </button>
                )}
              </>
            )}
            {meeting.status === 'devam' && (
              <button onClick={finishMeeting} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600">
                <Flag className="h-3.5 w-3.5" /> Toplantıyı Kapat
              </button>
            )}
            <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10">
              <Trash2 className="h-3.5 w-3.5" /> Sil
            </button>
          </div>
        </div>

        {/* Quorum meter */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
          <Meter label="Malik sayısı" value={`${quorum.presentUnits} / ${quorum.totalUnits}`} pct={unitPct} />
          <Meter label="Arsa payı" value={`${quorum.presentShare} / ${quorum.totalShare}`} pct={sharePct} />
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${quorum.met ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            <Scale className="h-4 w-4 shrink-0" />
            <div>
              <div>{quorum.met ? 'Toplantı yeter sayısı sağlandı' : 'Toplantı yeter sayısı yok'}</div>
              <div className="font-normal text-[10px] opacity-80">
                {meeting.round}. toplantı · gerekli: {quorum.required}
              </div>
            </div>
          </div>
        </div>

        {violations.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Vekâlet sınırı aşıldı (KMK md. 31 — bir kişi en fazla {proxyLimit(quorum.totalUnits)} malik adına oy kullanabilir):{' '}
              {violations.map((v) => `${v.name} (${v.count} daire)`).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1 w-fit print:hidden">
        {([
          ['hazirun', 'Hazirun Cetveli'],
          ['gundem', 'Gündem & Oylama'],
          ['tutanak', 'Tutanak'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              tab === key ? 'bg-indigo-500 text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'hazirun' && (
        <div className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left text-[10px] uppercase text-[var(--text-tertiary)]">
                <th className="px-4 py-3">Daire</th>
                <th className="px-4 py-3">Kat Maliki</th>
                <th className="px-4 py-3 text-right">Arsa Payı</th>
                <th className="px-4 py-3">Katılım</th>
                <th className="px-4 py-3">Vekil</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => {
                const a = meeting.attendance[u.id];
                return (
                  <tr key={u.id} className="border-b border-[var(--border-color)]/40 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-[var(--text-primary)]">{u.number}</td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">{u.ownerName}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[var(--text-secondary)]">{u.ownershipShare}</td>
                    <td className="px-4 py-2.5">
                      <select
                        disabled={locked}
                        value={a?.mode ?? ''}
                        onChange={(e) => setAttendance(u.id, e.target.value as AttendanceMode | '')}
                        className={`rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs ${a ? 'text-emerald-600 font-semibold' : 'text-[var(--text-tertiary)]'}`}
                      >
                        <option value="">Katılmadı</option>
                        {(Object.keys(ATTENDANCE_LABELS) as AttendanceMode[]).map((k) => (
                          <option key={k} value={k}>{ATTENDANCE_LABELS[k]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      {a?.mode === 'vekalet' && (
                        <input
                          disabled={locked}
                          value={a.proxyName ?? ''}
                          placeholder="Vekil adı soyadı"
                          onChange={(e) => setProxyName(u.id, e.target.value)}
                          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs w-40"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'gundem' && (
        <div className="space-y-4">
          {meeting.status !== 'devam' && (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-secondary)]">
              {meeting.status === 'planlandi'
                ? 'Oy kullanımı toplantı açıldığında başlar.'
                : 'Toplantı kapatıldı; oylar kesinleşti.'}
            </div>
          )}
          {meeting.agenda.map((item, idx) => (
            <AgendaCard
              key={item.id}
              index={idx + 1}
              item={item}
              meeting={meeting}
              units={units}
              canVote={meeting.status === 'devam'}
              onVote={(unitId, choice) => setVote(item.id, unitId, choice)}
            />
          ))}
        </div>
      )}

      {tab === 'tutanak' && <Minutes meeting={meeting} units={units} />}
    </div>
  );
}

function Meter({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-semibold mb-1">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="text-[var(--text-primary)] font-mono">{value} ({pct}%)</span>
      </div>
      <div className="relative h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--text-tertiary)]" title="Yarı" />
      </div>
    </div>
  );
}

function AgendaCard({
  index,
  item,
  meeting,
  units,
  canVote,
  onVote,
}: {
  index: number;
  item: AgendaItem;
  meeting: GeneralMeeting;
  units: ReturnType<typeof getVotingUnits>;
  canVote: boolean;
  onVote: (unitId: string, choice: VoteChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const r = calculateItemResult(meeting, item, units);
  const dt = DECISION_TYPES[item.decisionType];
  const total = r.voted || 1;
  const presentUnits = units.filter((u) => meeting.attendance[u.id]);

  return (
    <div className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-indigo-500">GÜNDEM {index}</span>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{item.title}</h3>
          {item.description && <p className="text-xs text-[var(--text-secondary)]">{item.description}</p>}
          <p className="text-[10px] text-[var(--text-tertiary)]" title={dt.rule}>
            Karar türü: <strong>{dt.label}</strong> ({dt.article}) · Gerekli: {r.threshold}
          </p>
        </div>
        {r.voted > 0 && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold shrink-0 ${
              r.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
            }`}
          >
            {r.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {r.passed ? 'Kabul edildi' : meeting.status === 'tamamlandi' ? 'Reddedildi' : 'Henüz yeterli değil'}
          </span>
        )}
      </div>

      <div className="flex h-3 rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
        <div className="bg-emerald-500 transition-all" style={{ width: `${(r.kabul / total) * 100}%` }} />
        <div className="bg-rose-500 transition-all" style={{ width: `${(r.ret / total) * 100}%` }} />
        <div className="bg-slate-400 transition-all" style={{ width: `${(r.cekimser / total) * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] font-semibold">
        <span className="text-emerald-600">Kabul: {r.kabul} (arsa payı {r.kabulShare})</span>
        <span className="text-rose-600">Ret: {r.ret}</span>
        <span className="text-slate-500">Çekimser: {r.cekimser}</span>
        <span className="text-[var(--text-tertiary)]">Oy kullanan: {r.voted}/{presentUnits.length} katılımcı</span>
        <button onClick={() => setOpen((o) => !o)} className="ml-auto text-indigo-500 hover:underline">
          {open ? 'Oy listesini gizle' : canVote ? 'Oyları gir / düzenle' : 'Oy listesini göster'}
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[var(--border-color)]/40 pt-3">
          {presentUnits.length === 0 && (
            <p className="text-xs text-[var(--text-tertiary)]">Hazirun cetvelinde katılımcı yok.</p>
          )}
          {presentUnits.map((u) => {
            const v = meeting.votes[item.id]?.[u.id];
            return (
              <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--bg-primary)] px-3 py-2">
                <span className="text-xs text-[var(--text-primary)] truncate">
                  <strong>{u.number}</strong> · {u.ownerName}
                </span>
                <div className="flex gap-1 shrink-0">
                  {(Object.keys(VOTE_LABELS) as VoteChoice[]).map((c) => (
                    <button
                      key={c}
                      disabled={!canVote}
                      onClick={() => onVote(u.id, c)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all disabled:cursor-not-allowed ${
                        v === c ? VOTE_STYLES[c] : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {VOTE_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Minutes({ meeting, units }: { meeting: GeneralMeeting; units: ReturnType<typeof getVotingUnits> }) {
  const quorum = calculateQuorum(meeting, units);
  const present = units.filter((u) => meeting.attendance[u.id]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-xs text-[var(--text-secondary)]">
          {meeting.status === 'tamamlandi'
            ? 'Tutanak kesinleşti. Yazdırıp imzaya açabilir veya PDF olarak kaydedebilirsiniz.'
            : 'Taslak tutanak — toplantı kapatıldığında kesinleşir.'}
        </p>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
        >
          <Printer className="h-3.5 w-3.5" /> Yazdır / PDF
        </button>
      </div>

      <article className="rounded-2xl border border-[var(--border-color)] bg-white text-slate-900 p-8 text-[13px] leading-relaxed shadow-sm print:border-0 print:shadow-none print:p-0">
        <h2 className="text-center text-base font-bold uppercase">Kat Malikleri Kurulu Toplantı Tutanağı</h2>
        <p className="text-center text-xs text-slate-500 mb-6">
          {meeting.title} · {meeting.kind === 'olagan' ? 'Olağan' : 'Olağanüstü'} · {meeting.round}. toplantı
        </p>

        <p>
          Ana gayrimenkulün kat malikleri kurulu {formatMeetingDate(meeting.scheduledAt)} tarihinde {meeting.location}
          {meeting.onlineLink ? ' ve çevrim içi katılım kanalı üzerinden' : ''} toplanmıştır. Toplam {quorum.totalUnits} bağımsız
          bölümden {quorum.presentUnits} bağımsız bölüm (toplam {quorum.totalShare} arsa payından {quorum.presentShare}) asaleten veya
          vekâleten hazır bulunmuştur. {quorum.met
            ? `Toplantı yeter sayısı (${quorum.required}) sağlandığından gündemin görüşülmesine geçilmiştir.`
            : `Toplantı yeter sayısı (${quorum.required}) sağlanamamıştır.`}
        </p>

        <h3 className="font-bold mt-6 mb-2">Gündem ve Alınan Kararlar</h3>
        <ol className="space-y-3 list-decimal pl-5">
          {meeting.agenda.map((item) => {
            const r = calculateItemResult(meeting, item, units);
            const dt = DECISION_TYPES[item.decisionType];
            return (
              <li key={item.id}>
                <strong>{item.title}</strong>
                {item.description && <span> — {item.description}</span>}
                <br />
                {r.voted === 0 ? (
                  <span className="text-slate-500">Bu madde oylanmamıştır.</span>
                ) : (
                  <span>
                    Yapılan oylamada {r.kabul} kabul, {r.ret} ret, {r.cekimser} çekimser oy kullanılmış;{' '}
                    {dt.label.toLocaleLowerCase('tr-TR')} ({dt.article}) aranan madde{' '}
                    <strong>{r.passed ? 'KABUL EDİLMİŞTİR' : 'REDDEDİLMİŞTİR'}</strong>.
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <h3 className="font-bold mt-6 mb-2">Hazirun Cetveli</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-left">
              <th className="py-1">Daire</th>
              <th className="py-1">Kat Maliki</th>
              <th className="py-1">Arsa Payı</th>
              <th className="py-1">Katılım</th>
              <th className="py-1">İmza</th>
            </tr>
          </thead>
          <tbody>
            {present.map((u) => {
              const a = meeting.attendance[u.id];
              return (
                <tr key={u.id} className="border-b border-slate-200">
                  <td className="py-1.5">{u.number}</td>
                  <td className="py-1.5">{u.ownerName}</td>
                  <td className="py-1.5">{u.ownershipShare}</td>
                  <td className="py-1.5">
                    {ATTENDANCE_LABELS[a.mode]}
                    {a.mode === 'vekalet' && a.proxyName ? ` (${a.proxyName})` : ''}
                  </td>
                  <td className="py-1.5 w-32 border-b border-dotted border-slate-400" />
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="grid grid-cols-3 gap-6 mt-12 text-center text-xs">
          {['Divan Başkanı', 'Yazman', 'Oy Toplayıcı'].map((r) => (
            <div key={r}>
              <div className="border-t border-slate-400 pt-1">{r}</div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function CreateMeetingModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (m: GeneralMeeting) => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'olagan' | 'olaganustu'>('olagan');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('Sosyal Tesis Toplantı Salonu');
  const [online, setOnline] = useState(true);
  const [items, setItems] = useState<{ title: string; decisionType: DecisionType }[]>([
    { title: 'Açılış ve divan kurulu seçimi', decisionType: 'adi' },
    { title: '', decisionType: 'adi' },
  ]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const agenda = items.filter((i) => i.title.trim());
    if (agenda.length === 0) {
      toast.error('En az bir gündem maddesi ekleyin.');
      return;
    }
    const scheduled = new Date(date);
    // KMK md. 29: toplantı en az 15 gün önceden bildirilmelidir.
    const daysAhead = (scheduled.getTime() - Date.now()) / 86400000;
    if (daysAhead < 15) {
      toast.warning('Uyarı: KMK md. 29\'a göre çağrı toplantıdan en az 15 gün önce yapılmalıdır.');
    }
    const ts = Date.now();
    onCreate({
      id: `gk-${ts}`,
      title: title.trim(),
      kind,
      round: 1,
      scheduledAt: scheduled.toISOString(),
      location: location.trim(),
      onlineLink: online ? 'https://meet.example.com/genel-kurul' : undefined,
      status: 'planlandi',
      agenda: agenda.map((a, i) => ({ id: `gd-${ts}-${i}`, title: a.title.trim(), decisionType: a.decisionType })),
      attendance: {},
      votes: {},
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Yeni Genel Kurul Çağrısı</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
            Kapat
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Başlık</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: 2027 Olağan Kat Malikleri Kurulu" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Tür</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as 'olagan' | 'olaganustu')} className={inputCls}>
                <option value="olagan">Olağan</option>
                <option value="olaganustu">Olağanüstü</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Tarih ve Saat</label>
              <input required type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Yer</label>
            <input required value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} />
            Online katılım ve uzaktan oy kullanımına izin ver
          </label>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Gündem Maddeleri</span>
              <button type="button" onClick={() => setItems([...items, { title: '', decisionType: 'adi' }])} className="text-indigo-500 hover:underline font-bold">
                + Madde Ekle
              </button>
            </div>
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={it.title}
                  placeholder={`Madde ${i + 1}`}
                  onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                  className={`${inputCls} flex-1`}
                />
                <select
                  value={it.decisionType}
                  onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, decisionType: e.target.value as DecisionType } : x)))}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 text-[11px] text-[var(--text-primary)] w-40"
                  title={DECISION_TYPES[it.decisionType].rule}
                >
                  {(Object.keys(DECISION_TYPES) as DecisionType[]).map((k) => (
                    <option key={k} value={k}>{DECISION_TYPES[k].label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-rose-500 p-1 rounded hover:bg-[var(--bg-tertiary)]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <p className="text-[10px] text-[var(--text-tertiary)]">
              Karar türü, maddenin kabulü için aranacak çoğunluğu belirler (ör. faydalı yenilik → sayı ve arsa payı çoğunluğu).
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
              Vazgeç
            </button>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow">
              <Users className="h-3.5 w-3.5" /> Çağrıyı Yayınla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
