import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Channel, ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { COLAS } from '../../mensajeria/topologia';
import { ESPERA_DLQ_MS, PREFETCH } from '../../mensajeria/politica-consumo';
import { MensajeMuerto } from '../../persistencia/entidades/mensaje-muerto.entity';
import { RabbitService } from '../../rabbit/rabbit.service';
import { leerMuerte } from './leer-muerte';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class MensajesMuertosConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(MensajesMuertosConsumer.name);

  constructor(
    private readonly rabbit: RabbitService,
    @InjectRepository(MensajeMuerto) private readonly repo: Repository<MensajeMuerto>,
  ) {}

  async onApplicationBootstrap() {
    const ch = this.rabbit.getChannel();
    await ch.prefetch(PREFETCH);
    for (const c of Object.values(COLAS)) {
      await ch.consume(
        c.dlq,
        (msg) => {
          if (!msg) return;
          this.procesar(ch, msg).catch((e) =>
            this.logger.error(`no se pudo confirmar el mensaje muerto: ${e.message}`),
          );
        },
        { noAck: false },
      );
      this.logger.log(`escuchando ${c.dlq}`);
    }
  }

  private async procesar(ch: Channel, msg: ConsumeMessage): Promise<void> {
    const muerte = leerMuerte(msg);
    this.logger.warn(
      `MENSAJE MUERTO cola=${muerte.colaOrigen} routingKey=${muerte.routingKey} ` +
        `motivo=${muerte.motivo} intentos=${muerte.intentos}`,
    );
    try {
      await this.repo.insert({
        colaOrigen: muerte.colaOrigen,
        routingKey: muerte.routingKey,
        motivo: muerte.motivo,
        intentos: muerte.intentos,
        payload: msg.content.toString('utf8'), // texto, no JSON: pudo morir por no ser JSON válido
      });
      ch.ack(msg);
    } catch (err) {
      const motivo = err instanceof Error ? err.message : String(err);
      this.logger.error(`no se pudo registrar el mensaje muerto (${motivo}); vuelve a su DLQ`);
      await esperar(ESPERA_DLQ_MS);
      // En una DLQ NO se usa nack sin reencolar: descartaría la última copia.
      ch.nack(msg, false, true);
    }
  }
}