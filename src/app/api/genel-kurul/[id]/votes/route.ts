import { prisma } from '@/lib/prisma';
import {
  VOTE_CHOICES,
  fail,
  findMeeting,
  isVotingUnit,
  meetingResponse,
  serverError,
} from '@/lib/genel-kurul-server';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { agendaItemId, unitId, choice } = (await request.json().catch(() => ({}))) as {
      agendaItemId?: unknown;
      unitId?: unknown;
      choice?: unknown;
    };
    if (!isVotingUnit(unitId)) return fail('Geçersiz bağımsız bölüm.');
    if (choice !== null && !VOTE_CHOICES.includes(choice as never)) return fail('Geçersiz oy.');

    const m = await findMeeting(id);
    if (!m) return fail('Genel kurul bulunamadı.', 404);
    if (m.status !== 'devam') return fail('Oy yalnızca toplantı sürerken kullanılabilir.');
    if (!m.agenda.some((a) => a.id === agendaItemId)) return fail('Gündem maddesi bulunamadı.');
    if (!m.attendances.some((a) => a.unitId === unitId)) return fail('Oy kullanmak için önce katılım bildirilmelidir.');

    const key = { agendaItemId: agendaItemId as string, unitId };
    if (choice === null) {
      await prisma.generalMeetingVote.deleteMany({ where: key });
    } else {
      await prisma.generalMeetingVote.upsert({
        where: { agendaItemId_unitId: key },
        create: { ...key, meetingId: id, choice: choice as string },
        update: { choice: choice as string },
      });
    }
    return meetingResponse(id);
  } catch (error) {
    return serverError(error);
  }
}
