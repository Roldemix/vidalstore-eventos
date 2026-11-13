import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'ventas_semana', schema: 'eventos' })
@Unique('uq_venta_semana_evento_id', ['eventoId'])
@Index('idx_ventas_semana_juego', ['juegoId', 'semana'])
export class VentaSemana {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @Column({ name: 'juego_id', type: 'text' })
  juegoId!: string;

  @Column({ type: 'timestamptz' })
  semana!: Date;

  @Column({ type: 'text' })
  tipo!: string;

  @Column({ type: 'int', default: 0 })
  unidades!: number;

  @Column({ type: 'int', default: 0 })
  monto!: number;

  @Column({ name: 'licencia_id', type: 'text', nullable: true })
  licenciaId!: string | null;
}
