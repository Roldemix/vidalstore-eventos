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
var AuditoriaConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaConsumer = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const topologia_1 = require("../../mensajeria/topologia");
const politica_consumo_1 = require("../../mensajeria/politica-consumo");
const evento_auditoria_entity_1 = require("../../persistencia/entidades/evento-auditoria.entity");
const rabbit_service_1 = require("../../rabbit/rabbit.service");
const manejar_mensaje_1 = require("../comun/manejar-mensaje");
const mensaje_1 = require("../comun/mensaje");
function esEventoDuplicado(err) {
    if (!(err instanceof typeorm_2.QueryFailedError))
        return false;
    const e = err.driverError;
    return e.code === '23505' && e.constraint === 'uq_auditoria_evento_id';
}
let AuditoriaConsumer = AuditoriaConsumer_1 = class AuditoriaConsumer {
    rabbit;
    repo;
    logger = new common_1.Logger(AuditoriaConsumer_1.name);
    constructor(rabbit, repo) {
        this.rabbit = rabbit;
        this.repo = repo;
    }
    async onApplicationBootstrap() {
        const ch = this.rabbit.getChannel();
        await ch.prefetch(politica_consumo_1.PREFETCH);
        await ch.consume(topologia_1.COLAS.auditoria.trabajo, (msg) => {
            if (!msg)
                return;
            (0, manejar_mensaje_1.manejarMensaje)(ch, msg, () => this.procesar(msg), this.logger).catch((e) => this.logger.error(`no se pudo confirmar el mensaje: ${e.message}`));
        }, { noAck: false });
        this.logger.log(`escuchando ${topologia_1.COLAS.auditoria.trabajo}`);
    }
    async procesar(msg) {
        const evento = (0, mensaje_1.leerEvento)(msg);
        try {
            await this.repo.insert({
                routingKey: evento.routingKey,
                eventoId: evento.eventoId,
                usuarioSub: typeof evento.datos.usuarioSub === 'string' ? evento.datos.usuarioSub : null,
                payload: evento.datos,
                emitidoEn: evento.emitidoEn,
            });
            this.logger.log(`auditado ${evento.routingKey} (${evento.eventoId})`);
        }
        catch (err) {
            if (esEventoDuplicado(err)) {
                this.logger.warn(`evento ${evento.eventoId} ya estaba auditado; se confirma sin duplicar`);
                return;
            }
            throw err;
        }
    }
};
exports.AuditoriaConsumer = AuditoriaConsumer;
exports.AuditoriaConsumer = AuditoriaConsumer = AuditoriaConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(evento_auditoria_entity_1.EventoAuditoria)),
    __metadata("design:paramtypes", [rabbit_service_1.RabbitService,
        typeorm_2.Repository])
], AuditoriaConsumer);
//# sourceMappingURL=auditoria.consumer.js.map