import { DataSource } from 'typeorm';
import { RabbitService } from './rabbit/rabbit.service';
export declare class AppController {
    private readonly rabbit;
    private readonly dataSource;
    constructor(rabbit: RabbitService, dataSource: DataSource);
    salud(): Promise<{
        status: string;
        rabbit: boolean;
        postgres: boolean;
    }>;
}
