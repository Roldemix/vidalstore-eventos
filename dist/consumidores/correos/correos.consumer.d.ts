import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notificacion } from '../../persistencia/entidades/notificacion.entity';
import { RabbitService } from '../../rabbit/rabbit.service';
export declare class CorreosConsumer implements OnApplicationBootstrap {
    private readonly rabbit;
    private readonly repo;
    private readonly logger;
    constructor(rabbit: RabbitService, repo: Repository<Notificacion>);
    onApplicationBootstrap(): Promise<void>;
    private procesar;
}
