import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
export declare class RabbitService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private connection;
    private channel;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    getChannel(): amqp.Channel;
    isConnected(): boolean;
    onModuleDestroy(): Promise<void>;
}
