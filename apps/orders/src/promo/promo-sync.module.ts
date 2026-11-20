import { Module } from '@nestjs/common';
import { RpcClientsModule } from '../clients/clients.module.js';
import { PromoSyncService } from './promo-sync.service.js';

@Module({
  imports: [RpcClientsModule],
  providers: [PromoSyncService],
  exports: [PromoSyncService],
})
export class PromoSyncModule {}
