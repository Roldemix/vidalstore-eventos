import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

// Sobre del contrato de eventos (version 1). Todo evento valido lo trae en el
// value; los headers x-evento-id, x-tipo-evento y x-emitido-en se aceptan como
// respaldo para los servicios que todavia no escriben el sobre completo.
export class EventoKafkaDto {
  @IsUUID('all', { message: 'eventoId debe ser un UUID' })
  eventoId!: string;

  @IsString()
  @IsNotEmpty({ message: 'tipo no puede venir vacio' })
  tipo!: string;

  @IsInt()
  @Min(1)
  version!: number;

  @IsISO8601()
  emitidoEn!: string;

  @IsOptional()
  @IsString()
  usuarioSub?: string;

  @IsString()
  @IsNotEmpty({ message: 'juegoId no puede venir vacio' })
  juegoId!: string;

  @IsOptional()
  @IsString()
  ocurridoEn?: string;

  @IsOptional()
  @IsString()
  licenciaId?: string;

  @IsOptional()
  @IsNumber()
  monto?: number;

  @IsOptional()
  @IsNumber()
  precio?: number;

  @IsOptional()
  @IsNumber()
  unidades?: number;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  resultado?: string;

  @IsOptional()
  @IsNumber()
  paginasLeidas?: number;

  @IsOptional()
  @IsNumber()
  duracionSeg?: number;
}
