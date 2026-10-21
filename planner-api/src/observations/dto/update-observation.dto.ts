import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { MESSAGE_MAX_LENGTH } from '../domain/observation.js';

// Só formato/presença aqui: trim, tamanho e NUL são regra do domínio
// (`changeMessage`), que no PATCH roda depois do 404 e do 409.
export class UpdateObservationDto {
  @ApiProperty({
    example: 'Paciente relata melhora após o ajuste da dose',
    maxLength: MESSAGE_MAX_LENGTH,
  })
  @IsString()
  message!: string;
}
