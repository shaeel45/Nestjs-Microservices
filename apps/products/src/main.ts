import { NestFactory } from '@nestjs/core';
import { ProductsModule } from './products.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ProductsModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3003 
    }
  });
  await app.listen();
  console.log(`Products microservice is running on tcp://3003`);
}
await bootstrap();
