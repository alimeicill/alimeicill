import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

export interface AuthUser {
  sub: string;
  tenantId: string;
  role: Role;
  personId: string | null;
}

export const PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Kimlik doğrulama gerektirmeyen uç noktalar. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
/** Uç noktaya erişebilecek roller. Belirtilmezse ADMIN varsayılır. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets)) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Oturum bulunamadı.');

    let user: AuthUser;
    try {
      user = this.jwt.verify<AuthUser>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Oturum süresi doldu, tekrar giriş yapın.');
    }

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets) ?? [Role.ADMIN];
    if (!roles.includes(user.role)) throw new ForbiddenException('Bu işlem için yetkiniz yok.');

    req.user = user;
    return true;
  }
}
