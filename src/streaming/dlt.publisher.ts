import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ProduceAcks, Producer, stringSerializers } from '@platformatic/kafka';
import type { Message } from '@platformatic/kafka';

// Publica en <topic>.dlt el value original, con la misma key y los mismos
// headers, agregando x-motivo (por que se desvio) y x-grupo (quien lo desvio).
@Injectable()
export class DltPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(DltPublisher.name);
  private readonly producer: Producer<string, string, string, string>;

  constructor() {
    this.producer = new Producer({
      clientId: 'vidalstore-dlt',
      bootstrapBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
        .split(',')
        .map((broker) => broker.trim())
        .filter(Boolean),
      serializers: stringSerializers,
      idempotent: true,
      acks: ProduceAcks.ALL,
      retries: 10,
      autocreateTopics: false,
    });
  }

  async desviar(
    grupo: string,
    mensaje: Message<string, string, string, string>,
    motivo: string,
  ): Promise<void> {
    const headers = new Map(mensaje.headerEntries);
    headers.set('x-motivo', motivo);
    headers.set('x-grupo', grupo);

    await this.producer.send({
      messages: [
        {
          topic: `${mensaje.topic}.dlt`,
          key: mensaje.key,
          value: mensaje.value,
          // La hora original se conserva; el timestamp de Kafka lo pone el broker.
          headers,
        },
      ],
      acks: ProduceAcks.ALL,
      idempotent: true,
    });

    this.logger.warn(
      `desviado a ${mensaje.topic}.dlt offset=${mensaje.offset} grupo=${grupo} motivo=${motivo}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.close();
  }
}
