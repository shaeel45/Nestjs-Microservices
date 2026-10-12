import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module.js';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import express from 'express';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const allowed = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        process.env.ADMIN_PORTAL_ORIGIN,
        process.env.STOREFRONT_ORIGIN,
      ].filter(Boolean);
      if (allowed.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const jwtGuard = app.get(JwtAuthGuard);
  const rolesGuard = app.get(RolesGuard);

  app.useGlobalGuards(jwtGuard, rolesGuard);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads')),
  );

  await app.listen(port);
  console.log(`API gateway is running on http://127.0.0.1:${port}`);
}

await bootstrap();