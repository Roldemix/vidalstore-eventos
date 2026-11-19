import type { Message } from '@platformatic/kafka';
import { EventoInvalidoError, EventoStream, leerEventoKafka } from './evento';
import { conReintentos, esPostgresNoResponde, esViolacionUnica } from './reintentos';

export type ResultadoConsumo = 'procesado' | 'duplicado' | 'desviado' | 'error-desviado';

export interface LoggerLike {
  log(mensaje: string): void;
  warn(mensaje: string): void;
  error(mensaje: string): void;
}

// Lo que el flujo necesita de la tabla eventos_procesados (UNIQUE grupo, evento_id).
export interface RegistroProcesados {
  existe(grupo: string, eventoId: string): Promise<boolean>;
  marcar(grupo: string, eventoId: string): Promise<void>;
}

export interface PublicadorDlt {
  desviar(
    grupo: string,
    mensaje: Message<string, string, string, string>,
    motivo: string,
  ): Promise<void>;
}

export interface OpcionesFlujo {
  grupo: string;
  logger: LoggerLike;
  procesados: RegistroProcesados;
  dlt: PublicadorDlt;
  // vidalstore.catalogo no tiene .dlt: sus invalidos solo se registran.
  publicarEnDlt?: boolean;
  esperasMs?: number[];
}

// Un solo camino para todos los consumidores:
//   1. valida el contrato (un invalido nunca se reintenta: va al .dlt);
//   2. si el grupo ya proceso el evento, confirma sin escribir;
//   3. procesa con hasta 3 reintentos y espera creciente solo si Postgres no responde;
//   4. si aun asi no responde, lo desvia con x-motivo=postgres-noresponde.
// El offset lo confirma el consumidor despues de esta llamada, pase lo que pase:
// ningun mensaje defectuoso detiene al grupo.
export async function procesarMensajeStream(
  mensaje: Message<string, string, string, string>,
  procesar: (evento: EventoStream) => Promise<void>,
  opciones: OpcionesFlujo,
): Promise<ResultadoConsumo> {
  const { grupo, logger } = opciones;

  let evento: EventoStream;
  try {
    evento = await leerEventoKafka(mensaje);
  } catch (error) {
    if (error instanceof EventoInvalidoError) {
      logger.warn(
        `${grupo}: mensaje invalido en ${mensaje.topic}/${mensaje.offset} (${error.motivo}): ${error.detalle}`,
      );
      await desviar(mensaje, error.motivo, opciones);
      return 'desviado';
    }
    logger.error(
      `${grupo}: no se pudo leer ${mensaje.topic}/${mensaje.offset}: ${textoDe(error)}`,
    );
    await desviar(mensaje, 'dto-invalido', opciones);
    return 'desviado';
  }

  try {
    if (await opciones.procesados.existe(grupo, evento.id)) {
      logger.log(
        `${grupo}: evento ${evento.id} ya procesado por el grupo; se confirma sin escribir`,
      );
      return 'duplicado';
    }

    await conReintentos(() => procesar(evento), {
      esperasMs: opciones.esperasMs,
      alReintentar: (intento, esperaMs, error) => {
        logger.warn(
          `${grupo}: Postgres no responde al procesar ${evento.id}; reintento ${intento}/3 en ${esperaMs} ms (${textoDe(error)})`,
        );
      },
    });

    await opciones.procesados.marcar(grupo, evento.id);
    return 'procesado';
  } catch (error) {
    if (esViolacionUnica(error)) {
      logger.log(
        `${grupo}: evento ${evento.id} ya estaba escrito (UNIQUE); se confirma sin duplicar`,
      );
      return 'duplicado';
    }

    if (esPostgresNoResponde(error)) {
      logger.error(
        `${grupo}: Postgres no respondio tras 3 reintentos para ${evento.id}; se desvia a ${mensaje.topic}.dlt`,
      );
      await desviar(mensaje, 'postgres-noresponde', opciones);
      return 'error-desviado';
    }

    logger.error(
      `${grupo}: error al procesar ${evento.id}: ${textoDe(error)}; se desvia a ${mensaje.topic}.dlt`,
    );
    await desviar(mensaje, 'error-procesamiento', opciones);
    return 'error-desviado';
  }
}

async function desviar(
  mensaje: Message<string, string, string, string>,
  motivo: string,
  opciones: OpcionesFlujo,
): Promise<void> {
  if (opciones.publicarEnDlt === false) {
    opciones.logger.warn(
      `${opciones.grupo}: ${mensaje.topic}/${mensaje.offset} descartado (${motivo}); no hay topic .dlt para ${mensaje.topic}`,
    );
    return;
  }
  await opciones.dlt.desviar(opciones.grupo, mensaje, motivo);
}

function textoDe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
