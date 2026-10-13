import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { COLAS } from '../../mensajeria/topologia';
import { PREFETCH } from '../../mensajeria/politica-consumo';
import { Notificacion } from '../../persistencia/entidades/notificacion.entity';
import { RabbitService } from '../../rabbit/rabbit.service';
import { manejarMensaje } from '../comun/manejar-mensaje';
import { leerEvento, MensajeMalFormadoError, UUID_RE } from '../comun/mensaje';

@Injectable()
export class CorreosConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(CorreosConsumer.name);

  constructor(
    private readonly rabbit: RabbitService,
    @InjectRepository(Notificacion) private readonly repo: Repository<Notificacion>,
  ) {}

  async onApplicationBootstrap() {
    const ch = this.rabbit.getChannel();
    await ch.prefetch(PREFETCH);
    await ch.consume(
      COLAS.correos.trabajo,
      (msg) => {
        if (!msg) return;
        manejarMensaje(ch, msg, () => this.procesar(msg), this.logger).catch((e) =>
          this.logger.error(`no se pudo confirmar el mensaje: ${e.message}`),
        );
      },
      { noAck: false },
    );
    this.logger.log(`escuchando ${COLAS.correos.trabajo}`);
  }

  private async procesar(msg: ConsumeMessage): Promise<void> {
    const comando = leerEvento(msg);
    const d = comando.datos as Record<string, string>;

    // eventoId del payload es el del evento que originó el aviso: une la
    // Notificacion con su fila de auditoria. Si no es un UUID, el mensaje esta roto.
    if (!UUID_RE.test(d.eventoId)) {
      throw new MensajeMalFormadoError('eventoId del comando no es un UUID');
    }

    // El envio se simula: basta un log claro.
    this.logger.log(`ENVIANDO correo a ${d.para}: "${d.asunto}" (origen ${d.origen}, evento ${d.eventoId})`);

    await this.repo.insert({
      para: d.para,
      asunto: d.asunto,
      estado: 'enviada',
      eventoId: d.eventoId,
    });
  }
}