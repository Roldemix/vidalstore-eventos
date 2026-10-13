import { OnApplicationBootstrap } from '@nestjs/common';
import { RabbitService } from '../../rabbit/rabbit.service';
export declare class AvisosConsumer implements OnApplicationBootstrap {
    private readonly rabbit;
    private readonly logger;
    constructor(rabbit: RabbitService);
    onApplicationBootstrap(): Promise<void>;
    private procesar;
    private armarAviso;
}
