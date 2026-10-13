"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MensajesMuertosConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MensajesMuertosConsumer = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const topologia_1 = require("../../mensajeria/topologia");
const politica_consumo_1 = require("../../mensajeria/politica-consumo");
const mensaje_muerto_entity_1 = require("../../persistencia/entidades/mensaje-muerto.entity");
const rabbit_service_1 = require("../../rabbit/rabbit.service");
const leer_muerte_1 = require("./leer-muerte");
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let MensajesMuertosConsumer = MensajesMuertosConsumer_1 = class MensajesMuertosConsumer {
    rabbit;
    repo;
    logger = new common_1.Logger(MensajesMuertosConsumer_1.name);
    constructor(rabbit, repo) {
        this.rabbit = rabbit;
        this.repo = repo;
    }
    async onApplicationBootstrap() {
        const ch = this.rabbit.getChannel();
        await ch.prefetch(politica_consumo_1.PREFETCH);
        for (const c of Object.values(topologia_1.COLAS)) {
            await ch.consume(c.dlq, (msg) => {
                if (!msg)
                    return;
                this.procesar(ch, msg).catch((e) => this.logger.error(`no se pudo confirmar el mensaje muerto: ${e.message}`));
            }, { noAck: false });
            this.logger.log(`escuchando ${c.dlq}`);
        }
    }
    async procesar(ch, msg) {
        const muerte = (0, leer_muerte_1.leerMuerte)(msg);
        this.logger.warn(`MENSAJE MUERTO cola=${muerte.colaOrigen} routingKey=${muerte.routingKey} ` +
            `motivo=${muerte.motivo} intentos=${muerte.intentos}`);
        try {
            await this.repo.insert({
                colaOrigen: muerte.colaOrigen,
                routingKey: muerte.routingKey,
                motivo: muerte.motivo,
                intentos: muerte.intentos,
                payload: msg.content.toString('utf8'),
            });
            ch.ack(msg);
        }
        catch (err) {
            const motivo = err instanceof Error ? err.message : String(err);
            this.logger.error(`no se pudo registrar el mensaje muerto (${motivo}); vuelve a su DLQ`);
            await esperar(politica_consumo_1.ESPERA_DLQ_MS);
            ch.nack(msg, false, true);
        }
    }
};
exports.MensajesMuertosConsumer = MensajesMuertosConsumer;
exports.MensajesMuertosConsumer = MensajesMuertosConsumer = MensajesMuertosConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(mensaje_muerto_entity_1.MensajeMuerto)),
    __metadata("design:paramtypes", [rabbit_service_1.RabbitService,
        typeorm_2.Repository])
], MensajesMuertosConsumer);
//# sourceMappingURL=mensajes-muertos.consumer.js.map