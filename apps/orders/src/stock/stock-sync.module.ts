import { Module } from '@nestjs/common';
import { RpcClientsModule } from '../clients/clients.module.js';
import { StockSyncService } from './stock-sync.service.js';

@Module({
  imports: [RpcClientsModule],
  providers: [StockSyncService],
  exports: [StockSyncService],
})
export class StockSyncModule {}
