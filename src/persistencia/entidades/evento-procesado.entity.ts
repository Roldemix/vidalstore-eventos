import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'eventos_procesados', schema: 'eventos' })
@Unique('uq_evento_procesado_grupo_evento', ['grupo', 'eventoId'])
export class EventoProcesado {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  grupo!: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;
}
