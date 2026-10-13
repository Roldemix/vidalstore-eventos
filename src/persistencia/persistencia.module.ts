import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoAuditoria } from './entidades/evento-auditoria.entity';
import { MensajeMuerto } from './entidades/mensaje-muerto.entity';
import { Notificacion } from './entidades/notificacion.entity';

const ENTIDADES = [EventoAuditoria, Notificacion, MensajeMuerto];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: ENTIDADES,
        // Solo en desarrollo: crea y altera tablas comparando con las entidades.
        // En produccion se usan migraciones (una columna renombrada podria borrarse con sus datos).
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature(ENTIDADES),
  ],
  exports: [TypeOrmModule],
})
export class PersistenciaModule {}