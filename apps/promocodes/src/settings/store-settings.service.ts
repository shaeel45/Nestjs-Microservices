import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  ShippingQuoteQueryDto,
  UpdateStoreSettingsDto,
} from '../../../libs/dto/settings/store-settings.dto.js';

/** The settings table holds exactly one row so reads/writes are predictable. */
const SETTINGS_ID = 1;

/**
 * Must stay in sync with the defaults declared in
 * `prisma/promocodes/schema.prisma` (StoreSetting). Used only when the row has
 * not been created yet.
 */
const DEFAULT_SETTINGS = {
  storeName: 'ShopForge',
  tagline: 'Modern Wardrobe Essentials',
  supportEmail: 'support@shopforge.com',
  bannerText: '',
  bannerActive: true,
  freeShippingEnabled: true,
  freeShippingThreshold: 75,
  standardShippingRate: 9.99,
  expressShippingRate: 14.99,
  handlingDays: 1,
  currency: 'USD',
} as const;

export type ShippingMethodQuote = {
  id: 'standard' | 'express';
  label: string;
  rate: number;
  freeOverThreshold: boolean;
  estimatedDeliveryDays: number;
};

function roundMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class StoreSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read the store settings, creating the singleton row with defaults on the
   * first read so the storefront always has a complete record.
   */
  async get() {
    const existing = await this.prisma.storeSetting.findUnique({
      where: { id: SETTINGS_ID },
    });
    if (existing) return existing;

    return this.prisma.storeSetting.create({
      data: { id: SETTINGS_ID, ...DEFAULT_SETTINGS },
    });
  }

  /** Apply a partial update. Missing fields keep their current value. */
  async update(dto: UpdateStoreSettingsDto) {
    // `get()` creates the singleton row with defaults on first use.
    await this.get();

    const data: Prisma.StoreSettingUpdateInput = {};

    if (dto.storeName !== undefined) data.storeName = dto.storeName.trim();
    if (dto.tagline !== undefined) data.tagline = dto.tagline.trim();
    if (dto.supportEmail !== undefined) {
      data.supportEmail = dto.supportEmail.trim().toLowerCase();
    }
    if (dto.bannerText !== undefined) data.bannerText = dto.bannerText.trim();
    if (dto.bannerActive !== undefined) data.bannerActive = dto.bannerActive;
    if (dto.freeShippingEnabled !== undefined) {
      data.freeShippingEnabled = dto.freeShippingEnabled;
    }
    if (dto.freeShippingThreshold !== undefined) {
      data.freeShippingThreshold = roundMoney(dto.freeShippingThreshold);
    }
    if (dto.standardShippingRate !== undefined) {
      data.standardShippingRate = roundMoney(dto.standardShippingRate);
    }
    if (dto.expressShippingRate !== undefined) {
      data.expressShippingRate = roundMoney(dto.expressShippingRate);
    }
    if (dto.handlingDays !== undefined) data.handlingDays = dto.handlingDays;
    if (dto.currency !== undefined) data.currency = dto.currency;

    return this.prisma.storeSetting.update({
      where: { id: SETTINGS_ID },
      data,
    });
  }

  /** Shipping options with their current rates (checkout radio list). */
  async getShippingMethods() {
    const settings = await this.get();

    const methods: ShippingMethodQuote[] = [
      {
        id: 'standard',
        label: 'Standard Shipping',
        rate: settings.standardShippingRate,
        freeOverThreshold: settings.freeShippingEnabled,
        estimatedDeliveryDays: settings.handlingDays + 4,
      },
      {
        id: 'express',
        label: 'Priority Express',
        rate: settings.expressShippingRate,
        freeOverThreshold: false,
        estimatedDeliveryDays: settings.handlingDays + 1,
      },
    ];

    return {
      currency: settings.currency,
      freeShippingEnabled: settings.freeShippingEnabled,
      freeShippingThreshold: settings.freeShippingThreshold,
      handlingDays: settings.handlingDays,
      methods,
    };
  }

  /**
   * Price a shipment for a cart subtotal. Free shipping only waives the
   * standard rate; express stays paid so the upgrade is never silently free.
   */
  async quote(input: ShippingQuoteQueryDto = {}) {
    const settings = await this.get();
    const subtotal = Math.max(0, roundMoney(Number(input.subtotal) || 0));
    const method: 'standard' | 'express' =
      input.method === 'express' ? 'express' : 'standard';

    const baseRate =
      method === 'express'
        ? settings.expressShippingRate
        : settings.standardShippingRate;

    const qualifiesForFreeShipping =
      settings.freeShippingEnabled && subtotal >= settings.freeShippingThreshold;

    const shippingCost =
      subtotal === 0 || (method === 'standard' && qualifiesForFreeShipping)
        ? 0
        : roundMoney(baseRate);

    return {
      currency: settings.currency,
      method,
      subtotal,
      shippingCost,
      total: roundMoney(subtotal + shippingCost),
      freeShippingEnabled: settings.freeShippingEnabled,
      freeShippingThreshold: settings.freeShippingThreshold,
      qualifiesForFreeShipping,
      amountUntilFreeShipping: qualifiesForFreeShipping
        ? 0
        : roundMoney(Math.max(0, settings.freeShippingThreshold - subtotal)),
      handlingDays: settings.handlingDays,
      estimatedDeliveryDays: settings.handlingDays + (method === 'express' ? 1 : 4),
    };
  }
}
