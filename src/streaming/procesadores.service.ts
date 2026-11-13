import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Alerta } from '../persistencia/entidades/alerta.entity';
import { EventoProcesado } from '../persistencia/entidades/evento-procesado.entity';
import { KpiMinuto } from '../persistencia/entidades/kpi-minuto.entity';
import { VentaSemana } from '../persistencia/entidades/venta-semana.entity';
import { EventoStream, minutoDe, numero, semanaDe, texto } from './evento';

function esDuplicado(error: unknown): boolean {
  return error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === '23505';
}

@Injectable()
export class ProcesadoresStreamingService {
  constructor(
    @InjectRepository(KpiMinuto) private readonly kpi: Repository<KpiMinuto>,
    @InjectRepository(Alerta) private readonly alertas: Repository<Alerta>,
    @InjectRepository(VentaSemana) private readonly ventas: Repository<VentaSemana>,
    @InjectRepository(EventoProcesado) private readonly procesados: Repository<EventoProcesado>,
  ) {}

  async panel(evento: EventoStream): Promise<void> {
    try {
      await this.kpi.insert({
        eventoId: evento.id,
        juegoId: evento.datos.juegoId,
        minuto: minutoDe(evento.emitidoEn),
        tipo: evento.tipo,
        unidades: numero(evento.datos.unidades, evento.tipo.includes('compra') ? 1 : 0),
        monto: numero(evento.datos.monto, numero(evento.datos.precio)),
      });
    } catch (error) {
      if (!esDuplicado(error)) throw error;
    }
  }

  async alerta(evento: EventoStream): Promise<void> {
    await this.panel(evento);
    if (!evento.tipo.includes('termin')) return;
    const ventanaFin = new Date(evento.emitidoEn);
    ventanaFin.setUTCSeconds(0, 0);
    const ventanaInicio = new Date(ventanaFin.getTime() - 5 * 60 * 1000);
    const filas = await this.kpi
      .createQueryBuilder('k')
      .where('k.juego_id = :juegoId', { juegoId: evento.datos.juegoId })
      .andWhere('k.minuto >= :inicio AND k.minuto < :fin', {
        inicio: ventanaInicio,
        fin: new Date(ventanaFin.getTime() + 60 * 1000),
      })
      .getMany();
    const terminadas = filas.filter((fila) => fila.tipo.includes('termin')).length;
    const errores = filas.filter(
      (fila) => fila.tipo.includes('error') || fila.tipo.includes('fall'),
    ).length;
    if (terminadas < 3 || errores / terminadas <= 0.2) return;

    try {
      await this.alertas.insert({
        eventoId: evento.id,
        juegoId: evento.datos.juegoId,
        ventanaInicio,
        ventanaFin: new Date(ventanaFin.getTime() + 60 * 1000),
        enError: errores,
        terminadas,
      });
    } catch (error) {
      if (!esDuplicado(error)) throw error;
    }
  }

  async historial(evento: EventoStream): Promise<void> {
    if (!evento.tipo.includes('compra') && !evento.tipo.includes('revoc')) return;
    const unidades = evento.tipo.includes('revoc') ? -1 : numero(evento.datos.unidades, 1);
    let monto = numero(evento.datos.monto, numero(evento.datos.precio));
    if (evento.tipo.includes('revoc') && evento.datos.licenciaId) {
      const compra = await this.ventas.findOne({
        where: { licenciaId: evento.datos.licenciaId, tipo: 'compra' },
        order: { semana: 'ASC' },
      });
      monto = compra?.monto ?? 0;
      monto = -monto;
    }
    try {
      await this.ventas.insert({
        eventoId: evento.id,
        juegoId: evento.datos.juegoId,
        semana: semanaDe(evento.emitidoEn),
        tipo: evento.tipo.includes('revoc') ? 'revocacion' : 'compra',
        unidades,
        monto,
        licenciaId: texto(evento.datos.licenciaId) ?? null,
      });
    } catch (error) {
      if (!esDuplicado(error)) throw error;
    }
  }
}
