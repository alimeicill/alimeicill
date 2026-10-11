import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateQuorum } from '@/lib/genel-kurul';
import { fail, findMeeting, meetingResponse, requireMeetingUser, serverError, siteVotingUnits, toDto } from '@/lib/genel-kurul-server';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await requireMeetingUser();
  if (user instanceof NextResponse) return user;
  if (!user.isManager) return fail('Bu işlem için yetkiniz yok.', 403);
  try {
    const { id } = await params;
    const { action } = (await request.json().catch(() => ({}))) as { action?: string };
    const m = await findMeeting(id, user.tenantId);
    if (!m) return fail('Genel kurul bulunamadı.', 404);
    const dto = toDto(m);

    switch (action) {
      case 'start': {
        if (dto.status !== 'planlandi') return fail('Yalnızca planlanmış bir toplantı açılabilir.');
        const quorum = calculateQuorum(dto, await siteVotingUnits(user.tenantId));
        if (!quorum.met) return fail(`Toplantı yeter sayısı sağlanamadı. Gerekli: ${quorum.required}.`);
        await prisma.generalMeeting.update({ where: { id }, data: { status: 'devam' } });
        break;
      }
      case 'finish':
        if (dto.status !== 'devam') return fail('Yalnızca süren bir toplantı kapatılabilir.');
        await prisma.generalMeeting.update({ where: { id }, data: { status: 'tamamlandi' } });
        break;
      case 'postpone': {
        // KMK md. 30: ilk toplantıda yeter sayı yoksa ikinci toplantı 7 gün sonra yapılır.
        if (dto.status !== 'planlandi' || dto.round !== 1) return fail('Bu toplantı ertelenemez.');
        const next = new Date(m.scheduledAt);
        next.setDate(next.getDate() + 7);
        await prisma.generalMeeting.update({ where: { id }, data: { round: 2, scheduledAt: next } });
        break;
      }
      default:
        return fail('Geçersiz işlem.');
    }
    return meetingResponse(id, user.tenantId);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await requireMeetingUser();
  if (user instanceof NextResponse) return user;
  if (!user.isManager) return fail('Bu işlem için yetkiniz yok.', 403);
  try {
    const { id } = await params;
    const m = await findMeeting(id, user.tenantId);
    if (!m) return fail('Genel kurul bulunamadı.', 404);
    await prisma.generalMeeting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
