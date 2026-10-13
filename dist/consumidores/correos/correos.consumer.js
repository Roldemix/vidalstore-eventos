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
var CorreosConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorreosConsumer = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const topologia_1 = require("../../mensajeria/topologia");
const politica_consumo_1 = require("../../mensajeria/politica-consumo");
const notificacion_entity_1 = require("../../persistencia/entidades/notificacion.entity");
const rabbit_service_1 = require("../../rabbit/rabbit.service");
const manejar_mensaje_1 = require("../comun/manejar-mensaje");
const mensaje_1 = require("../comun/mensaje");
let CorreosConsumer = CorreosConsumer_1 = class CorreosConsumer {
    rabbit;
    repo;
    logger = new common_1.Logger(CorreosConsumer_1.name);
    constructor(rabbit, repo) {
        this.rabbit = rabbit;
        this.repo = repo;
    }
    async onApplicationBootstrap() {
        const ch = this.rabbit.getChannel();
        await ch.prefetch(politica_consumo_1.PREFETCH);
        await ch.consume(topologia_1.COLAS.correos.trabajo, (msg) => {
            if (!msg)
                return;
            (0, manejar_mensaje_1.manejarMensaje)(ch, msg, () => this.procesar(msg), this.logger).catch((e) => this.logger.error(`no se pudo confirmar el mensaje: ${e.message}`));
        }, { noAck: false });
        this.logger.log(`escuchando ${topologia_1.COLAS.correos.trabajo}`);
    }
    async procesar(msg) {
        const comando = (0, mensaje_1.leerEvento)(msg);
        const d = comando.datos;
        if (!mensaje_1.UUID_RE.test(d.eventoId)) {
            throw new mensaje_1.MensajeMalFormadoError('eventoId del comando no es un UUID');
        }
        this.logger.log(`ENVIANDO correo a ${d.para}: "${d.asunto}" (origen ${d.origen}, evento ${d.eventoId})`);
        await this.repo.insert({
            para: d.para,
            asunto: d.asunto,
            estado: 'enviada',
            eventoId: d.eventoId,
        });
    }
};
exports.CorreosConsumer = CorreosConsumer;
exports.CorreosConsumer = CorreosConsumer = CorreosConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(notificacion_entity_1.Notificacion)),
    __metadata("design:paramtypes", [rabbit_service_1.RabbitService,
        typeorm_2.Repository])
], CorreosConsumer);
//# sourceMappingURL=correos.consumer.js.map