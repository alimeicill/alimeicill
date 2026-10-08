import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { BillingService, debtorOf } from './billing.service';
import { AuthUser, CurrentUser } from './common/auth';
import { ZERO } from './common/money';
import { PrismaService } from './common/prisma.service';
import { ZodPipe, optStr } from './common/zod';

const BlockPlan = z.object({
  name: z.string().trim().min(1, 'Blok adı girin').max(40),
  unitCount: z.coerce.number().int().min(0).max(500).default(0),
  startNo: z.coerce.number().int().min(0).max(10000).default(1),
});

const SiteSchema = z.object({
  name: z.string().trim().min(2, 'Site adı girin'),
  code: optStr(),
  address: optStr(),
  city: optStr(),
  district: optStr(),
});
const SiteCreateSchema = SiteSchema.extend({ blocks: z.array(BlockPlan).max(50).default([]) });

const optNum = () =>
  z.preprocess((v) => (v === '' || v === null || v === undefined ? null : v), z.coerce.number().min(0).nullable());

const UnitSchema = z.object({
  blockId: z.string().uuid('Blok seçin'),
  doorNo: z.string().trim().min(1, 'Kapı no girin').max(20),
  floor: z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().int().nullable()),
  areaSqm: optNum(),
  landShare: optNum(),
  unitTypeId: optStr(),
});

const UnitTypeSchema = z.object({
  name: z.string().trim().min(1, 'Ad girin'),
  code: optStr(),
  coefficient: z.coerce.number().positive('Katsayı sıfırdan büyük olmalı').max(100).default(1),
});

const OccupantSchema = z.object({
  personId: z.string().uuid('Kişi seçin'),
  role: z.enum(['OWNER', 'TENANT']),
  isDebtor: z.boolean().default(false),
});

@Controller()
export class SitesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  private async site(tenantId: string, id: string) {
    const site = await this.prisma.site.findFirst({ where: { id, tenantId } });
    if (!site) throw new NotFoundException('Site bulunamadı.');
    return site;
  }

  private async unit(tenantId: string, id: string) {
    const unit = await this.prisma.unit.findFirst({ where: { id, tenantId } });
    if (!unit) throw new NotFoundException('Daire bulunamadı.');
    return unit;
  }

  // ---- Siteler ----

  @Get('sites')
  async sites(@CurrentUser() u: AuthUser) {
    const sites = await this.prisma.site.findMany({
      where: { tenantId: u.tenantId },
      include: { _count: { select: { blocks: true, units: true } } },
      orderBy: { name: 'asc' },
    });
    return sites;
  }

  @Post('sites')
  async createSite(@CurrentUser() u: AuthUser, @Body(new ZodPipe(SiteCreateSchema)) body: z.infer<typeof SiteCreateSchema>) {
    const { blocks, ...data } = body;
    const names = blocks.map((b) => b.name.toLocaleLowerCase('tr'));
    if (new Set(names).size !== names.length) throw new BadRequestException('Blok adları benzersiz olmalı.');

    return this.prisma.$transaction(async (tx) => {
      const site = await tx.site.create({ data: { ...data, tenantId: u.tenantId } });
      for (const b of blocks) {
        const block = await tx.block.create({ data: { siteId: site.id, name: b.name } });
        if (b.unitCount > 0) {
          await tx.unit.createMany({
            data: Array.from({ length: b.unitCount }, (_, i) => ({
              tenantId: u.tenantId,
              siteId: site.id,
              blockId: block.id,
              doorNo: String(b.startNo + i),
            })),
          });
        }
      }
      // Her siteye varsayılan bir kasa açılır; tahsilatlar hemen kaydedilebilsin.
      await tx.paymentAccount.create({
        data: { tenantId: u.tenantId, siteId: site.id, kind: 'CASH', name: `${site.name} Kasası` },
      });
      return site;
    });
  }

  @Get('sites/:id')
  async siteDetail(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId: u.tenantId },
      include: {
        blocks: {
          orderBy: { name: 'asc' },
          include: {
            units: {
              include: { unitType: true, occupants: { include: { person: true } } },
            },
          },
        },
      },
    });
    if (!site) throw new NotFoundException('Site bulunamadı.');
    const balances = await this.billing.siteBalances(u.tenantId, id);
    return {
      ...site,
      blocks: site.blocks.map((b) => ({
        ...b,
        units: b.units
          .sort((a, c) => a.doorNo.localeCompare(c.doorNo, 'tr', { numeric: true }))
          .map((unit) => {
            const bal = balances.get(unit.id);
            const debtor = debtorOf(unit.occupants);
            return {
              ...unit,
              debtor: debtor ? `${debtor.firstName} ${debtor.lastName}` : null,
              occupied: unit.occupants.length > 0,
              balance: (bal?.open ?? ZERO).sub(bal?.advance ?? ZERO),
            };
          }),
      })),
    };
  }

  @Patch('sites/:id')
  async updateSite(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(SiteSchema)) body: z.infer<typeof SiteSchema>) {
    await this.site(u.tenantId, id);
    return this.prisma.site.update({ where: { id }, data: body });
  }

  @Delete('sites/:id')
  async deleteSite(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.site(u.tenantId, id);
    const used = await this.prisma.charge.count({ where: { siteId: id, cancelledAt: null } });
    if (used) throw new BadRequestException('Borç kaydı olan site silinemez. Önce borçlandırmaları iptal edin.');
    await this.prisma.$transaction([
      this.prisma.cashTransaction.deleteMany({ where: { paymentAccount: { siteId: id } } }),
      this.prisma.payment.deleteMany({ where: { siteId: id } }),
      this.prisma.paymentAccount.deleteMany({ where: { siteId: id } }),
      this.prisma.site.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  // ---- Bloklar ----

  @Post('sites/:id/blocks')
  async addBlock(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(BlockPlan)) body: z.infer<typeof BlockPlan>) {
    await this.site(u.tenantId, id);
    const exists = await this.prisma.block.findFirst({ where: { siteId: id, name: body.name } });
    if (exists) throw new BadRequestException('Bu isimde bir blok zaten var.');
    return this.prisma.$transaction(async (tx) => {
      const block = await tx.block.create({ data: { siteId: id, name: body.name } });
      if (body.unitCount > 0) {
        await tx.unit.createMany({
          data: Array.from({ length: body.unitCount }, (_, i) => ({
            tenantId: u.tenantId,
            siteId: id,
            blockId: block.id,
            doorNo: String(body.startNo + i),
          })),
        });
      }
      return block;
    });
  }

  @Delete('blocks/:id')
  async deleteBlock(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const block = await this.prisma.block.findFirst({ where: { id, site: { tenantId: u.tenantId } } });
    if (!block) throw new NotFoundException('Blok bulunamadı.');
    const used = await this.prisma.charge.count({ where: { unit: { blockId: id } } });
    if (used) throw new BadRequestException('Borç kaydı olan blok silinemez.');
    await this.prisma.block.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Daireler ----

  @Post('sites/:id/units')
  async createUnit(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(UnitSchema)) body: z.infer<typeof UnitSchema>) {
    await this.site(u.tenantId, id);
    const block = await this.prisma.block.findFirst({ where: { id: body.blockId, siteId: id } });
    if (!block) throw new BadRequestException('Blok bu siteye ait değil.');
    const dup = await this.prisma.unit.findFirst({ where: { blockId: body.blockId, doorNo: body.doorNo } });
    if (dup) throw new BadRequestException('Bu blokta aynı kapı numarası var.');
    return this.prisma.unit.create({ data: { ...body, tenantId: u.tenantId, siteId: id } });
  }

  @Get('units/:id')
  async unitDetail(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, tenantId: u.tenantId },
      include: {
        site: true,
        block: true,
        unitType: true,
        occupants: { include: { person: true }, orderBy: { role: 'asc' } },
      },
    });
    if (!unit) throw new NotFoundException('Daire bulunamadı.');
    return unit;
  }

  @Patch('units/:id')
  async updateUnit(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(UnitSchema)) body: z.infer<typeof UnitSchema>) {
    const unit = await this.unit(u.tenantId, id);
    const block = await this.prisma.block.findFirst({ where: { id: body.blockId, siteId: unit.siteId } });
    if (!block) throw new BadRequestException('Blok bu siteye ait değil.');
    const dup = await this.prisma.unit.findFirst({ where: { blockId: body.blockId, doorNo: body.doorNo, NOT: { id } } });
    if (dup) throw new BadRequestException('Bu blokta aynı kapı numarası var.');
    return this.prisma.unit.update({ where: { id }, data: body });
  }

  @Delete('units/:id')
  async deleteUnit(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.unit(u.tenantId, id);
    const used = (await this.prisma.charge.count({ where: { unitId: id } })) + (await this.prisma.payment.count({ where: { unitId: id } }));
    if (used) throw new BadRequestException('Hesap hareketi olan daire silinemez.');
    await this.prisma.unit.delete({ where: { id } });
    return { ok: true };
  }

  @Post('units/:id/occupants')
  async addOccupant(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(OccupantSchema)) body: z.infer<typeof OccupantSchema>) {
    await this.unit(u.tenantId, id);
    const person = await this.prisma.person.findFirst({ where: { id: body.personId, tenantId: u.tenantId } });
    if (!person) throw new NotFoundException('Kişi bulunamadı.');
    return this.prisma.$transaction(async (tx) => {
      if (body.isDebtor) await tx.unitOccupant.updateMany({ where: { unitId: id }, data: { isDebtor: false } });
      return tx.unitOccupant.upsert({
        where: { unitId_personId_role: { unitId: id, personId: body.personId, role: body.role } },
        create: { unitId: id, ...body },
        update: { isDebtor: body.isDebtor },
      });
    });
  }

  @Post('occupants/:id/debtor')
  async setDebtor(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const occ = await this.prisma.unitOccupant.findFirst({ where: { id, unit: { tenantId: u.tenantId } } });
    if (!occ) throw new NotFoundException('Kayıt bulunamadı.');
    await this.prisma.$transaction([
      this.prisma.unitOccupant.updateMany({ where: { unitId: occ.unitId }, data: { isDebtor: false } }),
      this.prisma.unitOccupant.update({ where: { id }, data: { isDebtor: true } }),
    ]);
    return { ok: true };
  }

  @Delete('occupants/:id')
  async removeOccupant(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const occ = await this.prisma.unitOccupant.findFirst({ where: { id, unit: { tenantId: u.tenantId } } });
    if (!occ) throw new NotFoundException('Kayıt bulunamadı.');
    await this.prisma.unitOccupant.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Daire tipleri ----

  @Get('unit-types')
  unitTypes(@CurrentUser() u: AuthUser) {
    return this.prisma.unitType.findMany({
      where: { tenantId: u.tenantId },
      include: { _count: { select: { units: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('unit-types')
  createUnitType(@CurrentUser() u: AuthUser, @Body(new ZodPipe(UnitTypeSchema)) body: z.infer<typeof UnitTypeSchema>) {
    return this.prisma.unitType.create({ data: { ...body, tenantId: u.tenantId } });
  }

  @Patch('unit-types/:id')
  async updateUnitType(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body(new ZodPipe(UnitTypeSchema)) body: z.infer<typeof UnitTypeSchema>) {
    const t = await this.prisma.unitType.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!t) throw new NotFoundException('Daire tipi bulunamadı.');
    return this.prisma.unitType.update({ where: { id }, data: body });
  }

  @Delete('unit-types/:id')
  async deleteUnitType(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const t = await this.prisma.unitType.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!t) throw new NotFoundException('Daire tipi bulunamadı.');
    await this.prisma.unitType.delete({ where: { id } });
    return { ok: true };
  }
}
