import type { Channel } from 'amqplib';
import { BINDINGS, COLAS, EXCHANGES } from './topologia';

export async function declararTopologia(ch: Channel): Promise<void> {
  for (const x of Object.values(EXCHANGES)) {
    await ch.assertExchange(x.nombre, x.tipo, { durable: true });
  }

  // 1) Las DLQ primero, atadas al DLX con el nombre de su cola de trabajo.
  for (const c of Object.values(COLAS)) {
    await ch.assertQueue(c.dlq, { durable: true, arguments: { 'x-queue-type': 'quorum' } });
    await ch.bindQueue(c.dlq, EXCHANGES.dlx.nombre, c.trabajo);
  }

  // 2) Las colas de trabajo, apuntando al DLX con su propio nombre como routing key.
  for (const c of Object.values(COLAS)) {
    await ch.assertQueue(c.trabajo, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
        'x-dead-letter-exchange': EXCHANGES.dlx.nombre,
        'x-dead-letter-routing-key': c.trabajo,
      },
    });
  }

  for (const b of BINDINGS) {
    await ch.bindQueue(b.cola, b.exchange, b.routingKey);
  }
}