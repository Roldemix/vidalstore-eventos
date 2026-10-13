import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
export declare class RabbitService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    private confirmChannel;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    getChannel(): amqp.Channel;
    getConfirmChannel(): amqp.ConfirmChannel;
    isConnected(): boolean;
    onModuleDestroy(): Promise<void>;
}
