"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.declararTopologia = declararTopologia;
const topologia_1 = require("./topologia");
async function declararTopologia(ch) {
    for (const x of Object.values(topologia_1.EXCHANGES)) {
        await ch.assertExchange(x.nombre, x.tipo, { durable: true });
    }
    for (const c of Object.values(topologia_1.COLAS)) {
        await ch.assertQueue(c.dlq, { durable: true, arguments: { 'x-queue-type': 'quorum' } });
        await ch.bindQueue(c.dlq, topologia_1.EXCHANGES.dlx.nombre, c.trabajo);
    }
    for (const c of Object.values(topologia_1.COLAS)) {
        await ch.assertQueue(c.trabajo, {
            durable: true,
            arguments: {
                'x-queue-type': 'quorum',
                'x-dead-letter-exchange': topologia_1.EXCHANGES.dlx.nombre,
                'x-dead-letter-routing-key': c.trabajo,
            },
        });
    }
    for (const b of topologia_1.BINDINGS) {
        await ch.bindQueue(b.cola, b.exchange, b.routingKey);
    }
}
//# sourceMappingURL=declarar-topologia.js.map