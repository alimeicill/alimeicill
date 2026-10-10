'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Gavel, CalendarClock, MapPin, Video, CheckCircle2, XCircle, Info, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  ATTENDANCE_LABELS,
  DECISION_TYPES,
  VOTE_LABELS,
  calculateItemResult,
  calculateQuorum,
  formatMeetingDate,
  getVotingUnits,
  loadMeetings,
  saveMeetings,
  type AttendanceMode,
  type GeneralMeeting,
  type VoteChoice,
} from '@/lib/genel-kurul';

// Demo sakinin kat maliki olduğu bağımsız bölüm.
const MY_UNIT_ID = 'unit-A201';

const VOTE_BTN: Record<VoteChoice, { active: string; idle: string }> = {
  kabul: { active: 'bg-emerald-500 text-white border-emerald-500', idle: 'hover:border-emerald-400 hover:text-emerald-600' },
  ret: { active: 'bg-rose-500 text-white border-rose-500', idle: 'hover:border-rose-400 hover:text-rose-600' },
  cekimser: { active: 'bg-slate-500 text-white border-slate-500', idle: 'hover:border-slate-400' },
};

export default function ResidentGeneralMeetingPage() {
  const units = useMemo(() => getVotingUnits(), []);
  const myUnit = units.find((u) => u.id === MY_UNIT_ID);
  const [meetings, setMeetings] = useState<GeneralMeeting[]>([]);

  useEffect(() => {
    const sync = () => setMeetings(loadMeetings());
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const update = (id: string, fn: (m: GeneralMeeting) => GeneralMeeting) => {
    const next = meetings.map((m) => (m.id === id ? fn(m) : m));
    setMeetings(next);
    saveMeetings(next);
  };

  const setAttendance = (m: GeneralMeeting, mode: AttendanceMode, proxyName?: string) => {
    update(m.id, (x) => ({ ...x, attendance: { ...x.attendance, [MY_UNIT_ID]: { mode, proxyName } } }));
    toast.success(
      mode === 'vekalet'
        ? `Vekâletiniz ${proxyName} adına kaydedildi.`
        : `Katılımınız (${ATTENDANCE_LABELS[mode]}) kaydedildi.`
    );
  };

  const vote = (m: GeneralMeeting, itemId: string, choice: VoteChoice) => {
    update(m.id, (x) => ({ ...x, votes: { ...x.votes, [itemId]: { ...(x.votes[itemId] ?? {}), [MY_UNIT_ID]: choice } } }));
    toast.success(`Oyunuz kaydedildi: ${VOTE_LABELS[choice]}`);
  };

  const sorted = [...meetings].sort((a, b) => {
    const order = { devam: 0, planlandi: 1, tamamlandi: 2 } as const;
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
          <Gavel className="h-8 w-8 text-indigo-500" />
          Genel Kurul
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {myUnit ? `Daire ${myUnit.number} · Arsa payı ${myUnit.ownershipShare}` : ''} — Toplantılara online katılın, vekâlet verin ve
          gündem maddelerine oy kullanın.
        </p>
      </div>

      {sorted.length === 0 && (
        <div className="glass rounded-2xl border border-[var(--border-color)] p-12 text-center text-[var(--text-tertiary)]">
          Planlanmış bir genel kurul bulunmuyor.
        </div>
      )}

      {sorted.map((m) => (
        <MeetingCard
          key={m.id}
          meeting={m}
          units={units}
          onAttend={(mode, proxy) => setAttendance(m, mode, proxy)}
          onVote={(itemId, c) => vote(m, itemId, c)}
        />
      ))}
    </div>
  );
}

function MeetingCard({
  meeting,
  units,
  onAttend,
  onVote,
}: {
  meeting: GeneralMeeting;
  units: ReturnType<typeof getVotingUnits>;
  onAttend: (mode: AttendanceMode, proxyName?: string) => void;
  onVote: (itemId: string, choice: VoteChoice) => void;
}) {
  const [proxyName, setProxyName] = useState('');
  const [showProxy, setShowProxy] = useState(false);
  const myAttendance = meeting.attendance[MY_UNIT_ID];
  const quorum = calculateQuorum(meeting, units);
  const isLive = meeting.status === 'devam';
  const isDone = meeting.status === 'tamamlandi';
  // Vekâlet verilen malik oyunu vekili aracılığıyla toplantıda kullanır.
  const canVote = isLive && !!myAttendance && myAttendance.mode !== 'vekalet';

  return (
    <div className="glass rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isLive ? 'bg-amber-500/10 text-amber-500 animate-pulse' : isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'
            }`}
          >
            {isLive ? '● Toplantı şu an sürüyor' : isDone ? 'Tamamlandı' : 'Yaklaşan toplantı'}
          </span>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{meeting.title}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatMeetingDate(meeting.scheduledAt)}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {meeting.location}</span>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-xs shrink-0">
          <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Katılım durumu</div>
          <div className="font-bold text-[var(--text-primary)] mt-0.5">
            {quorum.presentUnits}/{quorum.totalUnits} malik · {quorum.met ? 'yeter sayı var' : 'yeter sayı bekleniyor'}
          </div>
        </div>
      </div>

      {/* Attendance */}
      {!isDone && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
          {myAttendance ? (
            <p className="text-xs text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Katılımınız kayıtlı: <strong>{ATTENDANCE_LABELS[myAttendance.mode]}</strong>
              {myAttendance.mode === 'vekalet' && myAttendance.proxyName ? ` — vekiliniz ${myAttendance.proxyName}` : ''}
            </p>
          ) : (
            <p className="text-xs text-[var(--text-primary)] font-semibold">Bu toplantıya nasıl katılacaksınız?</p>
          )}
          <div className="flex flex-wrap gap-2">
            {meeting.onlineLink && (
              <button
                onClick={() => onAttend('online')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
              >
                <Video className="h-3.5 w-3.5" /> Online katılacağım
              </button>
            )}
            <button
              onClick={() => onAttend('fiziksel')}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              Salona geleceğim
            </button>
            <button
              onClick={() => setShowProxy((s) => !s)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              Vekâlet vereceğim
            </button>
          </div>
          {showProxy && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!proxyName.trim()) return;
                onAttend('vekalet', proxyName.trim());
                setShowProxy(false);
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                value={proxyName}
                onChange={(e) => setProxyName(e.target.value)}
                placeholder="Vekilin adı soyadı"
                className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
              />
              <button type="submit" className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white">
                Vekâleti Kaydet
              </button>
            </form>
          )}
          <p className="text-[10px] text-[var(--text-tertiary)] flex items-start gap-1">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            KMK md. 31 gereği bir kişi kural olarak yalnızca bir kat malikini temsil edebilir. Vekâletname aslı toplantıda divana teslim edilmelidir.
          </p>
        </div>
      )}

      {/* Agenda */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Gündem</h3>
        {!isLive && !isDone && (
          <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Oylama, toplantı yönetici tarafından açıldığında başlar.
          </p>
        )}
        {isLive && myAttendance?.mode === 'vekalet' && (
          <p className="text-xs text-[var(--text-tertiary)]">Vekâlet verdiğiniz için oyunuzu vekiliniz kullanacaktır.</p>
        )}
        {isLive && !myAttendance && (
          <p className="text-xs text-amber-600">Oy kullanabilmek için önce katılımınızı bildirin.</p>
        )}
        {meeting.agenda.map((item, i) => {
          const myVote = meeting.votes[item.id]?.[MY_UNIT_ID];
          const r = calculateItemResult(meeting, item, units);
          const dt = DECISION_TYPES[item.decisionType];
          return (
            <div key={item.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500">MADDE {i + 1}</span>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h4>
                  {item.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.description}</p>}
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{dt.rule}</p>
                </div>
                {isDone && r.voted > 0 && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold shrink-0 ${r.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    {r.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {r.passed ? 'Kabul edildi' : 'Reddedildi'} ({r.kabul}/{r.ret}/{r.cekimser})
                  </span>
                )}
              </div>
              {(isLive || myVote) && (
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(VOTE_LABELS) as VoteChoice[]).map((c) => (
                    <button
                      key={c}
                      disabled={!canVote}
                      onClick={() => onVote(item.id, c)}
                      className={`rounded-lg border px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                        myVote === c ? VOTE_BTN[c].active : `border-[var(--border-color)] text-[var(--text-secondary)] ${VOTE_BTN[c].idle}`
                      }`}
                    >
                      {VOTE_LABELS[c]}
                    </button>
                  ))}
                  {isLive && (
                    <span className="self-center text-[10px] text-[var(--text-tertiary)] ml-auto">
                      Şu ana kadar {r.voted} oy kullanıldı
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
