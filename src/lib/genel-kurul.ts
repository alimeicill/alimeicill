// Kat Mülkiyeti Kanunu (634) uyumlu dijital genel kurul: veri modeli ve yeter sayı hesapları.
// Bilgilendirme amaçlıdır; hukuki danışmanlık yerine geçmez.

import { mockUnits } from '@/lib/mock-data';
import type { Unit } from '@/types';

export const GENEL_KURUL_STORAGE_KEY = 'site_genel_kurul';

export type DecisionType = 'adi' | 'salt' | 'besteDort' | 'oybirligi';
export type VoteChoice = 'kabul' | 'ret' | 'cekimser';
export type AttendanceMode = 'fiziksel' | 'online' | 'vekalet';
export type MeetingStatus = 'planlandi' | 'devam' | 'tamamlandi';

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  decisionType: DecisionType;
}

export interface Attendance {
  mode: AttendanceMode;
  proxyName?: string;
}

export interface GeneralMeeting {
  id: string;
  title: string;
  kind: 'olagan' | 'olaganustu';
  round: 1 | 2;
  scheduledAt: string;
  location: string;
  onlineLink?: string;
  status: MeetingStatus;
  agenda: AgendaItem[];
  attendance: Record<string, Attendance>;
  votes: Record<string, Record<string, VoteChoice>>;
  createdAt: string;
}

export const DECISION_TYPES: Record<DecisionType, { label: string; article: string; rule: string }> = {
  adi: {
    label: 'Oy çokluğu',
    article: 'KMK md. 30',
    rule: 'Toplantıda oy kullananların çoğunluğu kabul ederse karar alınır.',
  },
  salt: {
    label: 'Sayı ve arsa payı çoğunluğu',
    article: 'KMK md. 42',
    rule: 'Tüm kat maliklerinin hem sayıca hem arsa payı olarak yarıdan fazlası kabul etmelidir (faydalı yenilik vb.).',
  },
  besteDort: {
    label: 'Beşte dört çoğunluk',
    article: 'KMK md. 19 / md. 28',
    rule: 'Tüm kat maliklerinin en az beşte dördü kabul etmelidir (yönetim planı değişikliği, ortak yerlerde esaslı değişiklik).',
  },
  oybirligi: {
    label: 'Oybirliği',
    article: 'KMK md. 24',
    rule: 'Tüm kat maliklerinin tamamı kabul etmelidir (konutun işyerine çevrilmesi vb.).',
  },
};

export const ATTENDANCE_LABELS: Record<AttendanceMode, string> = {
  fiziksel: 'Salonda',
  online: 'Online',
  vekalet: 'Vekâleten',
};

export const VOTE_LABELS: Record<VoteChoice, string> = {
  kabul: 'Kabul',
  ret: 'Ret',
  cekimser: 'Çekimser',
};

/** Oy hakkı olan bağımsız bölümler (sahibi kayıtlı olanlar). */
export function getVotingUnits(): Unit[] {
  return mockUnits.filter((u) => !!u.ownerName);
}

export interface QuorumResult {
  totalUnits: number;
  totalShare: number;
  presentUnits: number;
  presentShare: number;
  required: string;
  met: boolean;
}

/**
 * Toplantı yeter sayısı (KMK md. 30):
 * 1. toplantı: kat maliklerinin sayı ve arsa payı çoğunluğu.
 * 2. toplantı (7 gün sonra): hazır bulunanlar, ancak kat maliklerinin üçte birinden az olamaz.
 */
export function calculateQuorum(meeting: GeneralMeeting, units: Unit[]): QuorumResult {
  const totalUnits = units.length;
  const totalShare = units.reduce((s, u) => s + u.ownershipShare, 0);
  const present = units.filter((u) => meeting.attendance[u.id]);
  const presentUnits = present.length;
  const presentShare = present.reduce((s, u) => s + u.ownershipShare, 0);

  if (meeting.round === 1) {
    return {
      totalUnits,
      totalShare,
      presentUnits,
      presentShare,
      required: `${Math.floor(totalUnits / 2) + 1} malik ve ${Math.floor(totalShare / 2) + 1} arsa payı`,
      met: presentUnits > totalUnits / 2 && presentShare > totalShare / 2,
    };
  }
  const minUnits = Math.ceil(totalUnits / 3);
  return {
    totalUnits,
    totalShare,
    presentUnits,
    presentShare,
    required: `en az ${minUnits} malik (üçte bir)`,
    met: presentUnits >= minUnits,
  };
}

export interface ItemResult {
  kabul: number;
  ret: number;
  cekimser: number;
  kabulShare: number;
  voted: number;
  /** Kararın alınması için gereken kabul sayısı (açıklama amaçlı). */
  threshold: string;
  passed: boolean;
}

export function calculateItemResult(
  meeting: GeneralMeeting,
  item: AgendaItem,
  units: Unit[]
): ItemResult {
  const votes = meeting.votes[item.id] ?? {};
  let kabul = 0;
  let ret = 0;
  let cekimser = 0;
  let kabulShare = 0;
  for (const u of units) {
    const v = votes[u.id];
    if (v === 'kabul') {
      kabul++;
      kabulShare += u.ownershipShare;
    } else if (v === 'ret') ret++;
    else if (v === 'cekimser') cekimser++;
  }
  const voted = kabul + ret + cekimser;
  const totalUnits = units.length;
  const totalShare = units.reduce((s, u) => s + u.ownershipShare, 0);

  let threshold: string;
  let passed: boolean;
  switch (item.decisionType) {
    case 'adi':
      threshold = 'Kabul > Ret';
      passed = kabul > ret;
      break;
    case 'salt':
      threshold = `${Math.floor(totalUnits / 2) + 1} malik ve ${Math.floor(totalShare / 2) + 1} arsa payı`;
      passed = kabul > totalUnits / 2 && kabulShare > totalShare / 2;
      break;
    case 'besteDort': {
      const need = Math.ceil((totalUnits * 4) / 5);
      threshold = `${need} / ${totalUnits} malik`;
      passed = kabul >= need;
      break;
    }
    case 'oybirligi':
      threshold = `${totalUnits} / ${totalUnits} malik`;
      passed = kabul === totalUnits;
      break;
  }
  return { kabul, ret, cekimser, kabulShare, voted, threshold, passed };
}

/**
 * Vekâlet sınırı (KMK md. 31): bir kişi birden fazla kat malikini temsil edemez;
 * malik sayısı 20 veya fazlaysa, malik sayısının %5'ine kadar temsil edebilir.
 */
export function proxyLimit(totalUnits: number): number {
  return totalUnits >= 20 ? Math.max(1, Math.floor(totalUnits * 0.05)) : 1;
}

export function findProxyViolations(meeting: GeneralMeeting, units: Unit[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const u of units) {
    const a = meeting.attendance[u.id];
    if (a?.mode === 'vekalet' && a.proxyName?.trim()) {
      const key = a.proxyName.trim().toLocaleLowerCase('tr-TR');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const limit = proxyLimit(units.length);
  return [...counts.entries()]
    .filter(([, count]) => count > limit)
    .map(([name, count]) => ({ name, count }));
}

export function formatMeetingDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function loadMeetings(): GeneralMeeting[] {
  try {
    const saved = localStorage.getItem(GENEL_KURUL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const seed = buildSeedMeetings();
  saveMeetings(seed);
  return seed;
}

export function saveMeetings(meetings: GeneralMeeting[]) {
  try {
    localStorage.setItem(GENEL_KURUL_STORAGE_KEY, JSON.stringify(meetings));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

function buildSeedMeetings(): GeneralMeeting[] {
  const units = getVotingUnits();
  const attendance: Record<string, Attendance> = {};
  // İlk 13 daire katılmış durumda; ikisi vekâletle.
  units.slice(0, 13).forEach((u, i) => {
    attendance[u.id] =
      i === 4
        ? { mode: 'vekalet', proxyName: 'Av. Serkan Uçar' }
        : i === 9
          ? { mode: 'vekalet', proxyName: 'Zeynep Demir' }
          : { mode: i % 3 === 0 ? 'online' : 'fiziksel' };
  });

  const agenda: AgendaItem[] = [
    { id: 'gd-1', title: 'Açılış ve divan kurulu seçimi', decisionType: 'adi' },
    { id: 'gd-2', title: 'Yönetim kurulu faaliyet raporunun okunması ve ibrası', decisionType: 'adi' },
    {
      id: 'gd-3',
      title: '2027 yılı işletme projesinin (bütçe) onaylanması',
      description: 'Aylık aidatın 2.400 ₺ olarak belirlenmesi önerilmektedir.',
      decisionType: 'adi',
    },
    {
      id: 'gd-4',
      title: 'Otopark girişine plaka tanımalı bariyer sistemi kurulması',
      description: 'Tahmini maliyet 185.000 ₺, demirbaş fonundan karşılanacaktır.',
      decisionType: 'salt',
    },
    {
      id: 'gd-5',
      title: 'Yönetim planının evcil hayvan maddesinin güncellenmesi',
      decisionType: 'besteDort',
    },
  ];

  const votes: Record<string, Record<string, VoteChoice>> = {};
  const present = units.slice(0, 13);
  const pattern: Record<string, VoteChoice[]> = {
    'gd-1': ['kabul', 'kabul', 'kabul', 'kabul', 'cekimser'],
    'gd-2': ['kabul', 'kabul', 'ret', 'kabul', 'kabul'],
    'gd-3': ['kabul', 'ret', 'kabul', 'kabul', 'cekimser'],
  };
  for (const [itemId, p] of Object.entries(pattern)) {
    votes[itemId] = {};
    present.forEach((u, i) => {
      votes[itemId][u.id] = p[i % p.length];
    });
  }

  const now = new Date();
  const planned = new Date(now.getFullYear(), now.getMonth() + 1, 15, 19, 30);

  return [
    {
      id: 'gk-2026-olagan',
      title: '2026 Yılı Olağan Kat Malikleri Kurulu',
      kind: 'olagan',
      round: 1,
      scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0).toISOString(),
      location: 'A Blok Sosyal Tesis Toplantı Salonu',
      onlineLink: 'https://meet.example.com/genel-kurul',
      status: 'devam',
      agenda,
      attendance,
      votes,
      createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
    },
    {
      id: 'gk-olaganustu-cati',
      title: 'Olağanüstü Kurul: B Blok Çatı İzolasyonu',
      kind: 'olaganustu',
      round: 1,
      scheduledAt: planned.toISOString(),
      location: 'B Blok Giriş Lobisi',
      status: 'planlandi',
      agenda: [
        {
          id: 'gd-c1',
          title: 'B Blok çatı izolasyonu için ek bütçe toplanması',
          description: 'Daire başı arsa payı oranında toplam 420.000 ₺.',
          decisionType: 'adi',
        },
      ],
      attendance: {},
      votes: {},
      createdAt: now.toISOString(),
    },
  ];
}
