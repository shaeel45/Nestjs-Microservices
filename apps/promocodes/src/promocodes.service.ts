import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from './generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreatePromoCodeDto,
  PromoCodeQueryDto,
  RedeemPromoCodeDto,
  RedemptionQueryDto,
  UpdatePromoCodeDto,
  ValidatePromoCodeDto,
  normalizePromoCode,
} from '../../libs/dto/promocodes/promo-code.dto.js';

type PromoCodeRow = {
  id: number;
  code: string;
  discountPercent: number;
  description: string;
  active: boolean;
  usageCount: number;
  maxUses: number | null;
  minOrderAmount: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ValidationReason =
  | 'ok'
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'usage_limit'
  | 'min_order';

type PromoValidation = {
  valid: boolean;
  reason: ValidationReason;
  message: string;
  promoCodeId?: number;
  code?: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrderAmount?: number;
  expiresAt?: Date | null;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated promo code list with search, status filter and global stats.
   * `stats` always reflects every code (not just the filtered page) so the
   * admin header stays correct while filtering.
   */
  async findAll(query?: PromoCodeQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;
    const all = query?.all === true;

    const where: Prisma.PromoCodeWhereInput = {};
    const search = query?.search?.trim();
    if (search) {
      where.OR = [
        { code: { contains: search.toUpperCase() } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (query?.active !== undefined) {
      where.active = query.active;
    }

    const [total, data, totalCodes, activeCodes] = await this.prisma.$transaction(
      [
        this.prisma.promoCode.count({ where }),
        this.prisma.promoCode.findMany({
          where,
          orderBy: this.buildOrderBy(query?.sortBy),
          ...(all ? {} : { skip, take: limit }),
        }),
        this.prisma.promoCode.count(),
        this.prisma.promoCode.count({ where: { active: true } }),
      ],
    );

    return {
      data,
      total,
      page: all ? 1 : page,
      limit: all ? total : limit,
      totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)),
      stats: {
        total: totalCodes,
        active: activeCodes,
        inactive: totalCodes - activeCodes,
      },
    };
  }

  async findById(id: number) {
    const promoCode = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promoCode) {
      throw new NotFoundException(`Promo code ${id} not found`);
    }
    return promoCode;
  }

  async findByCode(code: string) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { code: normalizePromoCode(code) },
    });
    if (!promoCode) {
      throw new NotFoundException(`Promo code ${code} not found`);
    }
    return promoCode;
  }

  /**
   * Codes the storefront can advertise right now: active, not expired and
   * not exhausted.
   */
  async getActivePromoCodes() {
    const now = new Date();
    const codes = await this.prisma.promoCode.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ discountPercent: 'desc' }, { code: 'asc' }],
      select: {
        code: true,
        discountPercent: true,
        description: true,
        minOrderAmount: true,
        expiresAt: true,
        usageCount: true,
        maxUses: true,
      },
    });

    return codes
      .filter((code) => code.maxUses === null || code.usageCount < code.maxUses)
      .map(({ usageCount, maxUses, ...code }) => code);
  }

  async create(data: CreatePromoCodeDto) {
    const code = normalizePromoCode(data.code);

    const existing = await this.prisma.promoCode.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictException(`Promo code "${code}" already exists`);
    }

    try {
      return await this.prisma.promoCode.create({
        data: {
          code,
          discountPercent: data.discountPercent,
          description: data.description ?? '',
          active: data.active ?? true,
          maxUses: data.maxUses ?? null,
          minOrderAmount: Number(data.minOrderAmount ?? 0),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });
    } catch (error) {
      // Concurrent create won the race.
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException(`Promo code "${code}" already exists`);
      }
      throw error;
    }
  }

  async update(id: number, data: UpdatePromoCodeDto) {
    const current = await this.findById(id);
    const update: Prisma.PromoCodeUpdateInput = {};

    if (data.code !== undefined) {
      const code = normalizePromoCode(data.code);
      if (code !== current.code) {
        const clash = await this.prisma.promoCode.findUnique({
          where: { code },
        });
        if (clash) {
          throw new ConflictException(`Promo code "${code}" already exists`);
        }
      }
      update.code = code;
    }

    if (data.discountPercent !== undefined) {
      update.discountPercent = data.discountPercent;
    }
    if (data.description !== undefined) {
      update.description = data.description;
    }
    if (data.active !== undefined) {
      update.active = data.active;
    }
    if (data.maxUses !== undefined) {
      if (data.maxUses !== null && data.maxUses < current.usageCount) {
        throw new BadRequestException(
          `maxUses cannot be lower than the current usage count (${current.usageCount})`,
        );
      }
      update.maxUses = data.maxUses;
    }
    if (data.minOrderAmount !== undefined) {
      update.minOrderAmount = Number(data.minOrderAmount);
    }
    if (data.expiresAt !== undefined) {
      update.expiresAt = data.expiresAt === null ? null : new Date(data.expiresAt);
    }

    try {
      return await this.prisma.promoCode.update({
        where: { id },
        data: update,
      });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException(
          `Promo code "${normalizePromoCode(data.code ?? current.code)}" already exists`,
        );
      }
      throw error;
    }
  }

  async setActive(id: number, active: boolean) {
    const current = await this.findById(id);

    if (active && current.expiresAt && current.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Cannot activate a promo code that has already expired',
      );
    }

    return this.prisma.promoCode.update({
      where: { id },
      data: { active },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.promoCode.delete({ where: { id } });
  }

  /**
   * Dry-run validation used by the storefront when a customer types a code.
   * Returns a structured result instead of throwing so the UI can show a
   * friendly message for every failure mode.
   */
  async validate(data: ValidatePromoCodeDto): Promise<PromoValidation> {
    const code = normalizePromoCode(data.code);
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    return this.evaluate(promoCode, Number(data.orderAmount ?? 0));
  }

  /**
   * Finalize a redemption. The row is locked (SELECT ... FOR UPDATE) so two
   * concurrent checkouts cannot exceed `maxUses`, then usage is incremented
   * and an audit row is written in the same transaction.
   */
  async redeem(data: RedeemPromoCodeDto) {
    const code = normalizePromoCode(data.code);
    const orderAmount = Math.max(0, Number(data.orderAmount ?? 0));

    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<PromoCodeRow[]>(Prisma.sql`
        SELECT "id", "code", "discountPercent", "description", "active",
               "usageCount", "maxUses", "minOrderAmount", "expiresAt",
               "createdAt", "updatedAt"
        FROM "ecommerce_promo_codes"
        WHERE "code" = ${code}
        FOR UPDATE
      `);
      const promoCode = rows[0] ?? null;
      const validation = this.evaluate(promoCode, orderAmount);

      if (!validation.valid || !promoCode) {
        if (validation.reason === 'not_found') {
          throw new NotFoundException(validation.message);
        }
        if (validation.reason === 'usage_limit') {
          throw new ConflictException(validation.message);
        }
        throw new BadRequestException(validation.message);
      }

      const updated = await tx.promoCode.update({
        where: { id: promoCode.id },
        data: { usageCount: { increment: 1 } },
      });

      const redemption = await tx.promoCodeRedemption.create({
        data: {
          promoCodeId: promoCode.id,
          code: promoCode.code,
          orderReference: data.orderReference ?? null,
          orderAmount,
          discountAmount: validation.discountAmount ?? 0,
          performedBy: data.performedBy ?? null,
        },
      });

      return {
        valid: true,
        code: updated.code,
        discountPercent: updated.discountPercent,
        discountAmount: validation.discountAmount ?? 0,
        usageCount: updated.usageCount,
        maxUses: updated.maxUses,
        redemptionId: redemption.id,
      };
    });
  }

  async getRedemptions(id: number, query?: RedemptionQueryDto) {
    await this.findById(id);

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.promoCodeRedemption.count({ where: { promoCodeId: id } }),
      this.prisma.promoCodeRedemption.findMany({
        where: { promoCodeId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private buildOrderBy(
    sortBy?: PromoCodeQueryDto['sortBy'],
  ): Prisma.PromoCodeOrderByWithRelationInput {
    switch (sortBy) {
      case 'code':
        return { code: 'asc' };
      case 'discount':
        return { discountPercent: 'desc' };
      case 'usage':
        return { usageCount: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  /**
   * Single source of truth for "can this code be used for this amount?".
   * Shared by validate (dry run) and redeem (inside the row lock) so both
   * paths enforce identical rules.
   */
  private evaluate(
    promoCode: PromoCodeRow | null,
    orderAmount: number,
  ): PromoValidation {
    const amount = Math.max(0, Number(orderAmount) || 0);

    if (!promoCode) {
      return {
        valid: false,
        reason: 'not_found',
        message: 'That promo code does not exist.',
      };
    }

    const base = {
      promoCodeId: promoCode.id,
      code: promoCode.code,
      discountPercent: promoCode.discountPercent,
      minOrderAmount: promoCode.minOrderAmount,
      expiresAt: promoCode.expiresAt,
    };

    if (!promoCode.active) {
      return {
        ...base,
        valid: false,
        reason: 'inactive',
        message: 'This promo code is not active.',
      };
    }

    if (promoCode.expiresAt && promoCode.expiresAt.getTime() < Date.now()) {
      return {
        ...base,
        valid: false,
        reason: 'expired',
        message: 'This promo code has expired.',
      };
    }

    if (promoCode.maxUses !== null && promoCode.usageCount >= promoCode.maxUses) {
      return {
        ...base,
        valid: false,
        reason: 'usage_limit',
        message: 'This promo code has reached its usage limit.',
      };
    }

    if (amount < promoCode.minOrderAmount) {
      return {
        ...base,
        valid: false,
        reason: 'min_order',
        message: `This promo code requires a minimum order of $${promoCode.minOrderAmount.toFixed(
          2,
        )}.`,
      };
    }

    return {
      ...base,
      valid: true,
      reason: 'ok',
      discountAmount: roundMoney((amount * promoCode.discountPercent) / 100),
      message: `${promoCode.discountPercent}% off applied.`,
    };
  }
}
