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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MensajeMuerto = void 0;
const typeorm_1 = require("typeorm");
let MensajeMuerto = class MensajeMuerto {
    id;
    colaOrigen;
    routingKey;
    motivo;
    intentos;
    payload;
    recibidoEn;
};
exports.MensajeMuerto = MensajeMuerto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MensajeMuerto.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cola_origen', type: 'text' }),
    __metadata("design:type", String)
], MensajeMuerto.prototype, "colaOrigen", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'routing_key', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], MensajeMuerto.prototype, "routingKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MensajeMuerto.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MensajeMuerto.prototype, "intentos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MensajeMuerto.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'recibido_en', type: 'timestamptz' }),
    __metadata("design:type", Date)
], MensajeMuerto.prototype, "recibidoEn", void 0);
exports.MensajeMuerto = MensajeMuerto = __decorate([
    (0, typeorm_1.Entity)({ name: 'mensajes_muertos', schema: 'eventos' })
], MensajeMuerto);
//# sourceMappingURL=mensaje-muerto.entity.js.map