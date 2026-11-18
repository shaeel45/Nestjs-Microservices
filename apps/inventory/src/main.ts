import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(InventoryModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3004,
    },
  });
  await app.listen();
  console.log(`Inventory microservice is running on tcp://3004`);
}
await bootstrap();
