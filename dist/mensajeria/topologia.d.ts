export declare const EXCHANGES: {
    readonly eventos: {
        readonly nombre: "vidalstore.eventos";
        readonly tipo: "topic";
    };
    readonly comandos: {
        readonly nombre: "vidalstore.comandos";
        readonly tipo: "direct";
    };
    readonly dlx: {
        readonly nombre: "vidalstore.dlx";
        readonly tipo: "direct";
    };
};
export declare const ROUTING_KEYS: {
    readonly compraRealizada: "compra.realizada";
    readonly licenciaRevocada: "licencia.revocada";
    readonly juegoPublicado: "juego.publicado";
    readonly correoEnviar: "correo.enviar";
};
export interface ParDeColas {
    trabajo: string;
    dlq: string;
}
export declare const COLAS: Record<'avisos' | 'auditoria' | 'correos', ParDeColas>;
export declare const BINDINGS: readonly [{
    readonly exchange: "vidalstore.eventos";
    readonly cola: string;
    readonly routingKey: "licencia.revocada";
}, {
    readonly exchange: "vidalstore.eventos";
    readonly cola: string;
    readonly routingKey: "compra.realizada";
}, {
    readonly exchange: "vidalstore.eventos";
    readonly cola: string;
    readonly routingKey: "#";
}, {
    readonly exchange: "vidalstore.comandos";
    readonly cola: string;
    readonly routingKey: "correo.enviar";
}];
