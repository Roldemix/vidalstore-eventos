import { Module } from '@nestjs/common';
import { AvisosConsumer } from './avisos.consumer';

@Module({ providers: [AvisosConsumer] })
export class AvisosModule {}