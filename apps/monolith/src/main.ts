import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import express from 'express';
import { join } from 'node:path';

import { JwtAuthGuard } from '../../api-gateway/src/auth/guards/jwt-guard.js';
import { RolesGuard } from '../../api-gateway/src/auth/guards/roles.guard.js';
import { RpcHttpExceptionFilter } from '../../libs/filters/rpc-http-exception.filter.js';
import { MonolithModule } from './monolith.module.js';

/**
 * Loopback ports the service modules are addressed on. The gateway and the
 * inter-service clients in `apps/*` already point at these exact ports, so
 * keeping them preserves every existing `ClientProxy` call.
 */
const SERVICE_PORTS = [
  { name: 'auth', port: 3001 },
  { name: 'users', port: 3002 },
  { name: 'products', port: 3003 },
  { name: 'inventory', port: 3004 },
  { name: 'promocodes', port: 3005 },
  { name: 'orders', port: 3006 },
] as const;

async function bootstrap() {
  const app = await NestFactory.create(MonolithModule);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server).
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

  // Shared HTTP/RPC configuration. Register before connecting the
  // microservices so `inheritAppConfig` picks the filters and pipes up.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new RpcHttpExceptionFilter());

  const jwtGuard = app.get(JwtAuthGuard);
  const rolesGuard = app.get(RolesGuard);
  app.useGlobalGuards(jwtGuard, rolesGuard);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  for (const service of SERVICE_PORTS) {
    app.connectMicroservice<MicroserviceOptions>(
      {
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: service.port },
      },
      { inheritAppConfig: true },
    );
  }

  await app.startAllMicroservices();
  console.log(
    `[monolith] microservices listening on 127.0.0.1:${SERVICE_PORTS.map((s) => s.port).join(',')}`,
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`[monolith] HTTP gateway listening on 0.0.0.0:${port}`);
}

await bootstrap();
