import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { RpcHttpExceptionFilter } from '../../libs/filters/rpc-http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(InventoryModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3004,
    },
  });
  app.useGlobalFilters(new RpcHttpExceptionFilter());
  await app.listen();
  console.log(`Inventory microservice is running on tcp://3004`);
}
await bootstrap();
