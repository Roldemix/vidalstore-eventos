import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Consumer,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
} from '@platformatic/kafka';
import type { Message } from '@platformatic/kafka';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogoEstado } from '../persistencia/entidades/catalogo-estado.entity';
import { ManejadorStreamingService } from './manejador-streaming.service';
import { GRUPOS, TOPICS } from './topicos';

@Injectable()
export class CatalogoConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CatalogoConsumer.name);
  private readonly consumer = new Consumer({
    groupId: GRUPOS.catalogo,
    clientId: GRUPOS.catalogo,
    bootstrapBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    deserializers: stringDeserializers,
  });
  private flujo?: Awaited<ReturnType<Consumer<string, string, string, string>['consume']>>;

  constructor(
    @InjectRepository(CatalogoEstado)
    private readonly repo: Repository<CatalogoEstado>,
    private readonly manejador: ManejadorStreamingService,
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
        await this.manejador.procesarMensaje(
          mensaje,
          async (evento) => {
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
          },
          // No existe vidalstore.catalogo.dlt: un invalido aqui solo se registra.
          { grupo: GRUPOS.catalogo, logger: this.logger, publicarEnDlt: false },
        );
      } catch (error) {
        this.logger.error(`catálogo no pudo procesar ${mensaje.topic}/${mensaje.offset}: ${error}`);
      } finally {
        await this.commit(mensaje);
      }
    }
  }

  private async commit(mensaje: Message<string, string, string, string>): Promise<void> {
    try {
      await mensaje.commit();
    } catch (error) {
      this.logger.error(`catálogo no pudo confirmar ${mensaje.topic}/${mensaje.offset}: ${error}`);
    }
  }
}
