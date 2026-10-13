"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BINDINGS = exports.COLAS = exports.ROUTING_KEYS = exports.EXCHANGES = void 0;
exports.EXCHANGES = {
    eventos: { nombre: 'vidalstore.eventos', tipo: 'topic' },
    comandos: { nombre: 'vidalstore.comandos', tipo: 'direct' },
    dlx: { nombre: 'vidalstore.dlx', tipo: 'direct' },
};
exports.ROUTING_KEYS = {
    compraRealizada: 'compra.realizada',
    licenciaRevocada: 'licencia.revocada',
    juegoPublicado: 'juego.publicado',
    correoEnviar: 'correo.enviar',
};
exports.COLAS = {
    avisos: { trabajo: 'vidalstore.avisos', dlq: 'vidalstore.avisos.dlq' },
    auditoria: { trabajo: 'vidalstore.auditoria', dlq: 'vidalstore.auditoria.dlq' },
    correos: { trabajo: 'vidalstore.correos', dlq: 'vidalstore.correos.dlq' },
};
exports.BINDINGS = [
    { exchange: exports.EXCHANGES.eventos.nombre, cola: exports.COLAS.avisos.trabajo, routingKey: exports.ROUTING_KEYS.licenciaRevocada },
    { exchange: exports.EXCHANGES.eventos.nombre, cola: exports.COLAS.avisos.trabajo, routingKey: exports.ROUTING_KEYS.compraRealizada },
    { exchange: exports.EXCHANGES.eventos.nombre, cola: exports.COLAS.auditoria.trabajo, routingKey: '#' },
    { exchange: exports.EXCHANGES.comandos.nombre, cola: exports.COLAS.correos.trabajo, routingKey: exports.ROUTING_KEYS.correoEnviar },
];
//# sourceMappingURL=topologia.js.map