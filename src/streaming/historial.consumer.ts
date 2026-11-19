import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Consumer,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
} from '@platformatic/kafka';
import type { Message } from '@platformatic/kafka';
import { ManejadorStreamingService } from './manejador-streaming.service';
import { ProcesadoresStreamingService } from './procesadores.service';
import { GRUPOS, TOPICS } from './topicos';

@Injectable()
export class HistorialConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HistorialConsumer.name);
  private readonly consumer: Consumer<string, string, string, string>;
  private flujo?: Awaited<ReturnType<Consumer<string, string, string, string>['consume']>>;

  constructor(
    private readonly procesadores: ProcesadoresStreamingService,
    private readonly manejador: ManejadorStreamingService,
  ) {
    this.consumer = new Consumer({
      groupId: GRUPOS.historial,
      clientId: GRUPOS.historial,
      bootstrapBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
      deserializers: stringDeserializers,
    });
  }

  async onModuleInit(): Promise<void> {
    this.flujo = await this.consumer.consume({
      topics: [TOPICS.compras],
      autocommit: false,
      mode: MessagesStreamModes.COMMITTED,
      fallbackMode: MessagesStreamFallbackModes.EARLIEST,
    });
    void this.leer();
  }

  async onModuleDestroy(): Promise<void> {
    await this.flujo?.close();
    await this.consumer.close();
  }

  private async leer(): Promise<void> {
    if (!this.flujo) return;
    for await (const mensaje of this.flujo) {
      try {
        await this.manejador.procesarMensaje(
          mensaje,
          (evento) => this.procesadores.historial(evento),
          { grupo: GRUPOS.historial, logger: this.logger },
        );
      } catch (error) {
        this.logger.error(`historial no pudo procesar ${mensaje.topic}/${mensaje.offset}: ${error}`);
      } finally {
        await this.commit(mensaje);
      }
    }
  }

  private async commit(mensaje: Message<string, string, string, string>): Promise<void> {
    try {
      await mensaje.commit();
    } catch (error) {
      this.logger.error(`historial no pudo confirmar ${mensaje.topic}/${mensaje.offset}: ${error}`);
    }
  }
}
