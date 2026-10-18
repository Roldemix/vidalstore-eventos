import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { declararTopologia } from '../mensajeria/declarar-topologia';

@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitService.name);
  private connection!: Awaited<ReturnType<typeof amqp.connect>>;
  private channel!: amqp.Channel;
  private confirmChannel!: amqp.ConfirmChannel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    this.confirmChannel = await this.connection.createConfirmChannel();
    await declararTopologia(this.channel);
    this.logger.log('Conectado a RabbitMQ y topologia declarada');
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }

  getConfirmChannel(): amqp.ConfirmChannel {
    return this.confirmChannel;
  }

  isConnected(): boolean {
    return !!this.channel;
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.confirmChannel?.close();
    await this.connection?.close();
  }
}