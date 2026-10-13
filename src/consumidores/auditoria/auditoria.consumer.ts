import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ConsumeMessage } from 'amqplib';
import { QueryFailedError, Repository } from 'typeorm';
import { COLAS } from '../../mensajeria/topologia';
import { PREFETCH } from '../../mensajeria/politica-consumo';
import { EventoAuditoria } from '../../persistencia/entidades/evento-auditoria.entity';
import { RabbitService } from '../../rabbit/rabbit.service';
import { manejarMensaje } from '../comun/manejar-mensaje';
import { leerEvento } from '../comun/mensaje';

// El UNIQUE(evento_id) es lo que hace idempotente a este consumidor.
function esEventoDuplicado(err: unknown): boolean {
  if (!(err instanceof QueryFailedError)) return false;
  const e = err.driverError as { code?: string; constraint?: string };
  return e.code === '23505' && e.constraint === 'uq_auditoria_evento_id';
}

@Injectable()
export class AuditoriaConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuditoriaConsumer.name);

  constructor(
    private readonly rabbit: RabbitService,
    @InjectRepository(EventoAuditoria) private readonly repo: Repository<EventoAuditoria>,
  ) {}

  async onApplicationBootstrap() {
    const ch = this.rabbit.getChannel();
    await ch.prefetch(PREFETCH);
    await ch.consume(
      COLAS.auditoria.trabajo,
      (msg) => {
        if (!msg) return;
        manejarMensaje(ch, msg, () => this.procesar(msg), this.logger).catch((e) =>
          this.logger.error(`no se pudo confirmar el mensaje: ${e.message}`),
        );
      },
      { noAck: false },
    );
    this.logger.log(`escuchando ${COLAS.auditoria.trabajo}`);
  }

  private async procesar(msg: ConsumeMessage): Promise<void> {
    const evento = leerEvento(msg);
    try {
      await this.repo.insert({
        routingKey: evento.routingKey,
        eventoId: evento.eventoId,
        usuarioSub: typeof evento.datos.usuarioSub === 'string' ? evento.datos.usuarioSub : null,
        payload: evento.datos as Record<string, any>,
        emitidoEn: evento.emitidoEn,
      });
      this.logger.log(`auditado ${evento.routingKey} (${evento.eventoId})`);
    } catch (err) {
      if (esEventoDuplicado(err)) {
        // Reentrega: el evento ya estaba guardado. Se confirma sin duplicar la fila.
        this.logger.warn(`evento ${evento.eventoId} ya estaba auditado; se confirma sin duplicar`);
        return;
      }
      throw err; // cualquier otro error entra al reintento acotado
    }
  }
}