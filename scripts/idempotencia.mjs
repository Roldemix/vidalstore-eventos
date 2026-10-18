// Publica dos veces el MISMO evento (mismo x-evento-id) para demostrar que
// UNIQUE(evento_id) en eventos_auditoria evita duplicar la fila.
// Uso: node --env-file=.env scripts/idempotencia.mjs
import { randomUUID } from 'node:crypto';
import amqp from 'amqplib';

const url = process.env.RABBITMQ_URL;
if (!url) { console.error('Falta RABBITMQ_URL'); process.exit(1); }

const eventoId = randomUUID();
const licenciaId = randomUUID();
const cuerpo = JSON.stringify({
  licenciaId, juegoId: '2', usuarioSub: 'sub-prueba-idempotencia',
  adquiridaEn: new Date().toISOString(),
});

const conexion = await amqp.connect(url);
try {
  const canal = await conexion.createConfirmChannel();
  for (let i = 1; i <= 2; i++) {
    await new Promise((ok, fallo) => canal.publish(
      'vidalstore.eventos', 'compra.realizada', Buffer.from(cuerpo),
      { persistent: true, contentType: 'application/json',
        headers: { 'x-evento-id': eventoId, 'x-emitido-en': new Date().toISOString() } },
      (err) => (err ? fallo(err) : ok()),
    ));
    console.log(`Publicado #${i} con x-evento-id=${eventoId}`);
  }
  await canal.close();
} finally {
  await conexion.close();
}
console.log(`\nCuenta filas con: select count(*) from eventos.eventos_auditoria where evento_id = '${eventoId}';`);
