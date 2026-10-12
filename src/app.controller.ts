import { Controller, Get } from '@nestjs/common';
import { RabbitService } from './rabbit/rabbit.service';

@Controller()
export class AppController {
  constructor(private readonly rabbit: RabbitService) {}

  @Get('health')
  health() {
    return { status: 'ok', rabbit: this.rabbit.isConnected() };
  }
}