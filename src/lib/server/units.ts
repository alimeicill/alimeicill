import 'server-only';
import type { ApartmentStatus, ApartmentType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Unit, UnitStatus, UnitType } from '@/types';

// Arayüz (küçük harf) ↔ veritabanı (enum) eşlemeleri.
const STATUS_TO_DB: Record<UnitStatus, ApartmentStatus> = { occupied: 'OCCUPIED', vacant: 'EMPTY', maintenance: 'RENOVATION' };
const TYPE_TO_DB: Record<UnitType, ApartmentType> = { residential: 'RESIDENTIAL', commercial: 'COMMERCIAL', parking: 'PARKING' };

function statusFromDb(s: ApartmentStatus): UnitStatus {
  if (s === 'OCCUPIED') return 'occupied';
  if (s === 'RENOVATION') return 'maintenance';
  return 'vacant';
}
function typeFromDb(t: ApartmentType): UnitType {
  if (t === 'COMMERCIAL' || t === 'OFFICE') return 'commercial';
  if (t === 'PARKING' || t === 'STORAGE') return 'parking';
  return 'residential';
}

export const unitInclude = {
  block: { select: { name: true } },
  residents: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
  vehicles: { select: { plate: true } },
  pets: { select: { name: true, type: true } },
} satisfies Prisma.ApartmentInclude;

type ApartmentRow = Prisma.ApartmentGetPayload<{ include: typeof unitInclude }>;

export function toUnit(a: ApartmentRow): Unit {
  const owner = a.residents.find((r) => r.isOwner);
  const tenant = a.residents.find((r) => !r.isOwner);
  return {
    id: a.id,
    tenantId: a.tenantId,
    blockName: a.block.name,
    floor: a.floor,
    number: a.number,
    areaSqm: a.size ?? 0,
    ownershipShare: a.shareRatio ?? 0,
    ownerId: owner?.user.id,
    ownerName: owner?.user.name,
    tenantName: tenant?.user.name,
    status: statusFromDb(a.status),
    type: typeFromDb(a.type),
    rooms: a.rooms ?? undefined,
    emergencyName: a.emergencyName ?? undefined,
    emergencyPhone: a.emergencyPhone ?? undefined,
    vehicles: a.vehicles.map((v) => v.plate),
    pets: a.pets.map((p) => (p.type && p.type !== 'other' ? `${p.name} (${p.type})` : p.name)),
    residentHistory: a.residents.map((r) => ({
      date: r.createdAt.toISOString().slice(0, 10),
      action: 'Giriş',
      resident: `${r.user.name} (${r.isOwner ? 'Kat Maliki' : 'Kiracı'})`,
    })),
  };
}

export async function listUnits(tenantId: string) {
  const rows = await prisma.apartment.findMany({ where: { tenantId }, include: unitInclude });
  return rows.map(toUnit).sort((x, y) => `${x.blockName} ${x.number}`.localeCompare(`${y.blockName} ${y.number}`, 'tr', { numeric: true }));
}

/** Kat maliki olunan daireler (genel kurul oy hakkı ve sakin paneli için). */
export async function ownedUnitIds(userId: string) {
  const rows = await prisma.apartmentUser.findMany({ where: { userId, isOwner: true }, select: { apartmentId: true } });
  return rows.map((r) => r.apartmentId);
}

/** Blok adına göre bloğu bulur ya da oluşturur; site için tek bir varsayılan bina kullanılır. */
async function ensureBlock(tx: Prisma.TransactionClient, tenantId: string, name: string, floor: number) {
  const existing = await tx.block.findFirst({ where: { tenantId, name } });
  if (existing) {
    if (floor > existing.floorCount) await tx.block.update({ where: { id: existing.id }, data: { floorCount: floor } });
    return existing.id;
  }
  const building =
    (await tx.building.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } })) ??
    (await tx.building.create({ data: { tenantId, name: 'Ana Bina' } }));
  const block = await tx.block.create({ data: { tenantId, buildingId: building.id, name, floorCount: Math.max(floor, 1) } });
  return block.id;
}

/** Aynı sitede aynı isimli sakin varsa onu kullanır, yoksa (girişsiz) yeni bir sakin kaydı açar. */
async function findOrCreatePerson(tx: Prisma.TransactionClient, tenantId: string, name: string, isOwner: boolean) {
  const existing = await tx.user.findFirst({ where: { tenantId, name: { equals: name, mode: 'insensitive' } } });
  if (existing) return existing.id;
  const user = await tx.user.create({ data: { tenantId, name, role: isOwner ? 'OWNER' : 'TENANT_RESIDENT' } });
  return user.id;
}

export interface UnitInput {
  blockName: string;
  number: string;
  floor: number;
  type: UnitType;
  areaSqm: number;
  ownershipShare: number;
  status: UnitStatus;
  rooms?: string;
  ownerName?: string;
  tenantName?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  vehicle?: string;
  pet?: string;
}

export async function createUnit(tenantId: string, input: UnitInput) {
  const id = await prisma.$transaction(async (tx) => {
    const blockId = await ensureBlock(tx, tenantId, input.blockName, input.floor);
    const apartment = await tx.apartment.create({
      data: {
        tenantId,
        blockId,
        number: input.number,
        floor: input.floor,
        type: TYPE_TO_DB[input.type],
        size: input.areaSqm,
        shareRatio: input.ownershipShare,
        rooms: input.rooms || null,
        status: STATUS_TO_DB[input.status],
        emergencyName: input.emergencyName || null,
        emergencyPhone: input.emergencyPhone || null,
      },
    });
    if (input.ownerName) {
      const userId = await findOrCreatePerson(tx, tenantId, input.ownerName, true);
      await tx.apartmentUser.create({ data: { apartmentId: apartment.id, userId, isOwner: true } });
    }
    if (input.tenantName) {
      const userId = await findOrCreatePerson(tx, tenantId, input.tenantName, false);
      await tx.apartmentUser.create({ data: { apartmentId: apartment.id, userId, isOwner: false } });
    }
    if (input.vehicle) await tx.vehicle.create({ data: { apartmentId: apartment.id, plate: input.vehicle, type: 'car' } });
    if (input.pet) await tx.pet.create({ data: { apartmentId: apartment.id, name: input.pet, type: 'other' } });
    return apartment.id;
  });
  const row = await prisma.apartment.findUniqueOrThrow({ where: { id }, include: unitInclude });
  return toUnit(row);
}

/** Borç, ödeme, talep veya bakım kaydı olan daire silinemez (geçmiş korunur). */
export async function deleteUnit(tenantId: string, id: string): Promise<'ok' | 'not-found' | 'has-records'> {
  const a = await prisma.apartment.findFirst({
    where: { id, tenantId },
    select: { id: true, _count: { select: { dues: true, payments: true, tickets: true, maintenances: true, meetings: true } } },
  });
  if (!a) return 'not-found';
  if (Object.values(a._count).some((n) => n > 0)) return 'has-records';
  await prisma.$transaction([
    prisma.apartmentUser.deleteMany({ where: { apartmentId: id } }),
    prisma.vehicle.deleteMany({ where: { apartmentId: id } }),
    prisma.pet.deleteMany({ where: { apartmentId: id } }),
    prisma.apartment.delete({ where: { id } }),
  ]);
  return 'ok';
}
