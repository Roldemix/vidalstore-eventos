import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class EventoKafkaDto {
  @IsOptional()
  @IsString()
  usuarioSub!: string;

  @IsString()
  @IsNotEmpty()
  juegoId!: string;

  @IsOptional()
  @IsString()
  tipo?: string;

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
}
