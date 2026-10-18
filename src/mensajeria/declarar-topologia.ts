import type { Channel } from 'amqplib';
import { BINDINGS, COLAS, EXCHANGES } from './topologia';

export async function declararTopologia(ch: Channel): Promise<void> {
  for (const x of Object.values(EXCHANGES)) {
    await ch.assertExchange(x.nombre, x.tipo, { durable: true });
  }

  // 1) Las DLQ primero, atadas al DLX con su routing key estable.
  for (const c of Object.values(COLAS)) {
    await ch.assertQueue(c.dlq, { durable: true, arguments: { 'x-queue-type': 'quorum' } });
    await ch.bindQueue(c.dlq, EXCHANGES.dlx.nombre, c.routingKeyDlq);
  }

  // 2) Las colas de trabajo, apuntando al DLX con la misma routing key de su DLQ.
  for (const c of Object.values(COLAS)) {
    await ch.assertQueue(c.trabajo, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
        'x-dead-letter-exchange': EXCHANGES.dlx.nombre,
        'x-dead-letter-routing-key': c.routingKeyDlq,
      },
    });
  }

  for (const b of BINDINGS) {
    await ch.bindQueue(b.cola, b.exchange, b.routingKey);
  }
}