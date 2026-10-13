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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const rabbit_service_1 = require("./rabbit/rabbit.service");
let AppController = class AppController {
    rabbit;
    dataSource;
    constructor(rabbit, dataSource) {
        this.rabbit = rabbit;
        this.dataSource = dataSource;
    }
    async salud() {
        let postgres = false;
        try {
            await this.dataSource.query('SELECT 1');
            postgres = true;
        }
        catch {
            postgres = false;
        }
        const rabbit = this.rabbit.isConnected();
        return { status: rabbit && postgres ? 'ok' : 'degradado', rabbit, postgres };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('salud'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "salud", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [rabbit_service_1.RabbitService,
        typeorm_1.DataSource])
], AppController);
//# sourceMappingURL=app.controller.js.map