import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  Logger,
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
  CreateInventoryDto,
  InventoryQueryDto,
  UpdateInventoryDto,
  AdjustStockDto,
  ConsumeStockDto,
  ReserveStockDto,
  ReleaseStockDto,
  TransactionQueryDto,
} from '../../../libs/dto/inventory/inventory.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enums.js';
import { Public } from '../auth/decorators/public.decorators.js';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryClient: ClientProxy,
    @Inject('PRODUCTS_SERVICE')
    private readonly productsClient: ClientProxy,
  ) {}

  /**
   * Send to the inventory microservice and translate its RPC error into
   * the matching HTTP exception so clients get real 400/404/409s.
   */
  private async call<T>(cmd: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(
        this.inventoryClient.send<T>({ cmd }, payload),
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
      : err?.message || 'Inventory service error';

    if (status === 400) return new BadRequestException(message);
    if (status === 404) return new NotFoundException(message);
    if (status === 409) return new ConflictException(message);
    return new InternalServerErrorException(message);
  }

  /**
   * Inventory is the source of truth for on-hand stock. Products keep a
   * denormalised `stock` cache for catalog reads, so mirror the new
   * quantity back after any inventory mutation. Best-effort: a catalog
   * cache miss should never fail the inventory operation.
   */
  private async syncProductStock(productId?: number, stock?: number) {
    if (productId === undefined || stock === undefined) return;
    const id = Number(productId);
    const quantity = Number(stock);
    if (!Number.isFinite(id) || !Number.isFinite(quantity)) return;

    try {
      await firstValueFrom(
        this.productsClient.send(
          { cmd: 'products.setStockCache' },
          { id, stock: quantity },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Could not sync stock cache for product ${id}: ${
          (error as Error).message
        }`,
      );
    }
  }

  @Public()
  @Get()
  findAll(@Query() query: InventoryQueryDto) {
    return this.call('inventory.findAll', query);
  }

  @Roles(Role.ADMIN)
  @Get(':id/transactions')
  findTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: TransactionQueryDto,
  ) {
    return this.call('inventory.findTransactions', {
      inventoryItemId: id,
      query,
    });
  }

  @Public()
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.call('inventory.findById', id);
  }

  @Public()
  @Get('product/:productId')
  findByProductId(@Param('productId', ParseIntPipe) productId: number) {
    return this.call('inventory.findByProductId', productId);
  }

  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() data: CreateInventoryDto) {
    const created = await this.call<{ quantity?: number } | null>(
      'inventory.create',
      data,
    );
    await this.syncProductStock(data.productId, created?.quantity);
    return created;
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() inventory: UpdateInventoryDto & {
      quantity?: unknown;
      reservedQuantity?: unknown;
    },
  ) {
    // Quantity is only mutable through the audited stock endpoints.
    if (
      inventory.quantity !== undefined ||
      inventory.reservedQuantity !== undefined
    ) {
      throw new BadRequestException(
        'quantity and reservedQuantity cannot be patched directly. Use POST /inventory/adjust-stock for on-hand changes, or the reserve/release/consume endpoints.',
      );
    }

    return this.call('inventory.update', { id, inventory });
  }

  @Roles(Role.ADMIN)
  @Post('adjust-stock')
  async adjustStock(@Body() data: AdjustStockDto) {
    const result = await this.call<{
      item?: { productId?: number; quantity?: number };
    }>('inventory.adjustStock', data);
    await this.syncProductStock(
      result?.item?.productId ?? data.productId,
      result?.item?.quantity,
    );
    return result;
  }

  @Roles(Role.ADMIN)
  @Post('reserve')
  reserveStock(@Body() data: ReserveStockDto) {
    return this.call('inventory.reserveStock', data);
  }

  @Roles(Role.ADMIN)
  @Post('release')
  releaseStock(@Body() data: ReleaseStockDto) {
    return this.call('inventory.releaseStock', data);
  }

  @Roles(Role.ADMIN)
  @Post('consume')
  async consumeStock(@Body() data: ConsumeStockDto) {
    const result = await this.call<{
      item?: { productId?: number; quantity?: number };
    }>('inventory.consumeStock', data);
    await this.syncProductStock(
      result?.item?.productId ?? data.productId,
      result?.item?.quantity,
    );
    return result;
  }

  // --- Storefront checkout (public, quantity-validated) ---

  @Public()
  @Post('checkout/reserve')
  reserveForCheckout(@Body() data: ReserveStockDto) {
    return this.call('inventory.reserveStock', data);
  }

  @Public()
  @Post('checkout/consume')
  async consumeForCheckout(@Body() data: ConsumeStockDto) {
    const result = await this.call<{
      item?: { productId?: number; quantity?: number };
    }>('inventory.consumeStock', data);
    await this.syncProductStock(
      result?.item?.productId ?? data.productId,
      result?.item?.quantity,
    );
    return result;
  }

  @Public()
  @Post('checkout/release')
  releaseForCheckout(@Body() data: ReleaseStockDto) {
    return this.call('inventory.releaseStock', data);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.call('inventory.delete', id);
  }
}
