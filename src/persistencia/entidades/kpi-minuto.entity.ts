import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'kpi_minuto', schema: 'eventos' })
@Unique('uq_kpi_minuto_evento_id', ['eventoId'])
@Index('idx_kpi_minuto_juego_emitido', ['juegoId', 'minuto'])
export class KpiMinuto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @Column({ name: 'juego_id', type: 'text' })
  juegoId!: string;

  @Column({ type: 'timestamptz' })
  minuto!: Date;

  @Column({ type: 'text' })
  tipo!: string;

  @Column({ type: 'int', default: 0 })
  unidades!: number;

  @Column({ type: 'int', default: 0 })
  monto!: number;
}
