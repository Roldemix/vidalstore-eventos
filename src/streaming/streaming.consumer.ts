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

type Flujo = Awaited<ReturnType<Consumer<string, string, string, string>['consume']>>;

@Injectable()
export class StreamingConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamingConsumer.name);
  private readonly consumer: Consumer<string, string, string, string>;
  private flujo?: Flujo;

  constructor(
    private readonly procesadores: ProcesadoresStreamingService,
    private readonly manejador: ManejadorStreamingService,
  ) {
    this.consumer = new Consumer({
      groupId: GRUPOS.panel,
      clientId: GRUPOS.panel,
      bootstrapBrokers: this.brokers(),
      deserializers: stringDeserializers,
    });
  }

  async onModuleInit(): Promise<void> {
    this.flujo = await this.consumer.consume({
      topics: [TOPICS.compras, TOPICS.actividad],
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
          (evento) => this.procesadores.panel(evento),
          { grupo: GRUPOS.panel, logger: this.logger },
        );
      } catch (error) {
        // Si ni siquiera se pudo publicar en el .dlt, el offset no se confirma:
        // Kafka lo volvera a entregar. El consumidor sigue vivo.
        this.logger.error(this.error(mensaje, error));
      } finally {
        await this.commit(mensaje);
      }
    }
  }

  private async commit(mensaje: Message<string, string, string, string>): Promise<void> {
    try {
      await mensaje.commit();
    } catch (error) {
      this.logger.error(`panel no pudo confirmar ${mensaje.topic}/${mensaje.offset}: ${error}`);
    }
  }

  private brokers(): string[] {
    return (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);
  }

  private error(mensaje: Message<string, string, string, string>, error: unknown): string {
    return `panel no pudo procesar ${mensaje.topic}/${mensaje.offset}: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}
