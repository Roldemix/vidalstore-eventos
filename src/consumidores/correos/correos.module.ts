import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from '../../persistencia/entidades/notificacion.entity';
import { CorreosConsumer } from './correos.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion])],
  providers: [CorreosConsumer],
})
export class CorreosModule {}