import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Consumer,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
} from '@platformatic/kafka';
import type { Message } from '@platformatic/kafka';
import { ProcesadoresStreamingService } from './procesadores.service';
import { leerEventoKafka } from './evento';
import { TOPICS } from './topicos';

type Flujo = Awaited<ReturnType<Consumer<string, string, string, string>['consume']>>;

@Injectable()
export class StreamingConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamingConsumer.name);
  private readonly consumer: Consumer<string, string, string, string>;
  private flujo?: Flujo;

  constructor(private readonly procesadores: ProcesadoresStreamingService) {
    this.consumer = new Consumer({
      groupId: 'vidalstore-panel',
      clientId: 'vidalstore-panel',
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
        await this.procesadores.panel(await leerEventoKafka(mensaje));
      } catch (error) {
        this.logger.warn(this.error(mensaje, error));
      } finally {
        await mensaje.commit();
      }
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
