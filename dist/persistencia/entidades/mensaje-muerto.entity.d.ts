export declare class MensajeMuerto {
    id: string;
    colaOrigen: string;
    routingKey: string | null;
    motivo: string;
    intentos: number;
    payload: string;
    recibidoEn: Date;
}
