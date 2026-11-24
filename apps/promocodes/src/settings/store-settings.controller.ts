import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ShippingQuoteQueryDto,
  UpdateStoreSettingsDto,
} from '../../../libs/dto/settings/store-settings.dto.js';
import { StoreSettingsService } from './store-settings.service.js';

@Controller()
export class StoreSettingsController {
  constructor(private readonly storeSettingsService: StoreSettingsService) {}

  @MessagePattern({ cmd: 'settings.get' })
  get() {
    return this.storeSettingsService.get();
  }

  @MessagePattern({ cmd: 'settings.update' })
  update(@Payload() data: UpdateStoreSettingsDto) {
    return this.storeSettingsService.update(data ?? {});
  }

  @MessagePattern({ cmd: 'settings.shippingMethods' })
  shippingMethods() {
    return this.storeSettingsService.getShippingMethods();
  }

  @MessagePattern({ cmd: 'settings.shippingQuote' })
  shippingQuote(@Payload() query?: ShippingQuoteQueryDto) {
    return this.storeSettingsService.quote(query ?? {});
  }
}
