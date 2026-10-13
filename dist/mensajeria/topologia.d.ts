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
export declare const COLAS: {
    readonly avisos: {
        readonly trabajo: "vidalstore.avisos";
        readonly dlq: "vidalstore.avisos.dlq";
    };
    readonly auditoria: {
        readonly trabajo: "vidalstore.auditoria";
        readonly dlq: "vidalstore.auditoria.dlq";
    };
    readonly correos: {
        readonly trabajo: "vidalstore.correos";
        readonly dlq: "vidalstore.correos.dlq";
    };
};
export declare const BINDINGS: readonly [{
    readonly exchange: "vidalstore.eventos";
    readonly cola: "vidalstore.avisos";
    readonly routingKey: "licencia.revocada";
}, {
    readonly exchange: "vidalstore.eventos";
    readonly cola: "vidalstore.avisos";
    readonly routingKey: "compra.realizada";
}, {
    readonly exchange: "vidalstore.eventos";
    readonly cola: "vidalstore.auditoria";
    readonly routingKey: "#";
}, {
    readonly exchange: "vidalstore.comandos";
    readonly cola: "vidalstore.correos";
    readonly routingKey: "correo.enviar";
}];
