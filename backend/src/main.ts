import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AuthGuard } from './common/auth';
import { PrismaService } from './common/prisma.service';
import { ContentController } from './content.controller';
import { FinanceController } from './finance.controller';
import { PeopleController } from './people.controller';
import { PortalController } from './portal.controller';
import { SitesController } from './sites.controller';

try {
  process.loadEnvFile();
} catch {
  // .env yoksa ortam değişkenleri doğrudan kullanılır (ör. production)
}
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET tanımlı değil (.env dosyasını kontrol edin).');

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '7d' } })],
  controllers: [
    AuthController,
    SitesController,
    PeopleController,
    FinanceController,
    BillingController,
    ContentController,
    PortalController,
  ],
  providers: [PrismaService, BillingService, { provide: APP_GUARD, useClass: AuthGuard }],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3100'] });
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`API hazır: http://localhost:${port}`);
}
bootstrap();
