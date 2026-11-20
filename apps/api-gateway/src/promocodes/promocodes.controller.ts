import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreatePromoCodeDto,
  PromoCodeQueryDto,
  RedeemPromoCodeDto,
  RedemptionQueryDto,
  SetPromoCodeActiveDto,
  UpdatePromoCodeDto,
  ValidatePromoCodeDto,
} from '../../../libs/dto/promocodes/promo-code.dto.js';
import { Public } from '../auth/decorators/public.decorators.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enums.js';

@Controller('promocodes')
export class PromoCodesController {
  constructor(
    @Inject('PROMOCODES_SERVICE')
    private readonly promoCodesClient: ClientProxy,
  ) {}

  /**
   * Send to the promo codes microservice and translate its RPC error into
   * the matching HTTP exception so clients get real 400/404/409s.
   */
  private async call<T>(cmd: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(
        this.promoCodesClient.send<T>({ cmd }, payload),
      );
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  private toHttpError(error: unknown) {
    const err = error as {
      status?: number | string;
      statusCode?: number;
      message?: string | string[];
    };
    const status = Number(err?.statusCode ?? err?.status);
    const message = Array.isArray(err?.message)
      ? err.message.join(', ')
      : err?.message || 'Promo codes service error';

    if (status === 400) return new BadRequestException(message);
    if (status === 404) return new NotFoundException(message);
    if (status === 409) return new ConflictException(message);
    return new InternalServerErrorException(message);
  }

  // --- Storefront (public) ---
  // Static paths are declared before `:id` so they are not shadowed.

  /** Codes that can be advertised right now (active, unexpired, not exhausted). */
  @Public()
  @Get('active')
  findActive() {
    return this.call('promocodes.active', {});
  }

  /** Dry-run validation — safe to call on every apply. Never increments usage. */
  @Public()
  @Post('validate')
  validate(@Body() data: ValidatePromoCodeDto) {
    return this.call('promocodes.validate', data);
  }

  /** Finalize a redemption at order placement (increments usage + audit row). */
  @Public()
  @Post('redeem')
  redeem(@Body() data: RedeemPromoCodeDto) {
    return this.call('promocodes.redeem', data);
  }

  // --- Admin ---

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: PromoCodeQueryDto) {
    return this.call('promocodes.findAll', query);
  }

  @Roles(Role.ADMIN)
  @Get(':id/redemptions')
  findRedemptions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: RedemptionQueryDto,
  ) {
    return this.call('promocodes.redemptions', {
      promoCodeId: id,
      query,
    });
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.call('promocodes.findById', id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() data: CreatePromoCodeDto) {
    return this.call('promocodes.create', data);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SetPromoCodeActiveDto,
  ) {
    return this.call('promocodes.setActive', { id, active: body.active });
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() promoCode: UpdatePromoCodeDto,
  ) {
    return this.call('promocodes.update', { id, promoCode });
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.call('promocodes.delete', id);
  }
}
