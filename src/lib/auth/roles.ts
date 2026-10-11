// Rol → panel eşlemesi. Hem proxy (sunucu) hem istemci tarafında kullanılır.
import type { UserRole } from '@prisma/client';

export type Area = 'super-admin' | 'yonetici' | 'personel' | 'sakin';

const AREA_ROLES: Record<Area, UserRole[]> = {
  'super-admin': ['SUPER_ADMIN'],
  yonetici: ['SITE_MANAGER', 'BOARD_MEMBER', 'ACCOUNTANT'],
  personel: ['TECHNICAL_STAFF', 'SECURITY_STAFF'],
  sakin: ['OWNER', 'TENANT_RESIDENT', 'GUARANTOR'],
};

export const MANAGER_ROLES = AREA_ROLES.yonetici;

export function areaOf(role: UserRole): Area {
  return (Object.keys(AREA_ROLES) as Area[]).find((a) => AREA_ROLES[a].includes(role)) ?? 'sakin';
}

export function homePath(role: UserRole) {
  return `/${areaOf(role)}/dashboard`;
}

/** Sayfa yolunun ait olduğu panel; panel dışı yollar için null. */
export function areaOfPath(pathname: string): Area | null {
  const first = pathname.split('/')[1] as Area;
  return first in AREA_ROLES ? first : null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Platform Sahibi',
  SITE_MANAGER: 'Site Yöneticisi',
  BOARD_MEMBER: 'Yönetim Kurulu Üyesi',
  ACCOUNTANT: 'Muhasebe',
  TECHNICAL_STAFF: 'Teknik Personel',
  SECURITY_STAFF: 'Güvenlik Personeli',
  OWNER: 'Kat Maliki',
  TENANT_RESIDENT: 'Kiracı',
  GUARANTOR: 'Kefil',
};
