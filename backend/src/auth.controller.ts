import { Body, ConflictException, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthUser, CurrentUser, Public, Roles } from './common/auth';
import { PrismaService } from './common/prisma.service';
import { ZodPipe, optStr } from './common/zod';

/** Telefonu 5XXXXXXXXX biçimine indirger; e-posta küçük harfe çevrilir. */
export function normalizeLogin(login: string) {
  const v = login.trim();
  if (v.includes('@')) return { email: v.toLowerCase() };
  const digits = v.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
  return { phone: digits };
}

const LoginSchema = z.object({
  login: z.string().min(3, 'E-posta veya telefon girin'),
  password: z.string().min(1, 'Şifre girin'),
});

const RegisterSchema = z.object({
  firmName: z.string().trim().min(2, 'Firma adı en az 2 karakter olmalı'),
  name: z.string().trim().min(2, 'Ad soyad girin'),
  email: z.string().trim().email('Geçerli bir e-posta girin'),
  phone: optStr(),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private session(user: User & { tenant: { name: string } }) {
    const payload: AuthUser = { sub: user.id, tenantId: user.tenantId, role: user.role, personId: user.personId };
    return {
      token: this.jwt.sign(payload),
      user: { id: user.id, name: user.name, role: user.role, email: user.email, phone: user.phone, tenantName: user.tenant.name },
    };
  }

  @Public()
  @Post('login')
  async login(@Body(new ZodPipe(LoginSchema)) body: z.infer<typeof LoginSchema>) {
    const user = await this.prisma.user.findFirst({ where: normalizeLogin(body.login), include: { tenant: true } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new UnauthorizedException('Telefon/e-posta veya şifre hatalı.');
    }
    return this.session(user);
  }

  @Public()
  @Post('register')
  async register(@Body(new ZodPipe(RegisterSchema)) body: z.infer<typeof RegisterSchema>) {
    const email = body.email.toLowerCase();
    const phone = body.phone ? normalizeLogin(body.phone).phone : null;
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    });
    if (exists) throw new ConflictException('Bu e-posta veya telefon ile kayıtlı bir hesap var.');

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: body.firmName } });
      await tx.financeItem.createMany({
        data: [
          { tenantId: tenant.id, name: 'Aidat', kind: 'CHARGE', isDefault: true },
          { tenantId: tenant.id, name: 'Aidat tahsilatı', kind: 'INCOME', isDefault: true },
          { tenantId: tenant.id, name: 'Genel gider', kind: 'EXPENSE', isDefault: true },
        ],
      });
      return tx.user.create({
        data: { tenantId: tenant.id, name: body.name, email, phone, passwordHash, role: Role.ADMIN },
        include: { tenant: true },
      });
    });
    return this.session(user);
  }

  @Roles(Role.ADMIN, Role.RESIDENT)
  @Get('me')
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: auth.sub }, include: { tenant: true } });
    return this.session(user).user;
  }
}
