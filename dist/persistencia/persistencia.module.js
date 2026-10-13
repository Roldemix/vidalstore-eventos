"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenciaModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const evento_auditoria_entity_1 = require("./entidades/evento-auditoria.entity");
const mensaje_muerto_entity_1 = require("./entidades/mensaje-muerto.entity");
const notificacion_entity_1 = require("./entidades/notificacion.entity");
const ENTIDADES = [evento_auditoria_entity_1.EventoAuditoria, notificacion_entity_1.Notificacion, mensaje_muerto_entity_1.MensajeMuerto];
let PersistenciaModule = class PersistenciaModule {
};
exports.PersistenciaModule = PersistenciaModule;
exports.PersistenciaModule = PersistenciaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.getOrThrow('DB_HOST'),
                    port: Number(config.getOrThrow('DB_PORT')),
                    username: config.getOrThrow('DB_USER'),
                    password: config.getOrThrow('DB_PASSWORD'),
                    database: config.getOrThrow('DB_NAME'),
                    entities: ENTIDADES,
                    synchronize: true,
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature(ENTIDADES),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], PersistenciaModule);
//# sourceMappingURL=persistencia.module.js.map