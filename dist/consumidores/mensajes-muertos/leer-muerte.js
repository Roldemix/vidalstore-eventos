"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leerMuerte = leerMuerte;
function leerMuerte(msg) {
    const h = msg.properties.headers ?? {};
    const muertes = Array.isArray(h['x-death']) ? h['x-death'] : [];
    const m = muertes[0];
    const claves = (m?.['routing-keys'] ?? []);
    return {
        colaOrigen: String(m?.queue ?? h['x-first-death-queue'] ?? msg.fields.routingKey),
        routingKey: claves[0] ? String(claves[0]) : null,
        motivo: String(m?.reason ?? h['x-first-death-reason'] ?? 'desconocido'),
        intentos: Number(m?.count ?? 1),
    };
}
//# sourceMappingURL=leer-muerte.js.map