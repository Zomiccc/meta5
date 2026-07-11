import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';

async function seedAdmin(configService: ConfigService) {
  const prisma = new PrismaClient();
  const email = configService.get<string>('ADMIN_EMAIL') || 'adminfxons@gmail.com';
  const plainPassword = configService.get<string>('ADMIN_PASSWORD') || 'Admin12@';
  try {
    const password = await bcrypt.hash(plainPassword, 12);
    const referralCode = `ADMIN-${Date.now()}`;
    await prisma.user.upsert({
      where: { email },
      update: { password, role: 'admin', status: 'active' },
      create: {
        name: 'Admin',
        email,
        password,
        role: 'admin',
        status: 'active',
        referralCode,
      },
    });
    console.log(`Admin user ready: ${email}`);
  } catch (err: any) {
    console.error('Failed to seed admin:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 2000,
      message: { message: 'Too many requests, please try again later.' },
    }),
  );
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        frontendUrl,
        'https://fxons.com',
        'https://www.fxons.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https:\/\/.*\.vercel\.app$/,
        /^https:\/\/.*\.onrender\.com$/,
      ];
      const isAllowed = allowed.some((a) => {
        if (typeof a === 'string') return origin === a;
        return a.test(origin);
      });
      if (isAllowed) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port, '0.0.0.0');

  await seedAdmin(configService);

  const twelveKey = configService.get<string>('TWELVE_DATA_API_KEY');
  const currencyKey = configService.get<string>('CURRENCY_API_KEY');
  const simPrices = configService.get<string>('SIMULATE_PRICES');
  console.log(`Backend running on http://localhost:${port}/api`);
  console.log(`Price feeds: TWELVE=${!!twelveKey} CURRENCY=${!!currencyKey} SIMULATE=${simPrices}`);
}

bootstrap();
