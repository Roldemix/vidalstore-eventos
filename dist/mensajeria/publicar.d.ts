import type { ConfirmChannel } from 'amqplib';
export declare function publicarConfirmado(ch: ConfirmChannel, exchange: string, routingKey: string, cuerpo: object): Promise<string>;
