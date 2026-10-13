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
var AvisosConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvisosConsumer = void 0;
const common_1 = require("@nestjs/common");
const rabbit_service_1 = require("../../rabbit/rabbit.service");
const topologia_1 = require("../../mensajeria/topologia");
const politica_consumo_1 = require("../../mensajeria/politica-consumo");
const publicar_1 = require("../../mensajeria/publicar");
const manejar_mensaje_1 = require("../comun/manejar-mensaje");
const mensaje_1 = require("../comun/mensaje");
let AvisosConsumer = AvisosConsumer_1 = class AvisosConsumer {
    rabbit;
    logger = new common_1.Logger(AvisosConsumer_1.name);
    constructor(rabbit) {
        this.rabbit = rabbit;
    }
    async onApplicationBootstrap() {
        const ch = this.rabbit.getChannel();
        await ch.prefetch(politica_consumo_1.PREFETCH);
        await ch.consume(topologia_1.COLAS.avisos.trabajo, (msg) => {
            if (!msg)
                return;
            (0, manejar_mensaje_1.manejarMensaje)(ch, msg, () => this.procesar(msg), this.logger).catch((e) => this.logger.error(`no se pudo confirmar el mensaje: ${e.message}`));
        }, { noAck: false });
        this.logger.log(`escuchando ${topologia_1.COLAS.avisos.trabajo}`);
    }
    async procesar(msg) {
        const evento = (0, mensaje_1.leerEvento)(msg);
        const aviso = this.armarAviso(evento);
        if (!aviso) {
            this.logger.log(`${evento.routingKey} no requiere aviso`);
            return;
        }
        await (0, publicar_1.publicarConfirmado)(this.rabbit.getConfirmChannel(), topologia_1.EXCHANGES.comandos.nombre, topologia_1.ROUTING_KEYS.correoEnviar, { ...aviso, origen: evento.routingKey, eventoId: evento.eventoId });
        this.logger.log(`correo.enviar publicado para ${evento.routingKey} (${evento.eventoId})`);
    }
    armarAviso(e) {
        const para = e.datos.usuarioSub;
        switch (e.routingKey) {
            case topologia_1.ROUTING_KEYS.licenciaRevocada:
                return {
                    para,
                    asunto: 'Tu licencia fue revocada',
                    cuerpo: `Se revocó tu licencia del juego ${e.datos.juegoId}. Motivo: ${e.datos.motivo}.`,
                };
            case topologia_1.ROUTING_KEYS.compraRealizada:
                return {
                    para,
                    asunto: 'Compra confirmada',
                    cuerpo: `Ya tienes tu licencia del juego ${e.datos.juegoId}.`,
                };
            default:
                return null;
        }
    }
};
exports.AvisosConsumer = AvisosConsumer;
exports.AvisosConsumer = AvisosConsumer = AvisosConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rabbit_service_1.RabbitService])
], AvisosConsumer);
//# sourceMappingURL=avisos.consumer.js.map