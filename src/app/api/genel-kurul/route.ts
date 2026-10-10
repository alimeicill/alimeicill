import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildSeedMeetings, type GeneralMeeting } from '@/lib/genel-kurul';
import {
  DECISION_TYPE_KEYS,
  TENANT_ID,
  fail,
  meetingInclude,
  serverError,
  toDto,
} from '@/lib/genel-kurul-server';

export async function GET() {
  try {
    const meetings = await prisma.generalMeeting.findMany({
      where: { tenantId: TENANT_ID },
      include: meetingInclude,
      orderBy: { scheduledAt: 'desc' },
    });
    return NextResponse.json(meetings.map(toDto));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return fail('Geçersiz istek gövdesi.');

    if (body.demo === true) {
      for (const m of buildSeedMeetings()) await createMeeting(m);
      return GET();
    }

    const { title, kind, scheduledAt, location, onlineLink, agenda } = body;
    if (typeof title !== 'string' || !title.trim()) return fail('Başlık zorunludur.');
    if (kind !== 'olagan' && kind !== 'olaganustu') return fail('Geçersiz toplantı türü.');
    if (typeof location !== 'string' || !location.trim()) return fail('Toplantı yeri zorunludur.');
    if (Number.isNaN(Date.parse(scheduledAt))) return fail('Geçersiz tarih.');
    if (!Array.isArray(agenda) || agenda.length === 0) return fail('En az bir gündem maddesi gereklidir.');
    for (const a of agenda) {
      if (typeof a?.title !== 'string' || !a.title.trim()) return fail('Gündem maddesi başlığı boş olamaz.');
      if (!DECISION_TYPE_KEYS.includes(a.decisionType)) return fail('Geçersiz karar türü.');
    }

    const created = await prisma.generalMeeting.create({
      data: {
        tenantId: TENANT_ID,
        title: title.trim(),
        kind,
        scheduledAt: new Date(scheduledAt),
        location: location.trim(),
        onlineLink: typeof onlineLink === 'string' && onlineLink ? onlineLink : null,
        agenda: {
          create: agenda.map((a: { title: string; description?: string; decisionType: string }, i: number) => ({
            order: i,
            title: a.title.trim(),
            description: a.description?.trim() || null,
            decisionType: a.decisionType,
          })),
        },
      },
      include: meetingInclude,
    });
    return NextResponse.json(toDto(created), { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

/** Örnek veriyi (istemci tarafı kimlikleriyle) veritabanına yazar. */
async function createMeeting(m: GeneralMeeting) {
  const meeting = await prisma.generalMeeting.create({
    data: {
      tenantId: TENANT_ID,
      title: m.title,
      kind: m.kind,
      round: m.round,
      scheduledAt: new Date(m.scheduledAt),
      location: m.location,
      onlineLink: m.onlineLink ?? null,
      status: m.status,
      attendances: {
        create: Object.entries(m.attendance).map(([unitId, a]) => ({
          unitId,
          mode: a.mode,
          proxyName: a.proxyName ?? null,
        })),
      },
    },
  });
  for (const [order, item] of m.agenda.entries()) {
    const votes = m.votes[item.id] ?? {};
    await prisma.generalMeetingAgendaItem.create({
      data: {
        meetingId: meeting.id,
        order,
        title: item.title,
        description: item.description ?? null,
        decisionType: item.decisionType,
        votes: {
          create: Object.entries(votes).map(([unitId, choice]) => ({ meetingId: meeting.id, unitId, choice })),
        },
      },
    });
  }
}
