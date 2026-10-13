import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { declararTopologia } from '../mensajeria/declarar-topologia';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitService.name);
  private connection!: Awaited<ReturnType<typeof amqp.connect>>;
  private channel!: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await declararTopologia(this.channel);
    this.logger.log('Conectado a RabbitMQ');
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }

  isConnected(): boolean {
    return !!this.channel;
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}