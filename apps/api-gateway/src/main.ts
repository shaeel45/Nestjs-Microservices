import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API gateway is running on http://127.0.0.1:${port}`);

}
await bootstrap();
