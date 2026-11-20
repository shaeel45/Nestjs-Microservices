import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PromoCodesController } from './promocodes.controller.js';
import { PromoCodesService } from './promocodes.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PromoCodesController],
  providers: [PromoCodesService],
})
export class PromoCodesModule {}
