import type { Message } from '@platformatic/kafka';
import { EventoInvalidoError, leerEventoKafka } from './evento';

function mensaje(
  value: string,
  headers: Record<string, string> = {},
  topic = 'vidalstore.compras',
): Message<string, string, string, string> {
  const mapa = new Map(Object.entries(headers));
  return {
    topic,
    partition: 0,
    offset: 1n,
    key: 'sub-1',
    value,
    headers: mapa,
    headerEntries: [...mapa.entries()],
    timestamp: 0n,
    leaderEpoch: 0,
    metadata: {},
    commit: () => undefined,
    toJSON: () => ({}) as never,
  } as Message<string, string, string, string>;
}

const VALIDO = {
  eventoId: '6f1e3a5c-1111-4c22-8d33-0123456789ab',
  tipo: 'compra.realizada',
  version: 1,
  emitidoEn: '2026-11-06T21:10:00.000Z',
  juegoId: 'juego-1',
  monto: 9990,
};

async function motivoDe(value: string, headers?: Record<string, string>): Promise<string> {
  try {
    await leerEventoKafka(mensaje(value, headers));
  } catch (error) {
    expect(error).toBeInstanceOf(EventoInvalidoError);
    return (error as EventoInvalidoError).motivo;
  }
  throw new Error('se esperaba EventoInvalidoError');
}

describe('leerEventoKafka', () => {
  it('acepta un evento con el sobre version 1 en el value', async () => {
    const evento = await leerEventoKafka(mensaje(JSON.stringify(VALIDO)));
    expect(evento.id).toBe(VALIDO.eventoId);
    expect(evento.tipo).toBe(VALIDO.tipo);
    expect(evento.version).toBe(1);
    expect(evento.emitidoEn.toISOString()).toBe(VALIDO.emitidoEn);
  });

  it('acepta el sobre en headers cuando el value no lo trae', async () => {
    const { eventoId, tipo, emitidoEn, ...resto } = VALIDO;
    const evento = await leerEventoKafka(
      mensaje(JSON.stringify(resto), {
        'x-evento-id': eventoId,
        'x-tipo-evento': tipo,
        'x-emitido-en': emitidoEn,
      }),
    );
    expect(evento.id).toBe(eventoId);
    expect(evento.datos.eventoId).toBe(eventoId);
    expect(evento.datos.tipo).toBe(tipo);
  });

  it('desvia un JSON roto con motivo json-invalido', async () => {
    expect(await motivoDe('{"eventoId": "cortado"')).toBe('json-invalido');
  });

  it('desvia un valor que no es objeto con dto-invalido', async () => {
    expect(await motivoDe('[1,2,3]')).toBe('dto-invalido');
  });

  it('informa falta-eventoId cuando no esta ni en value ni en headers', async () => {
    const { eventoId: _id, ...sinId } = VALIDO;
    expect(await motivoDe(JSON.stringify(sinId))).toBe('falta-eventoId');
  });

  it('informa falta-tipo', async () => {
    const { tipo: _tipo, ...sinTipo } = VALIDO;
    expect(await motivoDe(JSON.stringify(sinTipo))).toBe('falta-tipo');
  });

  it('informa falta-version', async () => {
    const { version: _version, ...sinVersion } = VALIDO;
    expect(await motivoDe(JSON.stringify(sinVersion))).toBe('falta-version');
  });

  it('informa falta-emitidoEn', async () => {
    const { emitidoEn: _emitido, ...sinFecha } = VALIDO;
    expect(await motivoDe(JSON.stringify(sinFecha))).toBe('falta-emitidoEn');
  });

  it('desvia una version distinta de 1 con version-desconocida', async () => {
    expect(await motivoDe(JSON.stringify({ ...VALIDO, version: 99 }))).toBe(
      'version-desconocida',
    );
  });

  it('informa el campo obligatorio del DTO que falta', async () => {
    const { juegoId: _juego, ...sinJuego } = VALIDO;
    expect(await motivoDe(JSON.stringify(sinJuego))).toBe('falta-juegoId');
  });

  it('marca dto-invalido cuando un campo tiene el tipo equivocado', async () => {
    expect(await motivoDe(JSON.stringify({ ...VALIDO, monto: 'mucho' }))).toBe('dto-invalido');
  });

  it('marca dto-invalido cuando emitidoEn no es una fecha ISO', async () => {
    expect(await motivoDe(JSON.stringify({ ...VALIDO, emitidoEn: 'ayer' }))).toBe('dto-invalido');
  });
});
