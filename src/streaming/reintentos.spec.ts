import { QueryFailedError } from 'typeorm';
import { conReintentos, esPostgresNoResponde, esViolacionUnica } from './reintentos';

function errorDePostgres(code: string, message = 'fallo de conexion'): Error {
  return Object.assign(new Error(message), { code });
}

describe('esPostgresNoResponde', () => {
  it('reconoce una conexion rechazada', () => {
    expect(esPostgresNoResponde(errorDePostgres('ECONNREFUSED'))).toBe(true);
  });

  it('reconoce el apagado administrativo de Postgres', () => {
    expect(esPostgresNoResponde(errorDePostgres('57P01'))).toBe(true);
  });

  it('reconoce el mensaje del pool de pg', () => {
    expect(esPostgresNoResponde(new Error('Connection terminated unexpectedly'))).toBe(true);
  });

  it('no confunde un duplicado con una caida', () => {
    const unico = Object.assign(new Error('duplicate key'), { code: '23505' });
    expect(esViolacionUnica(unico)).toBe(true);
    expect(esPostgresNoResponde(unico)).toBe(false);
  });

  it('no reintenta errores de negocio', () => {
    expect(esPostgresNoResponde(new Error('el DTO no valida'))).toBe(false);
  });

  it('lee el codigo del driver cuando TypeORM envuelve el error', () => {
    const driverError = Object.assign(new Error('conexion'), { code: '08006' });
    const envuelto = new QueryFailedError('select 1', [], driverError);
    expect(esPostgresNoResponde(envuelto)).toBe(true);
  });
});

describe('conReintentos', () => {
  it('hace un intento y tres reintentos con espera creciente', async () => {
    const esperas: number[] = [];
    let intentos = 0;
    await expect(
      conReintentos(
        async () => {
          intentos++;
          throw errorDePostgres('ECONNREFUSED');
        },
        {
          dormir: async (ms) => {
            esperas.push(ms);
          },
        },
      ),
    ).rejects.toThrow('fallo de conexion');

    expect(intentos).toBe(4);
    expect(esperas).toEqual([1000, 2000, 4000]);
  });

  it('se recupera en el segundo intento', async () => {
    let intentos = 0;
    const resultado = await conReintentos(
      async () => {
        intentos++;
        if (intentos < 2) throw errorDePostgres('ECONNRESET');
        return 'ok';
      },
      { dormir: async () => undefined },
    );
    expect(resultado).toBe('ok');
    expect(intentos).toBe(2);
  });

  it('no reintenta un duplicado ni un error de validacion', async () => {
    let intentos = 0;
    await expect(
      conReintentos(
        async () => {
          intentos++;
          throw Object.assign(new Error('duplicate'), { code: '23505' });
        },
        { dormir: async () => undefined },
      ),
    ).rejects.toThrow('duplicate');
    expect(intentos).toBe(1);
  });
});
