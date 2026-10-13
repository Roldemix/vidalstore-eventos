const amqp = require('amqplib');
const { randomUUID } = require('crypto');

// Solo para pruebas: en los microservicios reales el sub sale del token.
const SUB = 'sub-de-prueba-123';
const PAYLOADS = {
  'compra.realizada': () => ({ licenciaId: randomUUID(), juegoId: 'juego-001', usuarioSub: SUB, adquiridaEn: new Date().toISOString() }),
  'licencia.revocada': () => ({ licenciaId: randomUUID(), juegoId: 'juego-001', usuarioSub: SUB, revocadaPor: 'sub-admin-de-prueba', motivo: 'prueba' }),
  'juego.publicado': () => ({ juegoId: 'juego-002', titulo: 'Juego de prueba', editorSub: SUB }),
};

async function main() {
  const key = process.argv[2] ?? 'licencia.revocada';
  const malo = process.argv.includes('--malo');
  if (!PAYLOADS[key]) throw new Error(`routing key desconocida: ${key}`);

  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange('vidalstore.eventos', 'topic', { durable: true });

  const eventoId = randomUUID();
  const cuerpo = malo ? 'esto no es json' : JSON.stringify(PAYLOADS[key]());
  ch.publish('vidalstore.eventos', key, Buffer.from(cuerpo), {
    persistent: true,
    contentType: 'application/json',
    headers: { 'x-evento-id': eventoId, 'x-emitido-en': new Date().toISOString() },
  });

  console.log('Publicado', key, eventoId, malo ? '(mal formado)' : '');
  await ch.close();
  await conn.close();
}
main().catch((e) => { console.error(e); process.exit(1); });