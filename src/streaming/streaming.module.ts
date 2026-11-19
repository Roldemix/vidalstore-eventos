import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamingConsumer } from './streaming.consumer';
import { AlertasConsumer } from './alertas.consumer';
import { HistorialConsumer } from './historial.consumer';
import { ProcesadoresStreamingService } from './procesadores.service';
import { KpiMinuto } from '../persistencia/entidades/kpi-minuto.entity';
import { Alerta } from '../persistencia/entidades/alerta.entity';
import { VentaSemana } from '../persistencia/entidades/venta-semana.entity';
import { EventoProcesado } from '../persistencia/entidades/evento-procesado.entity';
import { CatalogoEstado } from '../persistencia/entidades/catalogo-estado.entity';
import { CatalogoConsumer } from './catalogo.consumer';
import { DltPublisher } from './dlt.publisher';
import { ManejadorStreamingService } from './manejador-streaming.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KpiMinuto, Alerta, VentaSemana, EventoProcesado, CatalogoEstado]),
  ],
  providers: [
    StreamingConsumer,
    AlertasConsumer,
    HistorialConsumer,
    CatalogoConsumer,
    ProcesadoresStreamingService,
    DltPublisher,
    ManejadorStreamingService,
  ],
})
export class StreamingModule {}
