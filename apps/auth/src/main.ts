import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module.js';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3001
    }
  });

  await app.listen();
  console.log(`Auth microservice is running on tcp://3001`);
}
await bootstrap();
