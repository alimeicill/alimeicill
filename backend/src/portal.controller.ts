import { BadRequestException, Body, Controller, ForbiddenException, Get, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { BillingService } from './billing.service';
import { AuthUser, CurrentUser, Roles } from './common/auth';
import { ZERO } from './common/money';
import { PrismaService } from './common/prisma.service';
import { ZodPipe, optStr } from './common/zod';

const TicketSchema = z.object({
  unitId: z.string().uuid('Daire seçin'),
  title: z.string().trim().min(3, 'Başlık girin'),
  description: z.string().trim().min(5, 'Açıklama girin'),
});

const SettingsSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad girin'),
  lastName: optStr(),
  smsNotify: z.boolean(),
  mailNotify: z.boolean(),
});

const PasswordSchema = z
  .object({
    current: z.string().min(1, 'Mevcut şifreyi girin'),
    password: z.string().min(6, 'Yeni şifre en az 6 karakter olmalı'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Şifreler eşleşmiyor', path: ['confirm'] });

/** Sakin paneli: yalnızca kişinin bağlı olduğu dairelerin verileri. */
@Roles(Role.RESIDENT)
@Controller('portal')
export class PortalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  private async units(u: AuthUser) {
    if (!u.personId) throw new ForbiddenException();
    const occ = await this.prisma.unitOccupant.findMany({
      where: { personId: u.personId, unit: { tenantId: u.tenantId } },
      include: { unit: { include: { block: true, site: true } } },
    });
    const seen = new Set<string>();
    return occ
      .filter((o) => !seen.has(o.unitId) && seen.add(o.unitId))
      .map((o) => ({ id: o.unitId, siteId: o.unit.siteId, label: `${o.unit.site.name} / ${o.unit.block.name} / ${o.unit.doorNo}`, role: o.role }));
  }

  @Get('summary')
  async summary(@CurrentUser() u: AuthUser) {
    const units = await this.units(u);
    const ledgers = await Promise.all(units.map((x) => this.billing.unitLedger(u.tenantId, x.id)));
    const announcements = await this.prisma.announcement.findMany({
      where: { tenantId: u.tenantId, OR: [{ siteId: null }, { siteId: { in: units.map((x) => x.siteId) } }] },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return {
      units: units.map((x, i) => ({ ...x, balance: ledgers[i].summary.balance, lateFee: ledgers[i].summary.lateFee })),
      totalDebt: ledgers.reduce((a, l) => a.add(l.summary.balance), ZERO),
      totalLateFee: ledgers.reduce((a, l) => a.add(l.summary.lateFee), ZERO),
      announcements,
    };
  }

  @Get('ledger')
  async ledger(@CurrentUser() u: AuthUser, @Query('year') yearStr?: string) {
    const units = await this.units(u);
    const year = Number(yearStr) || undefined;
    return Promise.all(units.map((x) => this.billing.unitLedger(u.tenantId, x.id, year)));
  }

  @Get('tickets')
  async tickets(@CurrentUser() u: AuthUser) {
    return this.prisma.ticket.findMany({
      where: { tenantId: u.tenantId, personId: u.personId! },
      include: { unit: { include: { block: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('tickets')
  async createTicket(@CurrentUser() u: AuthUser, @Body(new ZodPipe(TicketSchema)) body: z.infer<typeof TicketSchema>) {
    const unit = (await this.units(u)).find((x) => x.id === body.unitId);
    if (!unit) throw new BadRequestException('Bu daire için talep açamazsınız.');
    return this.prisma.ticket.create({
      data: { tenantId: u.tenantId, siteId: unit.siteId, unitId: unit.id, personId: u.personId, title: body.title, description: body.description },
    });
  }

  @Get('settings')
  async settings(@CurrentUser() u: AuthUser) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: u.sub }, include: { person: true } });
    return {
      firstName: user.person?.firstName ?? user.name,
      lastName: user.person?.lastName ?? '',
      phone: user.phone,
      smsNotify: user.smsNotify,
      mailNotify: user.mailNotify,
      units: await this.units(u),
    };
  }

  @Patch('settings')
  async updateSettings(@CurrentUser() u: AuthUser, @Body(new ZodPipe(SettingsSchema)) body: z.infer<typeof SettingsSchema>) {
    const lastName = body.lastName ?? '';
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: u.sub },
        data: { name: `${body.firstName} ${lastName}`.trim(), smsNotify: body.smsNotify, mailNotify: body.mailNotify },
      }),
      this.prisma.person.update({ where: { id: u.personId! }, data: { firstName: body.firstName, lastName } }),
    ]);
    return { ok: true };
  }

  @Post('password')
  async password(@CurrentUser() u: AuthUser, @Body(new ZodPipe(PasswordSchema)) body: z.infer<typeof PasswordSchema>) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: u.sub } });
    if (!(await bcrypt.compare(body.current, user.passwordHash))) throw new BadRequestException('Mevcut şifre hatalı.');
    await this.prisma.user.update({ where: { id: u.sub }, data: { passwordHash: await bcrypt.hash(body.password, 10) } });
    return { ok: true };
  }
}
