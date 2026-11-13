import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RabbitService } from './rabbit/rabbit.service';

@Controller()
export class AppController {
  constructor(
    private readonly rabbit: RabbitService,
    private readonly dataSource: DataSource,
  ) {}

  @Get('salud')
  async salud() {
    let postgres = false;
    try {
      await this.dataSource.query('SELECT 1');
      postgres = true;
    } catch {
      postgres = false;
    }
    const rabbit = this.rabbit.isConnected();
    return { status: rabbit && postgres ? 'ok' : 'degradado', rabbit, postgres };
  }

  @Get('panel/en-vivo')
  async panelEnVivo() {
    const [kpi, alertas, ventas] = await Promise.all([
      this.dataSource.query(
        `SELECT juego_id AS "juegoId", minuto, tipo, SUM(unidades)::int AS unidades,
                SUM(monto)::int AS monto
         FROM eventos.kpi_minuto
         GROUP BY juego_id, minuto, tipo
         ORDER BY minuto DESC
         LIMIT 100`,
      ),
      this.dataSource.query(
        `SELECT juego_id AS "juegoId", ventana_inicio AS "ventanaInicio",
                ventana_fin AS "ventanaFin", en_error AS "enError",
                terminadas
         FROM eventos.alertas
         ORDER BY creada_en DESC LIMIT 50`,
      ),
      this.dataSource.query(
        `SELECT juego_id AS "juegoId", semana, tipo, SUM(unidades)::int AS unidades,
                SUM(monto)::int AS monto
         FROM eventos.ventas_semana
         GROUP BY juego_id, semana, tipo
         ORDER BY semana DESC, juego_id`,
      ),
    ]);
    return { kpi, alertas, ventas };
  }
}