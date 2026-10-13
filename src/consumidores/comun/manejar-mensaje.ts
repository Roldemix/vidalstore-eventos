import type { Channel, ConsumeMessage } from 'amqplib';
import type { Logger } from '@nestjs/common';
import { ESPERA_REINTENTO_MS, REINTENTOS_MAX } from '../../mensajeria/politica-consumo';
import { MensajeMalFormadoError } from './mensaje';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function manejarMensaje(
  ch: Channel,
  msg: ConsumeMessage,
  trabajo: () => Promise<void>,
  logger: Logger,
): Promise<void> {
  for (let intento = 1; intento <= REINTENTOS_MAX; intento++) {
    try {
      await trabajo();
      ch.ack(msg); // 1) el trabajo quedó hecho: recién ahí se confirma
      return;
    } catch (err) {
      if (err instanceof MensajeMalFormadoError) {
        // 2) mal formado: reintentar no lo arregla. Directo a la DLQ, sin requeue.
        logger.warn(`mensaje mal formado, va a la DLQ sin reintento: ${err.message}`);
        ch.nack(msg, false, false);
        return;
      }
      // 3) cualquier otro error se trata como transitorio: reintento acotado.
      const motivo = err instanceof Error ? err.message : String(err);
      logger.warn(`fallo transitorio (intento ${intento}/${REINTENTOS_MAX}): ${motivo}`);
      if (intento < REINTENTOS_MAX) await esperar(ESPERA_REINTENTO_MS);
    }
  }
  logger.error('reintentos agotados, va a la DLQ');
  ch.nack(msg, false, false);
}