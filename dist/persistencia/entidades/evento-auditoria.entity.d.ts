export declare class EventoAuditoria {
    id: string;
    routingKey: string;
    eventoId: string;
    usuarioSub: string | null;
    payload: Record<string, any>;
    emitidoEn: Date;
    recibidoEn: Date;
}
