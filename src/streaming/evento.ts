import type { Message } from '@platformatic/kafka';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EventoKafkaDto } from './dto/evento-kafka.dto';

export interface EventoStream {
  id: string;
  tipo: string;
  version: number;
  emitidoEn: Date;
  datos: EventoKafkaDto;
  topic: string;
}

// Motivos que viajan en el header x-motivo del .dlt. Son los que pide la EP3:
// json-invalido, falta-<campo>, dto-invalido y version-desconocida.
export type MotivoInvalido =
  | 'json-invalido'
  | 'dto-invalido'
  | 'version-desconocida'
  | `falta-${string}`;

export class EventoInvalidoError extends Error {
  constructor(
    readonly motivo: MotivoInvalido,
    readonly detalle: string,
  ) {
    super(detalle);
    this.name = 'EventoInvalidoError';
  }
}

function textoNoVacio(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim().length > 0 ? valor.trim() : undefined;
}

function valorPresente(valor: unknown): boolean {
  return valor !== undefined && valor !== null && valor !== '';
}

// Campo obligatorio que no vino: se informa falta-<campo> en vez de un error generico.
function motivoDeValidacion(propiedad: string, valor: unknown): MotivoInvalido {
  return valorPresente(valor) ? 'dto-invalido' : (`falta-${propiedad}` as const);
}

// Lee un mensaje de Kafka y aplica el contrato version 1 completo.
// No escribe nada: o devuelve el evento listo para procesar, o lanza
// EventoInvalidoError con el motivo que ira al .dlt.
export async function leerEventoKafka(
  mensaje: Message<string, string, string, string>,
): Promise<EventoStream> {
  let crudo: unknown;
  try {
    crudo = JSON.parse(mensaje.value);
  } catch {
    throw new EventoInvalidoError('json-invalido', 'el value no es JSON');
  }
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
    throw new EventoInvalidoError('dto-invalido', 'el value no es un objeto JSON');
  }

  const valor = crudo as Record<string, unknown>;

  // El sobre puede venir en el value o, como en la EP2, en los headers.
  const eventoId =
    textoNoVacio(valor.eventoId) ?? textoNoVacio(mensaje.headers.get('x-evento-id'));
  if (!eventoId) {
    throw new EventoInvalidoError('falta-eventoId', 'no hay eventoId en el value ni en los headers');
  }

  const tipo = textoNoVacio(valor.tipo) ?? textoNoVacio(mensaje.headers.get('x-tipo-evento'));
  if (!tipo) {
    throw new EventoInvalidoError('falta-tipo', 'no hay tipo en el value ni en los headers');
  }

  if (!valorPresente(valor.version)) {
    throw new EventoInvalidoError('falta-version', 'el value no trae version');
  }
  if (valor.version !== 1) {
    throw new EventoInvalidoError(
      'version-desconocida',
      `version ${String(valor.version)} distinta de 1`,
    );
  }

  const emitidoEnTexto =
    textoNoVacio(valor.emitidoEn) ?? textoNoVacio(mensaje.headers.get('x-emitido-en'));
  if (!emitidoEnTexto) {
    throw new EventoInvalidoError('falta-emitidoEn', 'no hay emitidoEn en el value ni en los headers');
  }

  const dto = plainToInstance(EventoKafkaDto, {
    ...valor,
    eventoId,
    tipo,
    version: valor.version,
    emitidoEn: emitidoEnTexto,
  });
  const errores = await validate(dto, { whitelist: true });
  if (errores.length > 0) {
    const primero = errores[0];
    const propiedad = primero.property;
    const valorDelCampo = (dto as unknown as Record<string, unknown>)[propiedad];
    const detalle = Object.values(primero.constraints ?? {}).join('; ');
    throw new EventoInvalidoError(motivoDeValidacion(propiedad, valorDelCampo), detalle);
  }

  const emitidoEn = new Date(emitidoEnTexto);
  if (Number.isNaN(emitidoEn.getTime())) {
    throw new EventoInvalidoError('dto-invalido', 'emitidoEn no es una fecha valida');
  }

  return {
    id: eventoId,
    tipo,
    version: dto.version,
    emitidoEn,
    datos: dto,
    topic: mensaje.topic,
  };
}

export function numero(valor: unknown, predeterminado = 0): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : predeterminado;
}

export function texto(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
}

export function minutoDe(fecha: Date): Date {
  const resultado = new Date(fecha);
  resultado.setUTCSeconds(0, 0);
  return resultado;
}

export function semanaDe(fecha: Date): Date {
  const resultado = new Date(fecha);
  const dia = resultado.getUTCDay() || 7;
  resultado.setUTCDate(resultado.getUTCDate() - dia + 1);
  resultado.setUTCHours(0, 0, 0, 0);
  return resultado;
}
