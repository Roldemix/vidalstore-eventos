import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'catalogo_estado', schema: 'eventos' })
@Unique('uq_catalogo_estado_juego_id', ['juegoId'])
export class CatalogoEstado {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'juego_id', type: 'text' })
  juegoId!: string;

  @Column({ type: 'text' })
  titulo!: string;

  @Column({ type: 'int' })
  precio!: number;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;
}
