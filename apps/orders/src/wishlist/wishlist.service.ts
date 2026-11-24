import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  AddWishlistItemDto,
  SyncWishlistDto,
  ToggleWishlistItemDto,
  WishlistItemDto,
} from '../../../libs/dto/orders/wishlist.dto.js';

const WISHLIST_INCLUDE = {
  items: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.WishlistInclude;

type WishlistWithItems = Prisma.WishlistGetPayload<{
  include: typeof WISHLIST_INCLUDE;
}>;

interface NormalizedWishlistItem {
  productId: string | null;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  itemKey: string;
}

interface WishlistCustomer {
  customerId?: string;
  customerEmail?: string;
}

/**
 * Server-side wishlist. Every storefront save/remove is persisted here so the
 * list follows the customer across devices instead of living only in
 * localStorage.
 */
@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Storefront operations -------------------------------------------------

  async getWishlist(wishlistToken: string, customer?: WishlistCustomer) {
    const wishlist = await this.getOrCreate(wishlistToken, customer);
    return this.toView(wishlist);
  }

  async addItem(data: AddWishlistItemDto) {
    const wishlist = await this.getOrCreate(data.wishlistToken, data);
    const line = this.normalizeItem(data.item);

    await this.prisma.wishlistItem.upsert({
      where: {
        wishlistId_itemKey: {
          wishlistId: wishlist.id,
          itemKey: line.itemKey,
        },
      },
      create: { wishlistId: wishlist.id, ...line },
      update: {
        productId: line.productId,
        name: line.name,
        price: line.price,
        image: line.image,
        category: line.category,
      },
    });
    await this.touch(wishlist.id);

    return this.getWishlist(data.wishlistToken, data);
  }

  /** Add when missing, remove when already saved — the heart-button action. */
  async toggleItem(data: ToggleWishlistItemDto) {
    const wishlist = await this.getOrCreate(data.wishlistToken, data);
    const line = this.normalizeItem(data.item);

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_itemKey: {
          wishlistId: wishlist.id,
          itemKey: line.itemKey,
        },
      },
    });

    let inWishlist: boolean;
    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
      inWishlist = false;
    } else {
      await this.prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, ...line },
      });
      inWishlist = true;
    }
    await this.touch(wishlist.id);

    const view = await this.getWishlist(data.wishlistToken, data);
    return { ...view, inWishlist };
  }

  async removeItem(data: {
    wishlistToken: string;
    productId?: string;
    itemId?: number;
  }) {
    const wishlist = await this.getOrCreate(data.wishlistToken);

    if (data.itemId) {
      await this.prisma.wishlistItem.deleteMany({
        where: { id: Number(data.itemId), wishlistId: wishlist.id },
      });
    } else if (data.productId) {
      const productId = data.productId.trim();
      await this.prisma.wishlistItem.deleteMany({
        where: {
          wishlistId: wishlist.id,
          OR: [{ productId }, { itemKey: `product:${productId}` }],
        },
      });
    }
    await this.touch(wishlist.id);

    return this.getWishlist(data.wishlistToken);
  }

  async clear(wishlistToken: string) {
    const wishlist = await this.getOrCreate(wishlistToken);
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });
    await this.touch(wishlist.id);

    return this.getWishlist(wishlistToken);
  }

  /** Replace the whole list (used to mirror a browser wishlist on first load). */
  async replaceItems(data: SyncWishlistDto) {
    const wishlist = await this.getOrCreate(data.wishlistToken, data);
    const lines = this.mergeItems(
      data.items.map((item) => this.normalizeItem(item)),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
      if (lines.length > 0) {
        await tx.wishlistItem.createMany({
          data: lines.map((line) => ({ ...line, wishlistId: wishlist.id })),
          skipDuplicates: true,
        });
      }
    });
    await this.touch(wishlist.id);

    return this.getWishlist(data.wishlistToken, data);
  }

  // --- Internals -------------------------------------------------------------

  private async getOrCreate(
    wishlistToken: string,
    customer?: WishlistCustomer,
  ): Promise<WishlistWithItems> {
    return this.prisma.wishlist.upsert({
      where: { wishlistToken },
      create: {
        wishlistToken,
        customerId: customer?.customerId?.trim() || null,
        customerEmail: customer?.customerEmail?.trim().toLowerCase() || null,
      },
      update: {
        ...(customer?.customerId?.trim()
          ? { customerId: customer.customerId.trim() }
          : {}),
        ...(customer?.customerEmail?.trim()
          ? { customerEmail: customer.customerEmail.trim().toLowerCase() }
          : {}),
      },
      include: WISHLIST_INCLUDE,
    });
  }

  private async touch(wishlistId: number) {
    await this.prisma.wishlist.update({
      where: { id: wishlistId },
      data: { updatedAt: new Date() },
    });
  }

  private normalizeItem(item: WishlistItemDto): NormalizedWishlistItem {
    const productId = item.productId?.trim() || null;
    const name = item.name.trim();

    return {
      productId,
      name,
      price: Math.round((Math.max(0, Number(item.price) || 0) + Number.EPSILON) * 100) / 100,
      image: item.image?.trim() || null,
      category: item.category?.trim() || null,
      itemKey: productId
        ? `product:${productId}`
        : `name:${name.toLowerCase()}`,
    };
  }

  private mergeItems(
    lines: NormalizedWishlistItem[],
  ): NormalizedWishlistItem[] {
    const merged = new Map<string, NormalizedWishlistItem>();
    for (const line of lines) {
      if (!merged.has(line.itemKey)) merged.set(line.itemKey, line);
    }
    return [...merged.values()];
  }

  /** Wishlist view consumed by the storefront. */
  private toView(wishlist: WishlistWithItems) {
    return {
      wishlistToken: wishlist.wishlistToken,
      customerId: wishlist.customerId,
      customerEmail: wishlist.customerEmail,
      items: wishlist.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        addedAt: item.createdAt,
      })),
      itemCount: wishlist.items.length,
      updatedAt: wishlist.updatedAt,
    };
  }
}
