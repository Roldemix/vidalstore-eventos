import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';
import { RabbitService } from '../../rabbit/rabbit.service';
import { COLAS, EXCHANGES, ROUTING_KEYS } from '../../mensajeria/topologia';
import { PREFETCH } from '../../mensajeria/politica-consumo';
import { publicarConfirmado } from '../../mensajeria/publicar';
import { manejarMensaje } from '../comun/manejar-mensaje';
import { EventoLeido, leerEvento } from '../comun/mensaje';

@Injectable()
export class AvisosConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(AvisosConsumer.name);

  constructor(private readonly rabbit: RabbitService) {}

  async onApplicationBootstrap() {
    const ch = this.rabbit.getChannel();
    await ch.prefetch(PREFETCH);
    await ch.consume(
      COLAS.avisos.trabajo,
      (msg) => {
        if (!msg) return;
        manejarMensaje(ch, msg, () => this.procesar(msg), this.logger).catch((e) =>
          this.logger.error(`no se pudo confirmar el mensaje: ${e.message}`),
        );
      },
      { noAck: false },
    );
    this.logger.log(`escuchando ${COLAS.avisos.trabajo}`);
  }

  private async procesar(msg: ConsumeMessage): Promise<void> {
    const evento = leerEvento(msg);
    const aviso = this.armarAviso(evento);
    if (!aviso) {
      this.logger.log(`${evento.routingKey} no requiere aviso`);
      return;
    }
    // Se publica y se espera la confirmacion del broker ANTES del ack.
    await publicarConfirmado(
      this.rabbit.getConfirmChannel(),
      EXCHANGES.comandos.nombre,
      ROUTING_KEYS.correoEnviar,
      { ...aviso, origen: evento.routingKey, eventoId: evento.eventoId },
    );
    this.logger.log(`correo.enviar publicado para ${evento.routingKey} (${evento.eventoId})`);
  }

  private armarAviso(e: EventoLeido) {
    const para = e.datos.usuarioSub as string;
    switch (e.routingKey) {
      case ROUTING_KEYS.licenciaRevocada:
        return {
          para,
          asunto: 'Tu licencia fue revocada',
          cuerpo: `Se revocó tu licencia del juego ${e.datos.juegoId}. Motivo: ${e.datos.motivo}.`,
        };
      case ROUTING_KEYS.compraRealizada:
        return {
          para,
          asunto: 'Compra confirmada',
          cuerpo: `Ya tienes tu licencia del juego ${e.datos.juegoId}.`,
        };
      default:
        return null;
    }
  }
}