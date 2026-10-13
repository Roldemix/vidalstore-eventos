import type { ConsumeMessage } from 'amqplib';
export interface MuerteInfo {
    colaOrigen: string;
    routingKey: string | null;
    motivo: string;
    intentos: number;
}
export declare function leerMuerte(msg: ConsumeMessage): MuerteInfo;
