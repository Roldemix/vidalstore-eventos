const amqp = require('amqplib');
const { randomUUID } = require('crypto');

async function main() {
  const conn = await amqp.connect('amqp://vidal:vidal_dev@localhost:5672');
  const ch = await conn.createChannel();

  const evento = {
    evento_id: randomUUID(),
    tipo: 'compra.realizada',
    ocurrido_en: new Date().toISOString(),
    sub: 'sub-de-prueba-123', // en producción sale SIEMPRE del token
    payload: { juego_id: 'juego-001', licencia_id: randomUUID() },
  };

  ch.publish(
    'vidalstore.eventos',
    'compra.realizada',
    Buffer.from(JSON.stringify(evento)),
    { persistent: true, contentType: 'application/json', messageId: evento.evento_id },
  );

  console.log('Publicado:', evento.evento_id);
  await ch.close();
  await conn.close();
}

main().catch((e) => { console.error(e); process.exit(1); });