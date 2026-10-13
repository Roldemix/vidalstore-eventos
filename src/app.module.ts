import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitModule } from './rabbit/rabbit.module';
import { PersistenciaModule } from './persistencia/persistencia.module';
import { AvisosModule } from './consumidores/avisos/avisos.module';
import { AuditoriaModule } from './consumidores/auditoria/auditoria.module';
import { CorreosModule } from './consumidores/correos/correos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitModule,
    PersistenciaModule,
    AvisosModule,
    AuditoriaModule,
    CorreosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}