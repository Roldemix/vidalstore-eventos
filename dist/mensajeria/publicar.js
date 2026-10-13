"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicarConfirmado = publicarConfirmado;
const crypto_1 = require("crypto");
function publicarConfirmado(ch, exchange, routingKey, cuerpo) {
    const eventoId = (0, crypto_1.randomUUID)();
    return new Promise((resolve, reject) => {
        ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(cuerpo)), {
            persistent: true,
            contentType: 'application/json',
            headers: { 'x-evento-id': eventoId, 'x-emitido-en': new Date().toISOString() },
        }, (err) => (err ? reject(err) : resolve(eventoId)));
    });
}
//# sourceMappingURL=publicar.js.map