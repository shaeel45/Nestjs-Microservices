import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddWishlistItemDto,
  RemoveWishlistItemDto,
  SyncWishlistDto,
  ToggleWishlistItemDto,
  WishlistLookupDto,
  WishlistTokenDto,
} from '../../../libs/dto/orders/wishlist.dto.js';
import { WishlistService } from './wishlist.service.js';

@Controller()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @MessagePattern({ cmd: 'wishlist.get' })
  get(@Payload() data: WishlistLookupDto) {
    return this.wishlistService.getWishlist(data.wishlistToken, data);
  }

  @MessagePattern({ cmd: 'wishlist.addItem' })
  addItem(@Payload() data: AddWishlistItemDto) {
    return this.wishlistService.addItem(data);
  }

  @MessagePattern({ cmd: 'wishlist.toggle' })
  toggle(@Payload() data: ToggleWishlistItemDto) {
    return this.wishlistService.toggleItem(data);
  }

  @MessagePattern({ cmd: 'wishlist.removeItem' })
  removeItem(@Payload() data: RemoveWishlistItemDto) {
    return this.wishlistService.removeItem({
      wishlistToken: data.wishlistToken,
      productId: data.productId,
      itemId:
        data.itemId !== undefined && data.itemId !== null
          ? Number(data.itemId)
          : undefined,
    });
  }

  @MessagePattern({ cmd: 'wishlist.clear' })
  clear(@Payload() data: WishlistTokenDto) {
    return this.wishlistService.clear(data.wishlistToken);
  }

  @MessagePattern({ cmd: 'wishlist.sync' })
  sync(@Payload() data: SyncWishlistDto) {
    return this.wishlistService.replaceItems(data);
  }
}
