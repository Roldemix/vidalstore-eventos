import type { ConsumeMessage } from 'amqplib';
export declare class MensajeMalFormadoError extends Error {
}
export declare const UUID_RE: RegExp;
export interface EventoLeido {
    routingKey: string;
    eventoId: string;
    emitidoEn: Date;
    datos: Record<string, unknown>;
}
export declare function leerEvento(msg: ConsumeMessage): EventoLeido;
