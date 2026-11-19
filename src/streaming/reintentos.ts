import { QueryFailedError } from 'typeorm';

// Códigos que indican que PostgreSQL (o la red hacia el) no responde ahora,
// pero puede responder despues. Son los unicos que se reintentan.
const CODIGOS_POSTGRES = new Set([
  '08000', // connection_exception
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  '53300', // too_many_connections
]);

const CODIGOS_RED = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ECONNABORTED',
  'EPIPE',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

const MENSAJES_POSTGRES = [
  'connection terminated',
  'connection terminated unexpectedly',
  'connection error',
  'client has encountered a connection error',
  'server closed the connection',
  'timeout exceeded when trying to connect',
  'connect econnrefused',
  'the database system is starting up',
  'the database system is shutting down',
];

interface ConCodigo {
  code?: unknown;
  errno?: unknown;
  cause?: unknown;
}

function codigoDe(error: unknown): string | undefined {
  if (error instanceof QueryFailedError) {
    return (error.driverError as ConCodigo | undefined)?.code as string | undefined;
  }
  if (typeof error === 'object' && error !== null) {
    const codigo = (error as ConCodigo).code ?? (error as ConCodigo).errno;
    if (typeof codigo === 'string') return codigo;
    const causa = (error as ConCodigo).cause;
    if (causa && typeof causa === 'object') {
      const codigoCausa = (causa as ConCodigo).code ?? (causa as ConCodigo).errno;
      if (typeof codigoCausa === 'string') return codigoCausa;
    }
  }
  return undefined;
}

// Un 23505 (duplicado) NO es una caida de Postgres: es el caso "ya procesado"
// y se confirma sin escribir ni desviar al .dlt.
export function esViolacionUnica(error: unknown): boolean {
  return codigoDe(error) === '23505';
}

export function esPostgresNoResponde(error: unknown): boolean {
  const codigo = codigoDe(error);
  if (codigo && (CODIGOS_POSTGRES.has(codigo) || CODIGOS_RED.has(codigo))) return true;

  if (esViolacionUnica(error)) return false;

  const mensaje = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return MENSAJES_POSTGRES.some((fragmento) => mensaje.includes(fragmento));
}

export interface OpcionesReintento {
  // Cantidad de reintentos despues del primer intento (3 => 4 intentos en total).
  reintentos?: number;
  // Espera creciente por defecto: 1 s, 2 s y 4 s.
  esperasMs?: number[];
  dormir?: (ms: number) => Promise<void>;
  alReintentar?: (intento: number, esperaMs: number, error: unknown) => void;
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

// Reintenta SOLO fallas transitorias de Postgres. Un error de validacion o de
// negocio sube de inmediato; el consumidor lo trata como definitivo.
export async function conReintentos<T>(
  operacion: () => Promise<T>,
  opciones: OpcionesReintento = {},
): Promise<T> {
  const reintentos = opciones.reintentos ?? 3;
  const esperas = opciones.esperasMs ?? [1000, 2000, 4000];
  const dormir = opciones.dormir ?? esperar;

  let ultimoError: unknown;
  for (let intento = 0; intento <= reintentos; intento++) {
    try {
      return await operacion();
    } catch (error) {
      ultimoError = error;
      if (!esPostgresNoResponde(error)) throw error;
      if (intento === reintentos) break;
      const espera = esperas[Math.min(intento, esperas.length - 1)] ?? 1000;
      opciones.alReintentar?.(intento + 1, espera, error);
      await dormir(espera);
    }
  }
  throw ultimoError;
}
