import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [DatabaseModule, 
    ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService, UsersModule],
})
export class AppModule {}
