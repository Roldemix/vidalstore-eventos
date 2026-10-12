import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitModule } from './rabbit/rabbit.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RabbitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}