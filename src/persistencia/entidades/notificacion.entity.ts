import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notificaciones', schema: 'eventos' })
@Check('chk_notificacion_estado', `"estado" IN ('enviada','fallida')`)
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  para!: string;

  @Column({ type: 'text' })
  asunto!: string;

  @Column({ type: 'text' })
  estado!: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId!: string;

  @CreateDateColumn({ name: 'creada_en', type: 'timestamptz' })
  creadaEn!: Date;
}