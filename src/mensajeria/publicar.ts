import { randomUUID } from 'crypto';
import type { ConfirmChannel } from 'amqplib';

export function publicarConfirmado(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  cuerpo: object,
): Promise<string> {
  const eventoId = randomUUID();
  return new Promise((resolve, reject) => {
    ch.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(cuerpo)),
      {
        persistent: true,
        contentType: 'application/json',
        headers: { 'x-evento-id': eventoId, 'x-emitido-en': new Date().toISOString() },
      },
      (err) => (err ? reject(err) : resolve(eventoId)),
    );
  });
}