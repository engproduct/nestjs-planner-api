import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { MESSAGE_MAX_LENGTH } from '../domain/observation.js';

export class CreateObservationDto {
  @ApiProperty({
    example: 'Paciente relata melhora após o ajuste da dose',
    maxLength: MESSAGE_MAX_LENGTH,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSAGE_MAX_LENGTH)
  // eslint-disable-next-line no-control-regex -- NUL é o que se quer barrar
  @Matches(/^[^\u0000]*$/, {
    message: 'message must not contain NUL characters',
  })
  message!: string;
}
