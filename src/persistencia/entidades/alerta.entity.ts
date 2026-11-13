import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'alertas', schema: 'eventos' })
@Unique('uq_alerta_evento_id', ['eventoId'])
@Unique('uq_alerta_juego_ventana', ['juegoId', 'ventanaInicio', 'ventanaFin'])
@Index('idx_alertas_juego_ventana', ['juegoId', 'ventanaInicio'])
export class Alerta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @Column({ name: 'juego_id', type: 'text' })
  juegoId!: string;

  @Column({ name: 'ventana_inicio', type: 'timestamptz' })
  ventanaInicio!: Date;

  @Column({ name: 'ventana_fin', type: 'timestamptz' })
  ventanaFin!: Date;

  @Column({ name: 'en_error', type: 'int' })
  enError!: number;

  @Column({ name: 'terminadas', type: 'int' })
  terminadas!: number;

  @CreateDateColumn({ name: 'creada_en', type: 'timestamptz' })
  creadaEn!: Date;
}
