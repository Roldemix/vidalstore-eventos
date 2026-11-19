import type { Message } from '@platformatic/kafka';
import { procesarMensajeStream } from './procesar-mensaje';

const VALIDO = {
  eventoId: '6f1e3a5c-1111-4c22-8d33-0123456789ab',
  tipo: 'compra.realizada',
  version: 1,
  emitidoEn: '2026-11-06T21:10:00.000Z',
  juegoId: 'juego-1',
};

function mensaje(value: string, topic = 'vidalstore.compras'): Message<string, string, string, string> {
  const headers = new Map<string, string>();
  return {
    topic,
    partition: 0,
    offset: 7n,
    key: 'sub-1',
    value,
    headers,
    headerEntries: [],
    timestamp: 0n,
    leaderEpoch: 0,
    metadata: {},
    commit: () => undefined,
    toJSON: () => ({}) as never,
  } as Message<string, string, string, string>;
}

function crearDobles(opciones: { yaProcesado?: boolean } = {}) {
  const desviados: Array<{ grupo: string; motivo: string; topic: string }> = [];
  const marcados: Array<{ grupo: string; eventoId: string }> = [];
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  const base = {
    grupo: 'vidalstore-panel',
    logger,
    esperasMs: [0, 0, 0],
    procesados: {
      existe: jest.fn(async () => opciones.yaProcesado ?? false),
      marcar: jest.fn(async (grupo: string, eventoId: string) => {
        marcados.push({ grupo, eventoId });
      }),
    },
    dlt: {
      desviar: jest.fn(
        async (grupo: string, m: Message<string, string, string, string>, motivo: string) => {
          desviados.push({ grupo, motivo, topic: `${m.topic}.dlt` });
        },
      ),
    },
  };
  return { base, desviados, marcados, logger };
}

describe('procesarMensajeStream', () => {
  it('procesa un evento valido y lo marca en eventos_procesados', async () => {
    const { base, marcados, desviados } = crearDobles();
    const procesar = jest.fn(async () => undefined);

    const resultado = await procesarMensajeStream(mensaje(JSON.stringify(VALIDO)), procesar, base);

    expect(resultado).toBe('procesado');
    expect(procesar).toHaveBeenCalledTimes(1);
    expect(marcados).toEqual([{ grupo: 'vidalstore-panel', eventoId: VALIDO.eventoId }]);
    expect(desviados).toEqual([]);
  });

  it('manda al .dlt con x-motivo sin llamar al procesador cuando el JSON esta roto', async () => {
    const { base, marcados, desviados } = crearDobles();
    const procesar = jest.fn(async () => undefined);

    const resultado = await procesarMensajeStream(mensaje('{roto'), procesar, base);

    expect(resultado).toBe('desviado');
    expect(procesar).not.toHaveBeenCalled();
    expect(marcados).toEqual([]);
    expect(desviados).toEqual([
      { grupo: 'vidalstore-panel', motivo: 'json-invalido', topic: 'vidalstore.compras.dlt' },
    ]);
  });

  it('no reescribe un evento ya procesado por el mismo grupo ni lo desvia', async () => {
    const { base, marcados, desviados } = crearDobles({ yaProcesado: true });
    const procesar = jest.fn(async () => undefined);

    const resultado = await procesarMensajeStream(mensaje(JSON.stringify(VALIDO)), procesar, base);

    expect(resultado).toBe('duplicado');
    expect(procesar).not.toHaveBeenCalled();
    expect(marcados).toEqual([]);
    expect(desviados).toEqual([]);
  });

  it('confirma un duplicado detectado por UNIQUE sin ir al .dlt', async () => {
    const { base, desviados } = crearDobles();
    const procesar = jest.fn(async () => {
      throw Object.assign(new Error('duplicate key'), { code: '23505' });
    });

    const resultado = await procesarMensajeStream(mensaje(JSON.stringify(VALIDO)), procesar, base);

    expect(resultado).toBe('duplicado');
    expect(desviados).toEqual([]);
  });

  it('reintenta tres veces si Postgres no responde y despues desvia', async () => {
    const { base, desviados } = crearDobles();
    const procesar = jest.fn(async () => {
      throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    });

    const resultado = await procesarMensajeStream(mensaje(JSON.stringify(VALIDO)), procesar, base);

    expect(resultado).toBe('error-desviado');
    expect(procesar).toHaveBeenCalledTimes(4);
    expect(desviados).toEqual([
      {
        grupo: 'vidalstore-panel',
        motivo: 'postgres-noresponde',
        topic: 'vidalstore.compras.dlt',
      },
    ]);
  });

  it('no publica en .dlt y solo registra cuando el topic no tiene dlt (catalogo)', async () => {
    const { base, desviados } = crearDobles();
    const procesar = jest.fn(async () => undefined);

    const resultado = await procesarMensajeStream(mensaje('{roto', 'vidalstore.catalogo'), procesar, {
      ...base,
      publicarEnDlt: false,
    });

    expect(resultado).toBe('desviado');
    expect(desviados).toEqual([]);
  });
});
