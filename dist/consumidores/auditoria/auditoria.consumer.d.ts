import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventoAuditoria } from '../../persistencia/entidades/evento-auditoria.entity';
import { RabbitService } from '../../rabbit/rabbit.service';
export declare class AuditoriaConsumer implements OnApplicationBootstrap {
    private readonly rabbit;
    private readonly repo;
    private readonly logger;
    constructor(rabbit: RabbitService, repo: Repository<EventoAuditoria>);
    onApplicationBootstrap(): Promise<void>;
    private procesar;
}
