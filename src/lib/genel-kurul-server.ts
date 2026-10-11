import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, type CurrentUser } from '@/lib/auth/session';
import { MANAGER_ROLES } from '@/lib/auth/roles';
import { listUnits } from '@/lib/server/units';
import {
  DECISION_TYPES,
  votingUnits,
  type Attendance,
  type AttendanceMode,
  type DecisionType,
  type GeneralMeeting,
  type VoteChoice,
} from '@/lib/genel-kurul';

export const ATTENDANCE_MODES: AttendanceMode[] = ['fiziksel', 'online', 'vekalet'];
export const VOTE_CHOICES: VoteChoice[] = ['kabul', 'ret', 'cekimser'];
export const DECISION_TYPE_KEYS = Object.keys(DECISION_TYPES) as DecisionType[];

export const meetingInclude = {
  agenda: { orderBy: { order: 'asc' as const } },
  attendances: true,
  votes: true,
};

type MeetingWithRelations = NonNullable<Awaited<ReturnType<typeof findMeeting>>>;

export function findMeeting(id: string, tenantId: string) {
  return prisma.generalMeeting.findFirst({ where: { id, tenantId }, include: meetingInclude });
}

export function toDto(m: MeetingWithRelations): GeneralMeeting {
  const attendance: Record<string, Attendance> = {};
  for (const a of m.attendances) {
    attendance[a.unitId] = { mode: a.mode as AttendanceMode, proxyName: a.proxyName ?? undefined };
  }
  const votes: Record<string, Record<string, VoteChoice>> = {};
  for (const v of m.votes) {
    (votes[v.agendaItemId] ??= {})[v.unitId] = v.choice as VoteChoice;
  }
  return {
    id: m.id,
    title: m.title,
    kind: m.kind as GeneralMeeting['kind'],
    round: m.round as 1 | 2,
    scheduledAt: m.scheduledAt.toISOString(),
    location: m.location,
    onlineLink: m.onlineLink ?? undefined,
    status: m.status as GeneralMeeting['status'],
    agenda: m.agenda.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? undefined,
      decisionType: a.decisionType as DecisionType,
    })),
    attendance,
    votes,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function meetingResponse(id: string, tenantId: string) {
  const m = await findMeeting(id, tenantId);
  if (!m) return fail('Genel kurul bulunamadı.', 404);
  return NextResponse.json(toDto(m));
}

/** Sitenin oy hakkı olan daireleri (veritabanından). */
export async function siteVotingUnits(tenantId: string) {
  return votingUnits(await listUnits(tenantId));
}

export type MeetingUser = CurrentUser & { tenantId: string; isManager: boolean };

/** Siteye bağlı herhangi bir kullanıcı; yönetici olup olmadığı işaretlenir. */
export async function requireMeetingUser(): Promise<MeetingUser | NextResponse> {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  if (!auth.tenantId) return fail('Hesabınız bir siteye bağlı değil.', 403);
  return { ...auth, tenantId: auth.tenantId, isManager: MANAGER_ROLES.includes(auth.role) };
}

/**
 * Daire bu sitede oy hakkına sahip mi ve kullanıcı bu daire adına işlem yapabilir mi?
 * Yönetici her daire için, sakin yalnızca kat maliki olduğu daire için işlem yapabilir.
 */
export async function checkUnitAccess(user: MeetingUser, unitId: unknown): Promise<NextResponse | null> {
  const unit = typeof unitId === 'string' ? (await siteVotingUnits(user.tenantId)).find((u) => u.id === unitId) : undefined;
  if (!unit) return fail('Geçersiz bağımsız bölüm.');
  if (!user.isManager && unit.ownerId !== user.id) return fail('Bu daire adına işlem yapamazsınız.', 403);
  return null;
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serverError(error: unknown) {
  console.error('[genel-kurul]', error);
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('DATABASE_URL') || msg.includes("Can't reach database")) {
    return fail('Veritabanı bağlantısı yapılandırılmamış.', 503);
  }
  return fail('Beklenmeyen bir sunucu hatası oluştu.', 500);
}
