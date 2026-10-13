import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitModule } from './rabbit/rabbit.module';
import { PersistenciaModule } from './persistencia/persistencia.module';
import { AvisosModule } from './consumidores/avisos/avisos.module';
import { AuditoriaModule } from './consumidores/auditoria/auditoria.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitModule,
    PersistenciaModule,
    AvisosModule,
    AuditoriaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}