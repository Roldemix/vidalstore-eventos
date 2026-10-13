"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID_RE = exports.MensajeMalFormadoError = void 0;
exports.leerEvento = leerEvento;
const topologia_1 = require("../../mensajeria/topologia");
class MensajeMalFormadoError extends Error {
}
exports.MensajeMalFormadoError = MensajeMalFormadoError;
exports.UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CAMPOS_OBLIGATORIOS = {
    [topologia_1.ROUTING_KEYS.compraRealizada]: ['licenciaId', 'juegoId', 'usuarioSub', 'adquiridaEn'],
    [topologia_1.ROUTING_KEYS.licenciaRevocada]: ['licenciaId', 'juegoId', 'usuarioSub', 'revocadaPor', 'motivo'],
    [topologia_1.ROUTING_KEYS.juegoPublicado]: ['juegoId', 'titulo', 'editorSub'],
    [topologia_1.ROUTING_KEYS.correoEnviar]: ['para', 'asunto', 'cuerpo', 'origen', 'eventoId'],
};
function leerEvento(msg) {
    let datos;
    try {
        datos = JSON.parse(msg.content.toString('utf8'));
    }
    catch {
        throw new MensajeMalFormadoError('el cuerpo no es JSON');
    }
    if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
        throw new MensajeMalFormadoError('el cuerpo no es un objeto JSON');
    }
    const obj = datos;
    const routingKey = msg.fields.routingKey;
    for (const campo of CAMPOS_OBLIGATORIOS[routingKey] ?? []) {
        const v = obj[campo];
        if (typeof v !== 'string' || v.trim() === '') {
            throw new MensajeMalFormadoError(`falta el campo obligatorio "${campo}" en ${routingKey}`);
        }
    }
    const eventoId = msg.properties.headers?.['x-evento-id'];
    if (typeof eventoId !== 'string' || !exports.UUID_RE.test(eventoId)) {
        throw new MensajeMalFormadoError('x-evento-id falta o no es un UUID');
    }
    const emitidoEn = new Date(String(msg.properties.headers?.['x-emitido-en']));
    if (Number.isNaN(emitidoEn.getTime())) {
        throw new MensajeMalFormadoError('x-emitido-en falta o no es una fecha ISO 8601');
    }
    return { routingKey, eventoId, emitidoEn, datos: obj };
}
//# sourceMappingURL=mensaje.js.map