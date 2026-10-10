import { prisma } from '@/lib/prisma';
import {
  ATTENDANCE_MODES,
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
    const { unitId, mode, proxyName } = (await request.json().catch(() => ({}))) as {
      unitId?: unknown;
      mode?: unknown;
      proxyName?: unknown;
    };
    if (!isVotingUnit(unitId)) return fail('Geçersiz bağımsız bölüm.');
    if (mode !== null && !ATTENDANCE_MODES.includes(mode as never)) return fail('Geçersiz katılım türü.');

    const m = await findMeeting(id);
    if (!m) return fail('Genel kurul bulunamadı.', 404);
    if (m.status === 'tamamlandi') return fail('Kapanmış bir toplantının hazirunu değiştirilemez.');

    if (mode === null) {
      // Toplantıda olmayan malikin oyu geçersizdir.
      await prisma.$transaction([
        prisma.generalMeetingVote.deleteMany({ where: { meetingId: id, unitId } }),
        prisma.generalMeetingAttendance.deleteMany({ where: { meetingId: id, unitId } }),
      ]);
    } else {
      const proxy = mode === 'vekalet' && typeof proxyName === 'string' ? proxyName.trim().slice(0, 120) : null;
      await prisma.generalMeetingAttendance.upsert({
        where: { meetingId_unitId: { meetingId: id, unitId } },
        create: { meetingId: id, unitId, mode: mode as string, proxyName: proxy },
        update: { mode: mode as string, proxyName: proxy },
      });
    }
    return meetingResponse(id);
  } catch (error) {
    return serverError(error);
  }
}
