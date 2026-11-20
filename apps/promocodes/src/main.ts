import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { RpcHttpExceptionFilter } from '../../libs/filters/rpc-http-exception.filter.js';
import { PromoCodesModule } from './promocodes.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PromoCodesModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3005,
      },
    },
  );
  app.useGlobalFilters(new RpcHttpExceptionFilter());
  await app.listen();
  console.log(`Promo codes microservice is running on tcp://3005`);
}
await bootstrap();
