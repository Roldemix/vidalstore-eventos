import type { Message } from '@platformatic/kafka';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EventoKafkaDto } from './dto/evento-kafka.dto';

export interface EventoStream {
  id: string;
  tipo: string;
  emitidoEn: Date;
  datos: EventoKafkaDto;
  topic: string;
}

export async function leerEventoKafka(
  mensaje: Message<string, string, string, string>,
): Promise<EventoStream> {
  const eventoId = mensaje.headers.get('x-evento-id');
  const tipo = mensaje.headers.get('x-tipo-evento');
  const emitido = mensaje.headers.get('x-emitido-en');
  if (!eventoId || !tipo || !emitido) {
    throw new Error('faltan headers x-evento-id, x-tipo-evento o x-emitido-en');
  }

  let datos: unknown;
  try {
    datos = JSON.parse(mensaje.value);
  } catch {
    throw new Error('el valor Kafka no es JSON');
  }

  const dto = plainToInstance(EventoKafkaDto, datos);
  const errores = await validate(dto);
  if (errores.length > 0) {
    throw new Error(
      errores.flatMap((error) => Object.values(error.constraints ?? {})).join('; '),
    );
  }

  const emitidoEn = new Date(emitido);
  if (Number.isNaN(emitidoEn.getTime())) {
    throw new Error('x-emitido-en no es una fecha ISO válida');
  }

  return { id: eventoId, tipo, emitidoEn, datos: dto, topic: mensaje.topic };
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
