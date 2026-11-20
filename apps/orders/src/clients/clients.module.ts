import { Global, Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

function tcpClient(port: number) {
  return ClientProxyFactory.create({
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port },
  });
}

/**
 * Outbound TCP clients used by the cart/checkout orchestration. Global so any
 * feature folder can inject them without re-registering the transports.
 */
@Global()
@Module({
  providers: [
    { provide: 'INVENTORY_SERVICE', useFactory: () => tcpClient(3004) },
    { provide: 'PROMOCODES_SERVICE', useFactory: () => tcpClient(3005) },
    { provide: 'PRODUCTS_SERVICE', useFactory: () => tcpClient(3003) },
  ],
  exports: ['INVENTORY_SERVICE', 'PROMOCODES_SERVICE', 'PRODUCTS_SERVICE'],
})
export class RpcClientsModule {}
