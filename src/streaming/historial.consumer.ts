import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Consumer,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
} from '@platformatic/kafka';
import { leerEventoKafka } from './evento';
import { ProcesadoresStreamingService } from './procesadores.service';
import { TOPICS } from './topicos';

@Injectable()
export class HistorialConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HistorialConsumer.name);
  private readonly consumer: Consumer<string, string, string, string>;
  private flujo?: Awaited<ReturnType<Consumer<string, string, string, string>['consume']>>;

  constructor(private readonly procesadores: ProcesadoresStreamingService) {
    this.consumer = new Consumer({
      groupId: 'vidalstore-historial',
      clientId: 'vidalstore-historial',
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
        await this.procesadores.historial(await leerEventoKafka(mensaje));
      } catch (error) {
        this.logger.warn(`historial no pudo procesar ${mensaje.topic}/${mensaje.offset}: ${error}`);
      } finally {
        await mensaje.commit();
      }
    }
  }
}
