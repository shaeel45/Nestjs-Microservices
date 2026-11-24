import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PromoCodesController } from './promocodes.controller.js';
import { PromoCodesService } from './promocodes.service.js';
import { StoreSettingsController } from './settings/store-settings.controller.js';
import { StoreSettingsService } from './settings/store-settings.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PromoCodesController, StoreSettingsController],
  providers: [PromoCodesService, StoreSettingsService],
})
export class PromoCodesModule {}
