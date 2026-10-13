import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'eventos_auditoria', schema: 'eventos' })
@Unique('uq_auditoria_evento_id', ['eventoId'])
@Index('idx_auditoria_routing_recibido', ['routingKey', 'recibidoEn'])
export class EventoAuditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'routing_key', type: 'text' })
  routingKey!: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @Column({ name: 'usuario_sub', type: 'text', nullable: true })
  usuarioSub!: string | null;

  @Column({ type: 'jsonb' })
  payload!: unknown;

  @Column({ name: 'emitido_en', type: 'timestamptz' })
  emitidoEn!: Date;

  @CreateDateColumn({ name: 'recibido_en', type: 'timestamptz' })
  recibidoEn!: Date;
}