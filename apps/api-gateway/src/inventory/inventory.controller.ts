import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateInventoryDto,
  InventoryQueryDto,
  UpdateInventoryDto,
  AdjustStockDto,
} from '../../../libs/dto/inventory/inventory.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enums.js';
import { Public } from '../auth/decorators/public.decorators.js';

@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryClient: ClientProxy,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryClient.send({ cmd: 'inventory.findAll' }, query);
  }

  @Public()
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryClient.send({ cmd: 'inventory.findById' }, id);
  }

  @Public()
  @Get('product/:productId')
  findByProductId(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryClient.send(
      { cmd: 'inventory.findByProductId' },
      productId,
    );
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() data: CreateInventoryDto) {
    return this.inventoryClient.send({ cmd: 'inventory.create' }, data);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() inventory: UpdateInventoryDto,
  ) {
    return this.inventoryClient.send(
      { cmd: 'inventory.update' },
      { id, inventory },
    );
  }

  @Roles(Role.ADMIN)
  @Post('adjust-stock')
  adjustStock(@Body() data: AdjustStockDto) {
    return this.inventoryClient.send({ cmd: 'inventory.adjustStock' }, data);
  }

  @Roles(Role.ADMIN)
  @Post('reserve')
  reserveStock(@Body() data: { productId: number; quantity: number }) {
    return this.inventoryClient.send(
      { cmd: 'inventory.reserveStock' },
      data,
    );
  }

  @Roles(Role.ADMIN)
  @Post('release')
  releaseStock(@Body() data: { productId: number; quantity: number }) {
    return this.inventoryClient.send(
      { cmd: 'inventory.releaseStock' },
      data,
    );
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryClient.send({ cmd: 'inventory.delete' }, id);
  }
}
