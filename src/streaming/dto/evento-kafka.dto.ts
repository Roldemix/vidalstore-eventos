import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EventoKafkaDto {
  @IsString()
  @IsNotEmpty()
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
}
