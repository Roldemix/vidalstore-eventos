// Publica a propósito un mensaje malo para demostrar el recorrido completo:
// entra, falla, nack sin requeue, cae a la DLQ, queda en el log y en mensajes_muertos.
//
// Uso:  node --env-file=.env scripts/envenenado.mjs [correos | json-roto | compra]
//   correos    (por defecto) correo.enviar sin el campo "para"  -> solo la cola de correos
//   json-roto  correo.enviar con un cuerpo que no es JSON       -> solo la cola de correos
//   compra     compra.realizada sin usuarioSub                  -> avisos Y auditoría (2 mensajes muertos)
import { randomUUID } from 'node:crypto';
import amqp from 'amqplib';

const EVENTOS = 'vidalstore.eventos';
const COMANDOS = 'vidalstore.comandos';

const CASOS = {
  correos: {
    exchange: COMANDOS,
    routingKey: 'correo.enviar',
    cuerpo: JSON.stringify({ asunto: 'Falta el destinatario', cuerpo: 'x', origen: 'envenenado', eventoId: randomUUID() }),
    explicacion: 'JSON válido al que le falta "para", campo obligatorio de correo.enviar',
  },
  'json-roto': {
    exchange: COMANDOS,
    routingKey: 'correo.enviar',
    cuerpo: 'esto no es json {',
    explicacion: 'el cuerpo no es JSON',
  },
  compra: {
    exchange: EVENTOS,
    routingKey: 'compra.realizada',
    cuerpo: JSON.stringify({ licenciaId: randomUUID(), juegoId: '1', adquiridaEn: new Date().toISOString() }),
    explicacion: 'compra.realizada sin usuarioSub (llega a avisos y a auditoría)',
  },
};

const modo = process.argv[2] ?? 'correos';
const caso = CASOS[modo];
if (!caso) {
  console.error(`Modo desconocido "${modo}". Opciones: ${Object.keys(CASOS).join(', ')}`);
  process.exit(1);
}
const url = process.env.RABBITMQ_URL;
if (!url) {
  console.error('Falta RABBITMQ_URL en el .env de vidalstore-eventos');
  process.exit(1);
}

const eventoId = randomUUID();
const conexion = await amqp.connect(url);
try {
  const canal = await conexion.createConfirmChannel();
  await new Promise((resolver, rechazar) => {
    canal.publish(
      caso.exchange,
      caso.routingKey,
      Buffer.from(caso.cuerpo),
      {
        persistent: true,
        contentType: 'application/json',
        headers: { 'x-evento-id': eventoId, 'x-emitido-en': new Date().toISOString() },
      },
      (err) => (err ? rechazar(err) : resolver()),
    );
  });
  console.log(`Publicado (${modo}): ${caso.explicacion}`);
  console.log(`  exchange=${caso.exchange} routingKey=${caso.routingKey} x-evento-id=${eventoId}`);
  await canal.close();
} catch (err) {
  console.error('No se pudo publicar:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await conexion.close();
}