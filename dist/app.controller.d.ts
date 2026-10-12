import { RabbitService } from './rabbit/rabbit.service';
export declare class AppController {
    private readonly rabbit;
    constructor(rabbit: RabbitService);
    health(): {
        status: string;
        rabbit: boolean;
    };
}
