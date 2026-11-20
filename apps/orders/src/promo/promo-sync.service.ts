import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { sendRpc } from '../../../libs/rpc/rpc-client.util.js';

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  discountPercent?: number;
  discountAmount?: number;
  reason?: string;
  message?: string;
}

export interface PromoRedemptionResult {
  code: string;
  discountPercent: number;
  discountAmount: number;
  redeemed: boolean;
  warning?: string;
}

@Injectable()
export class PromoSyncService {
  private readonly logger = new Logger(PromoSyncService.name);

  constructor(
    @Inject('PROMOCODES_SERVICE')
    private readonly promoCodes: ClientProxy,
  ) {}

  /**
   * Dry-run validation of a promo code against an order subtotal.
   */
  async validatePromo(
    code: string,
    orderAmount: number,
  ): Promise<PromoValidationResult> {
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new BadRequestException('Promo code is required');
    }

    const validation = await sendRpc<PromoValidationResult>(
      this.promoCodes,
      'promocodes.validate',
      { code: cleanCode, orderAmount: Number(orderAmount) || 0 },
    );

    if (!validation?.valid) {
      if (validation?.reason === 'not_found') {
        throw new NotFoundException(
          validation.message || `Promo code "${cleanCode}" not found`,
        );
      }
      if (validation?.reason === 'usage_limit') {
        throw new ConflictException(
          validation.message ||
            `Promo code "${cleanCode}" has reached its usage limit`,
        );
      }
      throw new BadRequestException(
        validation?.message || `Promo code "${cleanCode}" cannot be applied`,
      );
    }

    return validation;
  }

  /**
   * Finalize promo redemption once an order is created.
   * Best-effort: catches errors so an already placed order is not cancelled
   * solely because redemption recording encountered a glitch.
   */
  async redeemPromo(
    code: string,
    orderAmount: number,
    orderReference: string,
  ): Promise<PromoRedemptionResult> {
    const cleanCode = String(code || '').trim().toUpperCase();
    try {
      const redeemed = await sendRpc<{
        code: string;
        discountPercent: number;
        discountAmount?: number;
      }>(this.promoCodes, 'promocodes.redeem', {
        code: cleanCode,
        orderAmount: Number(orderAmount) || 0,
        orderReference,
      });

      return {
        code: redeemed.code || cleanCode,
        discountPercent: redeemed.discountPercent ?? 0,
        discountAmount: redeemed.discountAmount ?? 0,
        redeemed: true,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Promo could not be recorded';
      this.logger.warn(
        `Order ${orderReference} created but promo ${cleanCode} was not redeemed: ${message}`,
      );
      return {
        code: cleanCode,
        discountPercent: 0,
        discountAmount: 0,
        redeemed: false,
        warning: message,
      };
    }
  }
}
