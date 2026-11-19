import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Message } from '@platformatic/kafka';
import { Repository } from 'typeorm';
import { EventoProcesado } from '../persistencia/entidades/evento-procesado.entity';
import { DltPublisher } from './dlt.publisher';
import { EventoStream } from './evento';
import { procesarMensajeStream, ResultadoConsumo } from './procesar-mensaje';
import { esViolacionUnica } from './reintentos';

export interface OpcionesProcesamiento {
  grupo: string;
  logger: Logger;
  // vidalstore.catalogo no tiene .dlt: sus invalidos solo se registran.
  publicarEnDlt?: boolean;
}

@Injectable()
export class ManejadorStreamingService {
  constructor(
    @InjectRepository(EventoProcesado)
    private readonly procesados: Repository<EventoProcesado>,
    private readonly dlt: DltPublisher,
  ) {}

  procesarMensaje(
    mensaje: Message<string, string, string, string>,
    procesar: (evento: EventoStream) => Promise<void>,
    opciones: OpcionesProcesamiento,
  ): Promise<ResultadoConsumo> {
    return procesarMensajeStream(mensaje, procesar, {
      grupo: opciones.grupo,
      logger: opciones.logger,
      publicarEnDlt: opciones.publicarEnDlt,
      dlt: this.dlt,
      esperasMs: this.esperasMs(),
      procesados: {
        existe: async (grupo, eventoId) => {
          const filas = await this.procesados.count({ where: { grupo, eventoId } });
          return filas > 0;
        },
        marcar: async (grupo, eventoId) => {
          try {
            await this.procesados.insert({ grupo, eventoId });
          } catch (error) {
            // Otra instancia del mismo grupo lo marco entre el count y el insert.
            if (!esViolacionUnica(error)) throw error;
          }
        },
      },
    });
  }

  // Permite acelerar las pruebas sin cambiar el comportamiento por defecto (1, 2 y 4 s).
  private esperasMs(): number[] {
    return (process.env.STREAMING_REINTENTOS_ESPERA_MS ?? '1000,2000,4000')
      .split(',')
      .map((valor) => Number(valor.trim()))
      .filter((valor) => Number.isFinite(valor) && valor >= 0);
  }
}
