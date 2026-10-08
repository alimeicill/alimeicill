import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { normalizeLogin } from './auth.controller';
import { AuthUser, CurrentUser } from './common/auth';
import { ZERO } from './common/money';
import { PrismaService } from './common/prisma.service';
import { ZodPipe, optStr } from './common/zod';

const PersonSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad girin'),
  lastName: z.string().trim().min(1, 'Soyad girin'),
  phone: optStr(),
  email: z
    .string()
    .trim()
    .email('Geçerli bir e-posta girin')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((v) => (v ? v.toLowerCase() : null)),
  tckn: optStr().refine((v) => !v || /^\d{11}$/.test(v), 'TCKN 11 haneli olmalı'),
  notes: optStr(),
});

const PortalSchema = z.object({ password: z.string().min(6, 'Şifre en az 6 karakter olmalı') });

@Controller('people')
export class PeopleController {
  constructor(private readonly prisma: PrismaService) {}

  private async person(tenantId: string, id: string) {
    const p = await this.prisma.person.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('Kişi bulunamadı.');
    return p;
  }

  @Get()
  async list(@CurrentUser() u: AuthUser, @Query('q') q = '', @Query('page') pageStr = '1') {
    const page = Math.max(1, Number(pageStr) || 1);
    const take = 25;
    const terms = q.trim().split(/\s+/).filter(Boolean);
    const where = {
      tenantId: u.tenantId,
      AND: terms.map((t) => ({
        OR: [
          { firstName: { contains: t, mode: 'insensitive' as const } },
          { lastName: { contains: t, mode: 'insensitive' as const } },
          { phone: { contains: t.replace(/\D/g, '') || t } },
        ],
      })),
    };
    const [items, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        include: {
          units: { include: { unit: { include: { block: true, site: true } } } },
          user: { select: { id: true } },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.person.count({ where }),
    ]);
    return {
      items: items.map(({ user, ...p }) => ({ ...p, hasPortal: !!user })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / take)),
    };
  }

  @Get(':id')
  async detail(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, tenantId: u.tenantId },
      include: {
        units: { include: { unit: { include: { block: true, site: true } } } },
        user: { select: { id: true, phone: true, email: true } },
      },
    });
    if (!person) throw new NotFoundException('Kişi bulunamadı.');
    // Kişinin borçlu olduğu dairelerdeki açık borç (hukuki takip dökümü için)
    const charges = await this.prisma.charge.findMany({
      where: { tenantId: u.tenantId, personId: id, cancelledAt: null },
      include: { unit: { include: { block: true } } },
      orderBy: { dueDate: 'asc' },
    });
    const open = charges.filter((c) => c.amount.gt(c.paid));
    return {
      ...person,
      openCharges: open.map((c) => ({
        id: c.id,
        unit: `${c.unit.block.name} / ${c.unit.doorNo}`,
        description: c.description,
        period: c.period,
        dueDate: c.dueDate,
        amount: c.amount,
        remaining: c.amount.sub(c.paid),
      })),
      openTotal: open.reduce((a, c) => a.add(c.amount.sub(c.paid)), ZERO),
    };
  }

  @Post()
  create(@CurrentUser() u: AuthUser, @Body(new ZodPipe(PersonSchema)) body: z.infer<typeof PersonSchema>) {
    const phone = body.phone ? normalizeLogin(body.phone).phone ?? null : null;
    return this.prisma.person.create({ data: { ...body, phone, tenantId: u.tenantId } });
  }

  @Patch(':id')
  async update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(PersonSchema)) body: z.infer<typeof PersonSchema>) {
    await this.person(u.tenantId, id);
    const phone = body.phone ? normalizeLogin(body.phone).phone ?? null : null;
    return this.prisma.person.update({ where: { id }, data: { ...body, phone } });
  }

  @Delete(':id')
  async remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.person(u.tenantId, id);
    const used = await this.prisma.charge.count({ where: { personId: id, cancelledAt: null } });
    if (used) throw new BadRequestException('Adına borç yazılmış kişi silinemez.');
    await this.prisma.person.delete({ where: { id } });
    return { ok: true };
  }

  /** Sakin paneli girişi: telefon + şifre ile kişiye bağlı kullanıcı oluşturur veya şifresini yeniler. */
  @Post(':id/portal-access')
  async portalAccess(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(PortalSchema)) body: z.infer<typeof PortalSchema>) {
    const person = await this.person(u.tenantId, id);
    if (!person.phone) throw new BadRequestException('Sakin girişi için kişinin telefonu kayıtlı olmalı.');
    const passwordHash = await bcrypt.hash(body.password, 10);
    const existing = await this.prisma.user.findUnique({ where: { personId: id } });
    if (existing) {
      await this.prisma.user.update({ where: { id: existing.id }, data: { passwordHash, phone: person.phone } });
      return { ok: true, login: person.phone };
    }
    const taken = await this.prisma.user.findUnique({ where: { phone: person.phone } });
    if (taken) throw new ConflictException('Bu telefon numarası başka bir hesapta kullanılıyor.');
    await this.prisma.user.create({
      data: {
        tenantId: u.tenantId,
        name: `${person.firstName} ${person.lastName}`,
        phone: person.phone,
        email: null,
        passwordHash,
        role: Role.RESIDENT,
        personId: id,
      },
    });
    return { ok: true, login: person.phone };
  }

  @Delete(':id/portal-access')
  async revokePortal(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.person(u.tenantId, id);
    await this.prisma.user.deleteMany({ where: { personId: id, tenantId: u.tenantId } });
    return { ok: true };
  }

  @Post(':id/kvkk')
  async kvkk(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() body: { consent?: boolean }) {
    await this.person(u.tenantId, id);
    return this.prisma.person.update({ where: { id }, data: { kvkkConsentAt: body.consent === false ? null : new Date() } });
  }
}
