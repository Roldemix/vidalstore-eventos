import { Module } from '@nestjs/common';
import { StreamingConsumer } from './streaming.consumer';
import { AlertasConsumer } from './alertas.consumer';
import { HistorialConsumer } from './historial.consumer';
import { ProcesadoresStreamingService } from './procesadores.service';
import { KpiMinuto } from '../persistencia/entidades/kpi-minuto.entity';
import { Alerta } from '../persistencia/entidades/alerta.entity';
import { VentaSemana } from '../persistencia/entidades/venta-semana.entity';
import { EventoProcesado } from '../persistencia/entidades/evento-procesado.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoEstado } from '../persistencia/entidades/catalogo-estado.entity';
import { CatalogoConsumer } from './catalogo.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([KpiMinuto, Alerta, VentaSemana, EventoProcesado, CatalogoEstado])],
  providers: [
    StreamingConsumer,
    AlertasConsumer,
    HistorialConsumer,
    CatalogoConsumer,
    ProcesadoresStreamingService,
  ],
})
export class StreamingModule {}
