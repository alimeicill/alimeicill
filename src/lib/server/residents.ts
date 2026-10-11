import 'server-only';
import { prisma } from '@/lib/prisma';

export const RESIDENT_ROLES = ['OWNER', 'TENANT_RESIDENT', 'GUARANTOR'] as const;

/** Yalnızca bu sitenin sakinleri; yönetim hesapları sakin ekranından değiştirilemez. */
export function findResident(id: string, tenantId: string) {
  return prisma.user.findFirst({
    where: { id, tenantId, role: { in: [...RESIDENT_ROLES] } },
    select: { id: true, name: true, email: true, passwordHash: true, isActive: true },
  });
}
