import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreatePromoCodeDto,
  PromoCodeQueryDto,
  RedeemPromoCodeDto,
  RedemptionQueryDto,
  UpdatePromoCodeDto,
  ValidatePromoCodeDto,
} from '../../libs/dto/promocodes/promo-code.dto.js';
import { PromoCodesService } from './promocodes.service.js';

@Controller()
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @MessagePattern({ cmd: 'promocodes.findAll' })
  findAll(@Payload() query?: PromoCodeQueryDto) {
    return this.promoCodesService.findAll(query);
  }

  /** Public catalog of redeemable codes (storefront offers page). */
  @MessagePattern({ cmd: 'promocodes.active' })
  findActive() {
    return this.promoCodesService.getActivePromoCodes();
  }

  @MessagePattern({ cmd: 'promocodes.findById' })
  findById(@Payload() id: number) {
    return this.promoCodesService.findById(Number(id));
  }

  @MessagePattern({ cmd: 'promocodes.findByCode' })
  findByCode(@Payload() code: string) {
    return this.promoCodesService.findByCode(String(code));
  }

  @MessagePattern({ cmd: 'promocodes.create' })
  create(@Payload() data: CreatePromoCodeDto) {
    return this.promoCodesService.create(data);
  }

  @MessagePattern({ cmd: 'promocodes.update' })
  update(@Payload() data: { id: number; promoCode: UpdatePromoCodeDto }) {
    return this.promoCodesService.update(Number(data.id), data.promoCode);
  }

  @MessagePattern({ cmd: 'promocodes.setActive' })
  setActive(@Payload() data: { id: number; active: boolean }) {
    return this.promoCodesService.setActive(
      Number(data.id),
      Boolean(data.active),
    );
  }

  @MessagePattern({ cmd: 'promocodes.delete' })
  remove(@Payload() id: number) {
    return this.promoCodesService.remove(Number(id));
  }

  /** Dry-run validation — never increments usage. */
  @MessagePattern({ cmd: 'promocodes.validate' })
  validate(@Payload() data: ValidatePromoCodeDto) {
    return this.promoCodesService.validate(data);
  }

  /** Finalize a redemption — atomically increments usage and logs history. */
  @MessagePattern({ cmd: 'promocodes.redeem' })
  redeem(@Payload() data: RedeemPromoCodeDto) {
    return this.promoCodesService.redeem(data);
  }

  @MessagePattern({ cmd: 'promocodes.redemptions' })
  redemptions(
    @Payload() data: { promoCodeId: number; query?: RedemptionQueryDto },
  ) {
    return this.promoCodesService.getRedemptions(
      Number(data.promoCodeId),
      data.query,
    );
  }
}
