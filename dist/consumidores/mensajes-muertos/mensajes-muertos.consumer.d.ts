import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MensajeMuerto } from '../../persistencia/entidades/mensaje-muerto.entity';
import { RabbitService } from '../../rabbit/rabbit.service';
export declare class MensajesMuertosConsumer implements OnApplicationBootstrap {
    private readonly rabbit;
    private readonly repo;
    private readonly logger;
    constructor(rabbit: RabbitService, repo: Repository<MensajeMuerto>);
    onApplicationBootstrap(): Promise<void>;
    private procesar;
}
