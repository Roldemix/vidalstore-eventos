import type { Channel, ConsumeMessage } from 'amqplib';
import type { Logger } from '@nestjs/common';
export declare function manejarMensaje(ch: Channel, msg: ConsumeMessage, trabajo: () => Promise<void>, logger: Logger): Promise<void>;
