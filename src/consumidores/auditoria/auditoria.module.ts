import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoAuditoria } from '../../persistencia/entidades/evento-auditoria.entity';
import { AuditoriaConsumer } from './auditoria.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([EventoAuditoria])],
  providers: [AuditoriaConsumer],
})
export class AuditoriaModule {}