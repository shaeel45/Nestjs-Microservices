import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module.js';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const port = Number(process.env.PORT ?? 3000);

  const jwtGuard = app.get(JwtAuthGuard);
  const rolesGuard = app.get(RolesGuard);

  app.useGlobalGuards(jwtGuard, rolesGuard);
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port);
  console.log(`API gateway is running on http://127.0.0.1:${port}`);
}

await bootstrap();