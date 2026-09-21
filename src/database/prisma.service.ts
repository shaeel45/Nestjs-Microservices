import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Resolve the generated client at runtime when the package type declarations
// do not expose PrismaClient.
const { PrismaClient } = require('@prisma/client');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}