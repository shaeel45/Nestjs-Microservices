import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ShippingQuoteQueryDto,
  UpdateStoreSettingsDto,
} from '../../../libs/dto/settings/store-settings.dto.js';
import { Public } from '../auth/decorators/public.decorators.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enums.js';

/**
 * Store configuration: branding, the promotions banner and shipping rules.
 * Backed by the promo codes service, which owns the promotions domain.
 */
@Controller('settings')
export class SettingsController {
  constructor(
    @Inject('PROMOCODES_SERVICE')
    private readonly settingsClient: ClientProxy,
  ) {}

  private async call<T>(cmd: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.settingsClient.send<T>({ cmd }, payload));
    } catch (error) {
      const err = error as {
        status?: number | string;
        statusCode?: number;
        message?: string | string[];
      };
      const status = Number(err?.statusCode ?? err?.status);
      const message = Array.isArray(err?.message)
        ? err.message.join(', ')
        : err?.message || 'Settings service error';

      if (status === 400) throw new BadRequestException(message);
      throw new InternalServerErrorException(message);
    }
  }

  // --- Storefront (public) ---

  /** Banner text, branding and shipping rules for the storefront. */
  @Public()
  @Get('store')
  getStoreSettings() {
    return this.call('settings.get', {});
  }

  /** Available shipping options, their rates and delivery estimates. */
  @Public()
  @Get('shipping/methods')
  getShippingMethods() {
    return this.call('settings.shippingMethods', {});
  }

  /** Shipping cost for a cart subtotal, e.g. `?subtotal=89.50&method=express`. */
  @Public()
  @Get('shipping/quote')
  getShippingQuote(@Query() query: ShippingQuoteQueryDto) {
    return this.call('settings.shippingQuote', query);
  }

  // --- Admin ---

  @Roles(Role.ADMIN)
  @Put('store')
  replaceStoreSettings(@Body() data: UpdateStoreSettingsDto) {
    return this.call('settings.update', data);
  }

  @Roles(Role.ADMIN)
  @Patch('store')
  updateStoreSettings(@Body() data: UpdateStoreSettingsDto) {
    return this.call('settings.update', data);
  }
}
