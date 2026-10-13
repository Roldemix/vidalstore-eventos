export declare class EventoAuditoria {
    id: string;
    routingKey: string;
    eventoId: string;
    usuarioSub: string | null;
    payload: unknown;
    emitidoEn: Date;
    recibidoEn: Date;
}
