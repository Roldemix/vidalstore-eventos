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
}