import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  Consumer,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
} from '@platformatic/kafka';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Message } from '@platformatic/kafka';
import { EventoKafkaDto } from './dto/evento-kafka.dto';
import { TOPICS } from './topicos';

@Injectable()
export class StreamingConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamingConsumer.name);
  private readonly consumer: Consumer<string, string, string, string>;
  private flujo?: Awaited<ReturnType<StreamingConsumer['crearFlujo']>>;

  constructor() {
    const bootstrapBrokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);

    this.consumer = new Consumer({
      groupId: 'vidalstore-panel',
      clientId: 'vidalstore-panel',
      bootstrapBrokers,
      deserializers: stringDeserializers,
    });
  }

  async onModuleInit(): Promise<void> {
    this.flujo = await this.crearFlujo();
    void this.leer();
  }

  async onModuleDestroy(): Promise<void> {
    await this.flujo?.close();
    await this.consumer.close();
  }

  private crearFlujo() {
    return this.consumer.consume({
      topics: [TOPICS.compras, TOPICS.actividad],
      autocommit: false,
      mode: MessagesStreamModes.COMMITTED,
      fallbackMode: MessagesStreamFallbackModes.EARLIEST,
    });
  }

  private async leer(): Promise<void> {
    if (!this.flujo) return;

    try {
      for await (const mensaje of this.flujo) {
        try {
          await this.registrar(mensaje);
        } catch (err) {
          const motivo = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `evento Kafka inválido (${mensaje.topic}, partición ${mensaje.partition}, offset ${mensaje.offset}): ${motivo}`,
          );
        } finally {
          await mensaje.commit();
        }
      }
    } catch (err) {
      const motivo = err instanceof Error ? err.message : String(err);
      this.logger.error(`consumidor Kafka detenido: ${motivo}`);
    }
  }

  private async registrar(mensaje: Message<string, string, string, string>): Promise<void> {
    let datos: unknown;
    try {
      datos = JSON.parse(mensaje.value);
    } catch {
      throw new Error('el valor no es JSON');
    }

    const dto = plainToInstance(EventoKafkaDto, datos);
    const errores = await validate(dto);
    if (errores.length > 0) {
      throw new Error(
        errores
          .flatMap((error) => Object.values(error.constraints ?? {}))
          .join('; '),
      );
    }

    this.logger.log(
      `evento ${mensaje.topic} registrado (partición ${mensaje.partition}, offset ${mensaje.offset}, usuario ${dto.usuarioSub})`,
    );
  }
}
