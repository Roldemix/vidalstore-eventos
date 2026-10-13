import type { ConsumeMessage } from 'amqplib';
import { ROUTING_KEYS } from '../../mensajeria/topologia';

export class MensajeMalFormadoError extends Error {}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CAMPOS_OBLIGATORIOS: Record<string, readonly string[]> = {
  [ROUTING_KEYS.compraRealizada]: ['licenciaId', 'juegoId', 'usuarioSub', 'adquiridaEn'],
  [ROUTING_KEYS.licenciaRevocada]: ['licenciaId', 'juegoId', 'usuarioSub', 'revocadaPor', 'motivo'],
  [ROUTING_KEYS.juegoPublicado]: ['juegoId', 'titulo', 'editorSub'],
  [ROUTING_KEYS.correoEnviar]: ['para', 'asunto', 'cuerpo', 'origen', 'eventoId'],
};

export interface EventoLeido {
  routingKey: string;
  eventoId: string;
  datos: Record<string, unknown>;
}

export function leerEvento(msg: ConsumeMessage): EventoLeido {
  let datos: unknown;
  try {
    datos = JSON.parse(msg.content.toString('utf8'));
  } catch {
    throw new MensajeMalFormadoError('el cuerpo no es JSON');
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    throw new MensajeMalFormadoError('el cuerpo no es un objeto JSON');
  }
  const obj = datos as Record<string, unknown>;

  const routingKey = msg.fields.routingKey;
  for (const campo of CAMPOS_OBLIGATORIOS[routingKey] ?? []) {
    const v = obj[campo];
    if (typeof v !== 'string' || v.trim() === '') {
      throw new MensajeMalFormadoError(`falta el campo obligatorio "${campo}" en ${routingKey}`);
    }
  }

  const eventoId = msg.properties.headers?.['x-evento-id'];
  if (typeof eventoId !== 'string' || !UUID_RE.test(eventoId)) {
    throw new MensajeMalFormadoError('x-evento-id falta o no es un UUID');
  }

  return { routingKey, eventoId, datos: obj };
}