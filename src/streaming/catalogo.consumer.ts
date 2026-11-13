import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Consumer,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
} from '@platformatic/kafka';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogoEstado } from '../persistencia/entidades/catalogo-estado.entity';
import { leerEventoKafka } from './evento';
import { TOPICS } from './topicos';

@Injectable()
export class CatalogoConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CatalogoConsumer.name);
  private readonly consumer = new Consumer({
    groupId: 'vidalstore.catalogo',
    clientId: 'vidalstore.catalogo',
    bootstrapBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    deserializers: stringDeserializers,
  });
  private flujo?: Awaited<ReturnType<Consumer<string, string, string, string>['consume']>>;

  constructor(
    @InjectRepository(CatalogoEstado)
    private readonly repo: Repository<CatalogoEstado>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.flujo = await this.consumer.consume({
      topics: [TOPICS.catalogo],
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
        const evento = await leerEventoKafka(mensaje);
        const datos = evento.datos;
        await this.repo.upsert(
          {
            juegoId: datos.juegoId,
            titulo: datos.titulo ?? datos.juegoId,
            precio: datos.precio ?? datos.monto ?? 0,
            eventoId: evento.id,
          },
          ['juegoId'],
        );
      } catch (error) {
        this.logger.warn(`catálogo no pudo procesar ${mensaje.topic}/${mensaje.offset}: ${error}`);
      } finally {
        await mensaje.commit();
      }
    }
  }
}
