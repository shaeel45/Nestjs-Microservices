import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersController } from './users/users.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { JwtAuthGuard } from './auth/guards/jwt-guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3001,
        },
      },
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3002,
        },
      },
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'default_secret',
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [UsersController, AuthController],
  providers: [JwtAuthGuard, RolesGuard],
})
export class ApiGatewayModule {}
