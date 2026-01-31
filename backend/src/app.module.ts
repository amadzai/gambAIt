import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './service-modules/prisma/prisma.module';
import { BigIntSerializerInterceptor } from './interceptors/big-int-serializer.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
