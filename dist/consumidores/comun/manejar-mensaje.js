"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manejarMensaje = manejarMensaje;
const politica_consumo_1 = require("../../mensajeria/politica-consumo");
const mensaje_1 = require("./mensaje");
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function manejarMensaje(ch, msg, trabajo, logger) {
    for (let intento = 1; intento <= politica_consumo_1.REINTENTOS_MAX; intento++) {
        try {
            await trabajo();
            ch.ack(msg);
            return;
        }
        catch (err) {
            if (err instanceof mensaje_1.MensajeMalFormadoError) {
                logger.warn(`mensaje mal formado, va a la DLQ sin reintento: ${err.message}`);
                ch.nack(msg, false, false);
                return;
            }
            const motivo = err instanceof Error ? err.message : String(err);
            logger.warn(`fallo transitorio (intento ${intento}/${politica_consumo_1.REINTENTOS_MAX}): ${motivo}`);
            if (intento < politica_consumo_1.REINTENTOS_MAX)
                await esperar(politica_consumo_1.ESPERA_REINTENTO_MS);
        }
    }
    logger.error('reintentos agotados, va a la DLQ');
    ch.nack(msg, false, false);
}
//# sourceMappingURL=manejar-mensaje.js.map