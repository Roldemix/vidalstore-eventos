import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeMuerto } from '../../persistencia/entidades/mensaje-muerto.entity';
import { MensajesMuertosConsumer } from './mensajes-muertos.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([MensajeMuerto])],
  providers: [MensajesMuertosConsumer],
})
export class MensajesMuertosModule {}